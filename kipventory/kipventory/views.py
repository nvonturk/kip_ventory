from django.shortcuts import render


def index(request):
    context = {'var': 'testing'}
    return render(request, 'kipventory/index.html', context)
