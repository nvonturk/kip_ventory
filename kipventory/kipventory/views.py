from django.shortcuts import render

# Create your views here.
def root(request):
    context = {'var': '(this text can change)'}
    return render(request, 'kipventory/index.html', context)
