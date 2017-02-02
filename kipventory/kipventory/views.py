from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie


# Landing page for our application - no login required
# This is the index page at "/"
# Make sure that we are delivered a CSRF cookie from this view
@ensure_csrf_cookie
def landing(request):
    return render(request, 'kipventory/landing.html')


# Main page for our Single Page App (SPA)
@login_required(login_url='/login/')
def app(request):
    return render(request, 'kipventory/app.html')


def login(request):
    return render(request, 'kipventory/login.html')
