from django.shortcuts import render
from django.contrib.auth.decorators import login_required


# Landing page for our application - no login required
# This is the index page at "/"
def landing(request):
    return render(request, 'kipventory/landing.html')

# Main page for our Single Page App (SPA)
@login_required(login_url='/login/')
def app(request):
    return render(request, 'kipventory/app.html')
