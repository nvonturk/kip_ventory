from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def landing(request):
    context = {'var': "good" if request.user.is_authenticated else "SAD."}
    return render(request, 'kipventory/landing.html', context)


#@login_required(login_url='/login/')
def app(request):
    return render(request, 'kipventory/app.html')
