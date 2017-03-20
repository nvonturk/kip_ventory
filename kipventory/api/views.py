from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework import authentication, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render, get_object_or_404
from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q, F

from . import models, serializers
from rest_framework import pagination
from datetime import datetime
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.views import password_reset, password_reset_confirm
from django.http import HttpResponse

import requests, csv, os, json

class CustomPagination(pagination.PageNumberPagination):
    page_query_param = 'page'
    page_size_query_param = 'itemsPerPage'

    def get_paginated_response(self, data):
        '''
        return Response({
            'num_pages': self.page.paginator.num_pages,
            'count': self.page.paginator.count,
            'results': data
        })
        '''
        return Response({
             "count": self.page.paginator.count,
             "num_pages": self.page.paginator.num_pages,
             "results": data
            })




class ItemListCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Item.objects.all()

    def get_serializer_class(self):
        return serializers.ItemSerializer

    def filter_queryset(self, queryset, request):
        # Search and Tag Filtering
        search = self.request.query_params.get("search")
        tags = self.request.query_params.get("tags")
        excludeTags = self.request.query_params.get("excludeTags")
        q_objs = Q()

        # Search filter
        if search is not None and search != '':
            q_objs &= (Q(name__icontains=search) | Q(model_no__icontains=search) | Q(description__icontains=search) | Q(tags__name__icontains=search))
            queryset = queryset.filter(q_objs).order_by('name')

        # Tags filter
        if tags is not None and tags != '':
            tagsArray = tags.split(",")
            for tag in tagsArray:
                queryset = queryset.filter(tags__name=tag)

        # Exclude tags filter
        if excludeTags is not None and excludeTags != '':
            excludeTagsArray = excludeTags.split(",")
            for tag in excludeTagsArray:
                queryset = queryset.exclude(tags__name=tag)

        return queryset

    def get(self, request, format=None):
        # CHECK PERMISSION
        queryset = self.get_queryset()

        all_items = request.query_params.get('all', False)
        if all_items:
            serializer = self.get_serializer(instance=queryset, many=True)
            d = {"count": 1, 'num_pages': 1, "results": serializer.data}
            return Response(d)

        queryset = self.filter_queryset(queryset, request)

        # Pagination
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

    # manager restricted
    def post(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            itemCreationLog(serializer.data, request.user.pk)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ItemDetailModifyDelete(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_instance(self, item_name):
        try:
            return models.Item.objects.get(name=item_name)
        except models.Item.DoesNotExist:
            raise NotFound('Item {} not found.'.format(item_name))

    def get_serializer_class(self):
        return serializers.ItemSerializer

    def get_queryset(self):
        return models.Item.objects.all()

    def get(self, request, item_name, format=None):
        item = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=item)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, item_name, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        item = self.get_instance(item_name=item_name)

        serializer = self.get_serializer(instance=item, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            itemModificationLog(serializer.data, request.user.pk)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # manager restricted
    def delete(self, request, item_name, format=None):
        if not (request.user.is_superuser):
            d = {"error": "Administrator permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        item = self.get_instance(item_name=item_name)
        item.delete()
        for r in models.Request.objects.all():
            if (r.requested_items.count() == 0):
                r.delete()
        itemDeletionLog(item_name, request.user.pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddItemToCart(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_item(self, item_name):
        try:
            return models.Item.objects.get(name=item_name)
        except models.Item.DoesNotExist:
            raise NotFound("Item '{}' not found.".format(item_name))

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # add an item to your cart
    # need to check if item already exists, and update if it does
    def post(self, request, item_name, format=None):
        item = self.get_item(item_name)

        data = request.data.copy()
        data.update({'owner': request.user})
        data.update({'item': item})

        cartitems = self.get_queryset().filter(item__name=item_name)
        if cartitems.count() > 0:
            serializer = self.get_serializer(instance=cartitems.first(), data=data)
        else:
            serializer = self.get_serializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetOutstandingRequestsByItem(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Request.objects.filter(status='O')

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, item_name, format=None):
        requests = self.get_queryset()
        if request.user.is_staff or request.user.is_superuser:
            requests = self.get_queryset().filter(requested_items__item__name=item_name)
        else:
            requests = self.get_queryset().filter(requested_items__item__name=item_name, requester=request.user.pk)

        # Filter by requester
        user = self.request.query_params.get("user", None)
        if user != None and user != "":
            requests = requests.filter(requester__username=user)

        # Filter by request type
        request_type = self.request.query_params.get("type", None)
        if request_type != None and request_type != "":
            requests = requests.filter(requested_items__request_type=request_type)

        # Pagination
        paginated_queryset = self.paginate_queryset(requests)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

class GetLoansByItem(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Loan.objects.all()

    def get_serializer_class(self):
        return serializers.LoanSerializer

    def get(self, request, item_name, format=None):
        loans = self.get_queryset()
        if request.user.is_staff or request.user.is_superuser:
            loans = loans.filter(item__name=item_name)
        else:
            loans = loans.filter(item__name=item_name, request__requester=request.user.pk)

        # Filter by loan owner
        user = self.request.query_params.get("user", None)
        if user != None and user != "":
            loans = loans.filter(request__requester__username=user)

        # Pagination
        paginated_queryset = self.paginate_queryset(loans)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

class GetTransactionsByItem(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Transaction.objects.filter()

    def get_serializer_class(self):
        return serializers.TransactionSerializer

    def get(self, request, item_name, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        transactions = self.get_queryset()
        transactions = transactions.filter(item__name=item_name)

        # Filter by category (acquisition, loss)
        category = request.query_params.get('category', None)
        if category != None and category != "":
            if category in set(['Acquisition', 'Loss']):
                transactions = transactions.filter(category=category)

        administrator = request.query_params.get('administrator', None)
        if administrator != None and administrator != "":
            try:
                administrator = User.objects.get(username=administrator)
                transactions = transactions.filter(administrator=administrator)
            except User.DoesNotExist:
                pass


        # Pagination
        paginated_queryset = self.paginate_queryset(transactions)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

class GetItemStacks(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Request.objects.all()

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, item_name, format=None):
        requests = models.Request.objects.filter(requester=request.user.pk, status='O', requested_items__item__name=item_name)
        rq = 0
        for r in requests.all():
            for ri in r.requested_items.all():
                if (ri.item.name == item_name):
                    rq += ri.quantity

        loans = models.Loan.objects.filter(request__requester=request.user.pk, item__name=item_name, quantity_loaned__gt=F('quantity_returned'))
        lq = 0
        for l in loans.all():
            lq += (l.quantity_loaned - l.quantity_returned)

        disbursements = models.Disbursement.objects.filter(request__requester=request.user.pk, item__name=item_name)
        dq = 0
        for d in disbursements.all():
            dq += d.quantity

        cart = models.CartItem.objects.filter(owner__pk=request.user.pk, item__name=item_name)
        cq = 0
        for c in cart.all():
            cq += c.quantity

        data = {
            "requested": rq,
            "loaned": lq,
            "disbursed": dq,
            "in_cart": cq,
        }
        return Response(data)


class CustomFieldListCreate(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return serializers.CustomFieldSerializer

    def get_queryset(self):
        return models.CustomField.objects.all()

    def get(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomFieldDetailDelete(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_instance(self, field_name):
        try:
            return models.CustomField.objects.get(name=field_name)
        except:
            raise NotFound("Field '{}' not found.".format(field_name))

    def get_serializer_class(self):
        return serializers.CustomFieldSerializer

    def get_queryset(self):
        return models.CustomField.objects.all()

    def get(self, request, field_name, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        custom_field = self.get_instance(field_name=field_name)
        serializer = self.get_serializer(instance=custom_field)
        return Response(serializer.data)

    def delete(self, request, field_name, format=None):
        if not (request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        custom_field = self.get_instance(field_name=field_name)
        custom_field.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class CustomValueList(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return serializers.CustomValueSerializer

    def get_queryset(self):
        queryset = models.CustomValue.objects.filter(item__name=self.kwargs['item_name'])
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(field__private=False)
        return queryset

    def get(self, request, item_name, format=None):
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

class CustomValueDetailModify(generics.GenericAPIView):
    def get_instance(self, item_name, field_name):
        try:
            return self.get_queryset().get(field__name=field_name)
        except models.CustomValue.DoesNotExist:
            raise NotFound("Field '{}' not found on item '{}'.".format(field_name, item_name))

    def get_serializer_class(self):
        return serializers.CustomValueSerializer

    def get_queryset(self):
        queryset = models.CustomValue.objects.filter(item__name=self.kwargs['item_name'])
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(field__private=False)
        return queryset

    def get(self, request, item_name, field_name, format=None):
        custom_value = self.get_instance(item_name=item_name, field_name=field_name)
        serializer = self.get_serializer(instance=custom_value)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, item_name, field_name, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        custom_value = self.get_instance(item_name=item_name, field_name=field_name)
        # manually force the serializer data to have correct field name
        data.update({'name': field_name})
        serializer = self.get_serializer(instance=custom_value, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CartItemList(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    # restrict this queryset - each user can only see his/her own cart items
    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # view all items in your cart
    def get(self, request, format=None):
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)

        return Response(serializer.data)


class CartItemDetailModifyDelete(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_instance(self, item_name):
        try:
            return self.get_queryset().get(item__name=item_name)
        except models.CartItem.DoesNotExist:
            raise NotFound('Cart item {} not found.'.format(item_name))

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    # restrict this queryset - each user can only see his/her own cart items
    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # view all items in your cart
    def get(self, request, item_name, format=None):
        cartitem = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=cartitem)
        return Response(serializer.data)

    # modify quantity of an item in your cart
    def put(self, request, item_name, format=None):
        cartitem = self.get_instance(item_name=item_name)
        data = request.data.copy()

        data.update({'owner': request.user})
        data.update({'item': cartitem.item})

        serializer = self.get_serializer(instance=cartitem, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # remove an item from your cart
    def delete(self, request, item_name, format=None):
        cartitem = self.get_instance(item_name=item_name)
        cartitem.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RequestListAll(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permissions = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Request.objects.all()

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        status = request.GET.get('status')
        if not (status is None or status=="All"):
            queryset = models.Request.objects.filter(status=status)

        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

class RequestListCreate(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    # restrict this queryset - each user can only see his/her own Requests
    def get_queryset(self):
        return models.Request.objects.filter(requester__pk=self.request.user.pk)

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, format=None):
        queryset = self.get_queryset()

        status = request.GET.get('status')
        if not (status is None or status=="All"):
            queryset = queryset.filter(status=status)

        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

    # generate a request that contains all items currently in your cart.
    def post(self, request, format=None):
        data = request.data.copy()
        data.update({'requester': request.user})

        cart_items = models.CartItem.objects.filter(owner__pk=self.request.user.pk)
        if cart_items.count() <= 0:
            d = {"error": ["There are no items in your cart. Add an item to your cart in order to request it."]}
            return Response(d, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            request_instance = serializer.save()

        for ci in cart_items:
            req_item = models.RequestedItem.objects.create(request=request_instance,
                                                           item=ci.item,
                                                           quantity=ci.quantity,
                                                           request_type=ci.request_type)
            # Insert Create Log
            # Need {serializer.data, initiating_user_pk, 'Request Created'}
            req_item.save()
            requestItemCreation(req_item, request.user.pk, request_instance)
            ci.delete()

        #todo maybe combine this with the requsetItemCreationLog method (involves refactoring of logs)
        sendEmailForNewRequest(request_instance)

        serializer = self.get_serializer(instance=request_instance)
        return Response(serializer.data)

class RequestDetailModifyDelete(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_instance(self, request_pk):
        try:
            return models.Request.objects.get(pk=request_pk)
        except models.Request.DoesNotExist:
            raise NotFound('Request with ID {} not found.'.format(request_pk))

    def get_queryset(self):
        return models.Request.objects.filter(requester__pk=self.request.user.pk)

    def get_serializer_class(self):
        if self.request.method == 'PUT':
            return serializers.RequestPUTSerializer
        return serializers.RequestSerializer

    # MANAGER/OWNER LOCKED
    def get(self, request, request_pk, format=None):
        instance = self.get_instance(request_pk)
        # if admin, see any request.
        # if user, only see your requests
        is_owner = (instance.requester.pk == request.user.pk)
        if not (request.user.is_staff or request.user.is_superuser or is_owner):
            d = {"error": "Manager or owner permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(instance=instance)
        return Response(serializer.data)

    # MANAGER LOCKED - only admins may change the fields on a request
    def put(self, request, request_pk, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data.update({'administrator': request.user})
        instance = self.get_instance(request_pk)

        if not (instance.status == 'O'):
            return Response({"error": "Only outstanding requests may be modified."})

        serializer = self.get_serializer(instance=instance, data=data, partial=True)
        print("DATA", data)
        if serializer.is_valid():
            # check integrity of approval operation
            if data['status'] == 'D':
                # Insert Create Log
                # Need {serializer.data, initiating_user_pk, 'Request Approved'}
                for ri in instance.requested_items.all():
                    requestItemDenial(ri, request.user.pk, instance)
            # need to check that we're not giving out more instances than currently exist
            elif data['status'] == 'A':
                valid_request = True
                ri_data = data.get('requested_items', [])
                ri_instances = []
                for ri_instance, ri_dict in zip(instance.requested_items.all(), ri_data):
                    # ri_instance = instance.requested_items.all().get(item__name=ri_data.get('item'))
                    ri_instances.append(ri_instance)
                    if (ri_instance.item.quantity < int(ri_dict.get('quantity'))):
                        valid_request = False
                if valid_request:
                    loangroup = models.LoanGroup.objects.create(request=instance)
                    for ri_instance, ri_dict in zip(ri_instances, ri_data):
                        new_quantity = int(ri_dict.get('quantity'))
                        new_type = ri_dict.get('request_type')
                        ri_instance.request_type = new_type
                        ri_instance.quantity = new_quantity
                        ri_instance.save()
                        if ri_instance.request_type == models.LOAN:
                            loan = models.createLoanFromRequestItem(ri_instance)
                            # requestItemApproval(ri_instance.item, request.user.pk, data)
                            loan.loan_group = loangroup
                            loan.save()
                            print(instance)
                            requestItemApprovalLoan(ri_instance.item, request.user.pk, instance)
                        elif ri_instance.request_type == models.DISBURSEMENT:
                            disbursement = models.createDisbursementFromRequestItem(ri_instance)
                            requestItemApprovalDisburse(ri_instance.item, request.user.pk, instance)
                else:
                    return Response({"error": "Cannot satisfy request."}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # OWNER LOCKED
    def delete(self, request, request_pk, format=None):
        instance = self.get_instance(request_pk)
        is_owner = (request.user.pk == instance.requester.pk)
        if not (is_owner):
            d = {"error": "Owner permissions required"}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        if not (instance.status == 'O'):
            d = {"error": "Cannot delete an approved/denied request."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        instance.delete()
        # Don't post log here since its as if it never happened
        return Response(status=status.HTTP_204_NO_CONTENT)

class LoanListAll(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.LoanGroup.objects.all();

    def get_serializer_class(self):
        return serializers.LoanGroupSerializer

    def filter_queryset(self, queryset, request):
        status = request.query_params.get('status', None)
        if status == "outstanding":
            queryset = queryset.filter(quantity_loaned__gt=F('quantity_returned'))
        elif status == "returned":
            queryset = queryset.filter(quantity_loaned=F('quantity_returned'))

        item = request.query_params.get('item', None)
        if item != None and item != "":
            queryset = queryset.filter(item__name=item)

        return queryset

    def get(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset, request)

        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

class LoanList(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.LoanGroup.objects.filter(request__requester=self.request.user);

    def get_serializer_class(self):
        return serializers.LoanGroupSerializer

    def get(self, request, format=None):
        queryset = self.get_queryset()

        # filter by user who requested these loans
        user = request.query_params.get('user', None)
        if user != None and user != "":
            q = Q(request__requester__username__icontains=user)
            queryset = queryset.filter(q)

        serializer = self.get_serializer(instance=queryset, many=True)
        data = serializer.data

        status = request.query_params.get('status', None)
        item = request.query_params.get('item', None)

        results = []
        for d in data:
            request = d.get('request')
            loans = d.get('loans')
            keep_result = False
            if (status == None or status == "") and (item == None or item == ""):
                results.append({"request": request, "loans": loans})
            else:
                if status != None and status != "":
                    status = status.lower()
                    if status == "outstanding":
                        for loan in loans:
                            if (int(loan['quantity_returned']) != int(loan['quantity_loaned'])):
                                keep_result = True
                                break

                    if status == "returned":
                        for loan in loans:
                            if (int(loan['quantity_returned']) == int(loan['quantity_loaned'])):
                                print("HERE")
                                keep_result = True
                                break

                if not keep_result and (item != None and item != ""):
                    item = item.lower()
                    for loan in loans:
                        if item in loan['item']['name'].lower():
                            keep_result = True
                            break

                if keep_result:
                    results.append({"request": request, "loans": loans})


            # loans_to_remove = []
            # for i, loan in enumerate(loans):
            #     # item name filter
            #     if item != None and item != "":
            #         item = item.lower()
            #         if item.lower() not in loan['item']['name'].lower():
            #             loans_to_remove.append(i)
            #
            #     # loan status filter
            #     if status is not None and status != "":
            #         status = status.lower()
            #         if status == "outstanding":
            #             if (int(loan['quantity_returned']) == int(loan['quantity_loaned'])):
            #                 loans_to_remove.append(i)
            #
            #         elif status == "returned":
            #             if (int(loan['quantity_loaned']) != int(loan['quantity_returned'])):
            #                 loans_to_remove.append(i)
            #
            # loan_results = [x for j, x in enumerate(loans) if j not in loans_to_remove]
            #
            # if loan_results != []:
            #     results.append({"request": request, "loans": loan_results})

        results = self.paginate_queryset(results)
        response = self.get_paginated_response(results)
        return response


class LoanDetailModify(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = models.Loan.objects.all()
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(request__requester=self.request.user)
        return queryset

    def get_serializer_class(self):
        return serializers.LoanSerializer

    def get_instance(self, pk):
        try:
            return models.Loan.objects.get(pk=pk)
        except models.Loan.DoesNotExist:
            raise NotFound('Loan {} not found.'.format(pk))

    def get(self, request, pk, format=None):
        loan = self.get_instance(pk=pk)
        serializer = self.get_serializer(instance=loan)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        loan = self.get_instance(pk=pk)
        data = request.data.copy()
        data.update({"loan": loan})
        serializer = self.get_serializer(instance=loan, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConvertLoanToDisbursement(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = models.Loan.objects.all()
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(request__requester=self.request.user)
        return queryset

    def get_serializer_class(self):
        return serializers.ConversionSerializer

    def get_instance(self, pk):
        try:
            return models.Loan.objects.get(pk=pk)
        except models.Loan.DoesNotExist:
            raise NotFound('Loan {} not found.'.format(pk))

    def post(self, request, pk, format=None):
        loan = self.get_instance(pk=pk)
        data = request.data.copy()
        data.update({"loan": loan})
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DisbursementList(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = models.Disbursement.objects.filter(request__requester=self.request.user)
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(request__requester=self.request.user)
        return queryset

    def get_serializer_class(self):
        return serializers.DisbursementSerializer

    def get(self, request, format=None):
        queryset = self.get_queryset()
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

class DisbursementDetail(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = models.Disbursement.objects.all()
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(request__requester=self.request.user)
        return queryset

    def get_serializer_class(self):
        return serializers.DisbursementSerializer

    def get_instance(self, pk):
        try:
            return models.Disbursement.objects.get(pk=pk)
        except models.Disbursement.DoesNotExist:
            raise NotFound('Disbursement {} not found.'.format(pk))

    def get(self, request, pk, format=None):
        disbursement = self.get_instance(pk=pk)
        serializer = self.get_serializer(instance=disbursement)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def post_user_login(request, format=None):
    username = request.data.get('username', None)
    password = request.data.get('password', None)
    next_url = request.data.get('next', None)

    user = authenticate(username=username, password=password)

    if hasattr(user, 'kipventory_user'):
        if user.kipventory_user.is_duke_user:
            messages.add_message(request._request, messages.ERROR, 'login-via-duke-authentication')
            return redirect('/')

    if user is not None:
        login(request, user)
        if len(next_url) > 0:
            return redirect(next_url)
        return redirect('/app/inventory/')
    else:
        # Return an 'invalid login' error message.
        messages.add_message(request._request, messages.ERROR, 'invalid-login-credentials')
        return redirect('/')

class UserList(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        return serializers.UserGETSerializer

    def get(self, request, format=None):
        users = self.get_queryset()
        serializer = self.get_serializer(instance=users, many=True)
        return Response(serializer.data)

class UserCreate(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        return serializers.UserPOSTSerializer

    def post(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.create_user(**serializer.validated_data)
            #todo do we log this for net id creations?
            userCreationLog(serializer.data, request.user.pk)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetCurrentUser(generics.GenericAPIView):
    queryset = None
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.UserGETSerializer

    def get(self, request, format=None):
        serializer = self.get_serializer(instance=request.user)
        return Response(serializer.data)
        user = request.user
        return Response({
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "profile" : user.profile
        })

@api_view(['PUT'])
@permission_classes((permissions.IsAuthenticated,))
def edit_user(request, username, format=None):
    if request.method == 'PUT':
        if not request.user.is_superuser and not (request.user.username == username): #todo fix this. users should be able to edit any of their attributes except permissions
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        jsonData = json.loads(request.body.decode("utf-8"))
        user = models.User.objects.get(username=username)

        serializer = serializers.UserPUTSerializer(instance=user, data=jsonData, partial=True)
        if serializer.is_valid():
            print("saving user serializer")
            serializer.save()
            return Response(serializer.data)
        print("error saving user {} ".format(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetNetIDToken(generics.GenericAPIView):
    queryset = None
    permission_classes = (permissions.AllowAny,)
    serializer_class = None

    def get(self, request, format=None):
        code = request.query_params.get('code')

        p = {'grant_type' : 'authorization_code', 'code' : code, 'redirect_uri' : "https://colab-sbx-226.oit.duke.edu/api/netidtoken/", 'client_id' : 'kipventory', 'client_secret' : 'sn6j#IzL*PXUxmPKvJ7Gs+1vzukxlx#yoFDnh%WI7GzLs$=1so'}

        token_request = requests.post('https://oauth.oit.duke.edu/oauth/token.php', data = p)
        token_json = token_request.json()

        headers = {'Accept' : 'application/json', 'x-api-key' : 'kipventory', 'Authorization' : 'Bearer '+token_json['access_token']}

        identity = requests.get('https://api.colab.duke.edu/identity/v1/', headers= headers)
        identity_json = identity.json()

        netid = identity_json['netid']
        email = identity_json['eduPersonPrincipalName']
        first_name = identity_json['firstName']
        last_name = identity_json['lastName']

        user_count = User.objects.filter(username=netid).count()
        if user_count == 1:
            user = User.objects.get(username=netid)
            login(request, user)
            return redirect('/app/')
        elif user_count == 0:
            user = User.objects.create_user(username=netid, email=email, password=None, first_name=first_name, last_name=last_name)
            login(request, user)
            return redirect('/app/')
        else:
            print("Multiple NetId Users this is big time wrong need to throw an error")
            return redirect('/app/')


class TagListCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.TagSerializer
    pagination_class = CustomPagination

    def get_instance(self, tag_name):
        try:
            return models.Tag.objects.get(name=tag_name)
        except models.Tag.DoesNotExist:
            raise NotFound('Tag {} not found.'.format(tag_name))

    def get_queryset(self):
        return models.Tag.objects.all()

    def get(self, request, format=None):
        tags = self.get_queryset()

        paginated_tags = self.paginate_queryset(tags)

        if(request.query_params.get("all") == "true"):
            serializer = self.get_serializer(instance=tags, many=True)
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(instance=paginated_tags, many=True)
            response = self.get_paginated_response(serializer.data)
            return response

        # return response

    def post(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Maybe put into its own view? Seems like a lot for now
    # manager restricted
    def delete(self, request, format=None):
        if not (request.user.is_staff):
            d = {"error": "Administrator permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        tag = self.get_instance(tag_name=request.query_params.get("name"))
        tag.delete()
        # Insert Delete Log
        # Need {serializer.data, initiating_user_pk, 'Item Changed'}
        # itemDeletionLog(item_name, request.user.pk)
        #TODO NEED TO LOG DELETION HERE
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogList(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Log.objects.all()

    def get_serializer_class(self):
        return serializers.LogSerializer

    def get(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            # Not allowed to see logs if not manager/admin
            return Response(status=status.HTTP_403_FORBIDDEN)

        user = request.query_params.get("user")
        item = request.query_params.get("item")
        endDate = request.query_params.get("endDate")
        startDate = request.query_params.get("startDate")

        # Create Datetimes from strings
        logs = self.get_queryset()
        q_objs = Q()
        if user is not None and user != '':
            q_objs &= (Q(affected_user__username=user) | Q(initiating_user__username=user))
        logs = logs.filter(q_objs).distinct()
        if item is not None and item != '':
            logs = logs.filter(item__name=item)
        if startDate is not None and startDate != '' and endDate is not None and endDate != '':
            startDate, endDate = startDate.split(" "), endDate.split(" ")
            stimeZone, etimeZone = startDate[5], endDate[5]
            stimeZone, etimeZone = stimeZone.split('-'), etimeZone.split('-')
            startDate, endDate = startDate[:5], endDate[:5]
            startDate, endDate = " ".join(startDate), " ".join(endDate)
            startDate, endDate = startDate + " " + stimeZone[0], endDate + " " + etimeZone[0]

            startDate = datetime.strptime(startDate, "%a %b %d %Y %H:%M:%S %Z").date()
            endDate = datetime.strptime(endDate, "%a %b %d %Y %H:%M:%S %Z").date()
            startDate = datetime.combine(startDate, datetime.min.time())
            endDate = datetime.combine(endDate, datetime.max.time())
            startDate = timezone.make_aware(startDate, timezone.get_current_timezone())
            endDate = timezone.make_aware(endDate, timezone.get_current_timezone())

            logs = logs.filter(date_created__range=[startDate, endDate])

        queryset = logs
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response



class TransactionListCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Transaction.objects.all()

    def get_serializer_class(self):
        return serializers.TransactionSerializer

    def get(self, request, format=None):
        queryset = self.get_queryset()

        category = request.GET.get('category')
        if not (category is None or category==""):
            queryset = models.Transaction.objects.filter(category=category)

        # Pagination
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response


    def post(self, request, format=None):
        #todo django recommends doing this in middleware
        data = request.data.copy()
        data['administrator'] = request.user

        serializer = self.get_serializer(data=data)
        if serializer.is_valid(): #todo could move the validation this logic into serializer's validate method
            quantity = serializer.validated_data.get('quantity', 0)
            try:
                item = models.Item.objects.get(name=serializer.validated_data.get('item'))
                item.quantity -= quantity
                item.save()
            except:
                return Response({"name": ["Item with name '{}' does not exist.".format(serializer.validated_data.get('name', None))]})
            transactionCreationLog(item, request.user.pk, request.data['category'], quantity)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TokenPoint(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        if Token.objects.filter(user=request.user).count() > 0:
            #User has a token, return created token
            print(Token.objects.get(user=request.user).key)
            return Response({"token": Token.objects.get(user=request.user).key})
        else:
            token = Token.objects.create(user=request.user)
            print(token.key)
            return Response({"token": token.key})


class BulkImportTemplate(APIView):
    permissions = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        schema = ["name", "model_no", "quantity", "description", "tags"]
        for cf in models.CustomField.objects.all():
            schema.append(cf.name)

        # construct a blank csv file template
        with open('template.csv', 'w') as template:
            wr = csv.writer(template)
            wr.writerow(schema)

        template = open('template.csv', 'rb')
        response = HttpResponse(content=template)
        response['Content-Type'] = 'text/csv'
        response['Content-Disposition'] = 'attachment; filename="import_template.csv"'
        os.remove('template.csv')
        return response

class BulkImport(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)


    def post(self, request, format=None):
        if not request.user.is_superuser:
            d = {"error": "Administrator permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data.update({"administrator": request.user})
        serializer = self.get_serializer(data=data)

        if serializer.is_valid():
            print("HERE")
            inputfile = request.FILES['data']
            fout = open('importtempfile.csv', 'wb')
            for chunk in inputfile.chunks():
                fout.write(chunk)
            fout.close()

            header = []
            contents = []
            firstRow = True
            numRows = 0
            errors = {}

            with open('importtempfile.csv', 'r') as f:
                reader = csv.reader(f)
                for row in reader:
                    if len("".join(row)) == 0:
                        continue
                    else:
                        if firstRow:
                            header = [x for x in row]
                            firstRow = False
                        else:
                            contents.append([x for x in row])
                            numRows += 1

            os.remove('importtempfile.csv')
            indices = {}
            name_index = 0
            model_no_index = 0
            quantity_index = 0
            description_index = 0
            tags_index = 0
            for (i, column_name) in enumerate(header):
                indices[column_name] = i

            # Parse all known item fields (intrinsic)
            name_index = indices['name']
            names = [row[name_index] for row in contents]
            indices.pop('name')

            model_no_index = indices['model_no']
            model_nos = [row[model_no_index] for row in contents]
            indices.pop('model_no')

            quantity_index = indices['quantity']
            quantities = [row[quantity_index] for row in contents]
            indices.pop('quantity')

            description_index = indices['description']
            descriptions = [row[description_index] for row in contents]
            indices.pop('description')

            tags_index = indices['tags']
            tags = [row[tags_index] for row in contents]
            indices.pop('tags')

            # Now, indices contains only custom field headers

            custom_field_errors = []
            for field_name, index in indices.items():
                try:
                    cf = models.CustomField.objects.get(name=field_name)
                    values = [row[index] for row in contents]
                    cf_errors = []
                    for i, val in enumerate(values):
                        try:
                            val = models.FIELD_TYPE_DICT[cf.field_type](val)
                            contents[i][index] = val
                        except:
                            cf_errors.append("Value '{}' is not of type '{}' (row {}).".format(val, models.FIELD_TYPE_DICT[cf.field_type].__name__, i))

                    if cf_errors:
                        custom_field_errors.append({field_name: cf_errors})

                except models.CustomField.DoesNotExist:
                    custom_field_errors.append({field_name: ["Custom field '{}' does not exist (column {}).".format(field_name, i)]})
            # check unique names
            nameset = set()
            name_errors = []
            for i, name in enumerate(names):
                if name == "" or name == None:
                    name_errors.append("Name must not be blank (row {}).".format(i))
                if name in nameset:
                    name_errors.append("Name '{}' appears multiple times.".format(name))
                try:
                    other_item = models.Item.objects.get(name=name)
                    name_errors.append("An item with name '{}' (row {}) already exists.".format(name, i))
                except models.Item.DoesNotExist:
                    pass

            # check valid (positive) integer quantities
            quantity_errors = []
            for i, q in enumerate(quantities):
                if q == None or q == "":
                    quantity_errors.append("Quantity must not be blank (row {}).".format(i))
                else:
                    try:
                        q = int(q)
                        quantities[i] = q
                        if q < 0:
                            quantity_errors.append("Negative quantity {} (row {}).".format(q, i))
                    except:
                            quantity_errors.append("Value '{}' is not an integer (row {}).".format(q, i))

            if name_errors:
                errors.update({"name": name_errors})
            if quantity_errors:
                errors.update({"quantity": quantity_errors})
            if custom_field_errors:
                for e in custom_field_errors:
                    errors.update(e)
            if errors:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

            # we know we've passed the validation check - go ahead and make all the items
            created_items = []
            created_tags  = []
            for i in range(numRows):
                # create the base item
                item = models.Item(name=names[i], model_no=model_nos[i], quantity=quantities[i], description=descriptions[i])
                item.save()
                itemCreationBILog(item, request.user)
                # parse and create tags
                tag_string = tags[i]
                # remove empty tags (ie. a blank cell)
                tag_list = [x.strip() for x in tag_string.split(",") if len(x) > 0]
                for tag in tag_list:
                    try:
                        tag = models.Tag.objects.get(name=tag)
                    except models.Tag.DoesNotExist:
                        tag = models.Tag.objects.create(name=tag)
                        created_tags.append(tag.name)
                    item.tags.add(tag)
                item.save()

                # set custom field values on created item
                for custom_value in item.values.all():
                    field_index = indices[custom_value.field.name]
                    val = contents[i][field_index]
                    setattr(custom_value, custom_value.field.field_type, val)
                    custom_value.save()
                item.save()
                created_items.append(item.name)

            d = {
                    "items" : [name for name in created_items],
                    "tags"  : [tag  for tag  in created_tags]
                }

            return Response(d)
        else:
            return Response({"no_file": ["Please select a .csv file."]}, status=status.HTTP_400_BAD_REQUEST)

    def get_serializer_class(self):
        return serializers.BulkImportSerializer

    def get_queryset(self):
        return models.BulkImport.Objects.all()


class DisburseCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    queryset = models.Request.objects.all()

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def post(self, request, format=None):
        # check that all item names and quantities are valid
        errors = {}

        # validate user input
        data = {}
        data.update(request.data)
        requester = data.get('requester')[0]
        closed_comment = data.get('closed_comment')[0]
        items = data['items']
        quantities = data['quantities']

        try:
            requester = User.objects.get(username=requester)
        except User.DoesNotExist:
            return Response({"error": "Could not find user with username '{}'".format(requester)})

        data = {}
        data.update({'requester': requester, 'open_comment': "Administrative disbursement to user '{}'".format(requester.username)})

        # Verify that the disbursement quantities are valid (ie. less than or equal to inventory stock)
        for i in range(len(items)):
            item = None
            try:
                item = models.Item.objects.get(name=items[i])
            except models.Item.DoesNotExist:
                return Response({"error": "Item '{}' not found.".format(items[i])})
            items[i] = item
            # convert to int
            quantity = int(quantities[i])
            quantities[i] = quantity
            if quantity > item.quantity:
                errors.update({'error': "Request for {} instances of '{}' exceeds current stock of {}.".format(quantity, item.name, item.quantity)})

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # if we made it here, we know we can go ahead and create the request, all the request items, and approve it
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            request_instance = serializer.save()

        data = {}
        data.update({'administrator': request.user})
        data.update({'closed_comment': closed_comment})
        data.update({'status': 'A'})

        serializer = serializers.RequestPUTSerializer(instance=request_instance, data=data, partial=True)

        # We're good to go!
        if serializer.is_valid():
            for item, quantity in zip(items, quantities):
                # Create the request item
                req_item = models.RequestedItem.objects.create(item=item, quantity=quantity, request=request_instance)
                req_item.save()

                # Decrement the quantity remaining on the Item
                setattr(item, 'quantity', (item.quantity - quantity))
                item.save()

                # Logging
                requestItemCreation(req_item, request.user.pk, request_instance)
                requestItemApprovalDisburse(item, request.user.pk, request_instance)

            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



def itemCreationLog(data, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        item = models.Item.objects.get(name=data['name'])
    except models.Item.DoesNotExist:
        raise NotFound('Item {} not found.'.format(data['name']))
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    quantity = data['quantity']
    message = 'Item {} created by {}'.format(data['name'], initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Item Creation', message=message, affected_user=affected_user)
    log.save()

def itemCreationBILog(item, initiating_user):
    message = 'Item {} created by {}'.format(item.name, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=item.quantity, category='Item Creation', message=message, affected_user=None)
    log.save()

def itemModificationLog(data, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        item = models.Item.objects.get(name=data['name'])
    except models.Item.DoesNotExist:
        raise NotFound('Item {} not found.'.format(data['name']))
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    quantity = data['quantity']
    message = 'Item {} modified by {}'.format(data['name'], initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Item Modification', message=message, affected_user=affected_user)
    log.save()

def itemDeletionLog(item_name, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Item {} deleted by {}'.format(item_name, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Item Deletion', message=message, affected_user=affected_user)
    log.save()

def requestItemCreation(request_item, initiating_user_pk, requestObj):
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = None
    request = requestObj
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} created by {}'.format(request_item.item.name, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, request=request, quantity=quantity, category='Request Item Creation', message=message, affected_user=affected_user)
    log.save()

def sendEmailForNewRequest(request):
    user = request.requester
    request_items = models.RequestItem.objects.filter(request=request)
    subscribed_managers = User.objects.filter(is_staff=True).filter(profile__subscribed=True)
    subject = "subject"
    text_content = "text_content"
    html_content = "<p>This is an <strong>important</strong> message.</p>"
    from_email = "kipventory@gmail.com"
    to_emails = []
    bcc_emails = [subscribed_manager.email for subscribed_manager in subscribed_managers]
    from django.core.mail import EmailMultiAlternatives
    msg = EmailMultiAlternatives(subject, text_content, from_email, to_emails, bcc_emails)
    msg.attach_alternative(html_content, "text/html")
    msg.send()

def requestItemDenial(request_item, initiating_user_pk, requestObj):
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = request_item.request.requester
    request = requestObj
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} denied by {}'.format(request_item.item.name, initiating_user.username)
    log = models.Log(item=item, request=request, initiating_user=initiating_user, quantity=quantity, category='Request Item Denial', message=message, affected_user=affected_user)
    log.save()

# def requestItemApproval(request_item, initiating_user_pk, requestObj):
#     item = request_item.item
#     initiating_user = None
#     quantity = request_item.quantity
#     affected_user = request_item.request.requester
#     request = requestObj
#     try:
#         initiating_user = User.objects.get(pk=initiating_user_pk)
#     except User.DoesNotExist:
#         raise NotFound('User not found.')
#     message = 'Request Item for item {} approved by {}'.format(request_item.item.name, initiating_user.username)
#     log = models.Log(item=item, request=request, initiating_user=initiating_user, quantity=quantity, category='Request Item Approval', message=message, affected_user=affected_user)
#     log.save()

def requestItemApprovalLoan(request_item, initiating_user_pk, requestObj):
    item = request_item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = requestObj.requester
    request = requestObj
    category = 'Request Item Approval: Loan'
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} approved by {} as a {}'.format(item.name, initiating_user.username, category)
    log = models.Log(item=item, request=request, initiating_user=initiating_user, quantity=quantity, category=category, message=message, affected_user=affected_user)
    log.save()

def requestItemApprovalDisburse(request_item, initiating_user_pk, requestObj):
    item = request_item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = requestObj.requester
    request = requestObj
    category = 'Request Item Approval: Disburse'
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} approved by {} as a {}'.format(item.name, initiating_user.username, category)
    log = models.Log(item=item, request=request, initiating_user=initiating_user, quantity=quantity, category=category, message=message, affected_user=affected_user)
    log.save()


def userCreationLog(data, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    try:
        affected_user = User.objects.get(username=data['username'])
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = "User {} was created by {}".format(affected_user, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='User Creation', message=message, affected_user=affected_user)
    log.save()

def transactionCreationLog(item, initiating_user_pk, category, amount):
    item = item
    initiating_user = None
    quantity = amount
    affected_user = None
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = "User {} created a {} transaction on item {} of quantity {} and it now has a quantity of {}".format(initiating_user, category, item, quantity, item.quantity)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Transaction Creation', message=message, affected_user=affected_user)
    log.save()

@api_view(['GET'])
@permission_classes((permissions.IsAuthenticated,))
def get_subscribed_managers(request):
    if request.method == 'GET':
        subscribed_managers = User.objects.filter(is_staff=True).filter(profile__subscribed=True)
        serializer = serializers.UserGETSerializer(instance=subscribed_managers, many=True)
        return Response(serializer.data)

