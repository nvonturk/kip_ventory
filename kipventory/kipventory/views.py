from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def index(request):
    context = {'var': "good" if request.user.is_authenticated else "SAD."}
    return render(request, 'kipventory/index.html', context)


@login_required(login_url='/login/')
def app(request):
    return render(request, 'kipventory/app.html')
