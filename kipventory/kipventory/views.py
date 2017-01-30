from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Landing page for our application - no login required
# This is the index page at "/"
def index(request):
    context = {'var': "good" if request.user.is_authenticated else "SAD."}
    return render(request, 'kipventory/index.html', context)

# Main page for our Single Page App (SPA)
@login_required(login_url='/login/')
def app(request):
    return render(request, 'kipventory/app.html', {'var': "good" if request.user.is_authenticated else "SAD."})
