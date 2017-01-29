from django.shortcuts import render


def index(request):
    context = {'var': "good" if request.user.is_authenticated else "SAD."}
    return render(request, 'kipventory/index.html', context)
