from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib import messages





# Landing page for our application - no login required
# This is the index page at "/"
# Make sure that we are delivered a CSRF cookie from this view
@ensure_csrf_cookie
def landing(request):
    return render(request, 'kipventory/landing.html')


# Main page for our Single Page App (SPA)
def app(request):
    if not request.user.is_authenticated():
        messages.add_message(request, messages.ERROR, 'not-authenticated')
        return redirect('/?next=' + request.path)
    return render(request, 'kipventory/app.html')

# def swagger(request):
#     return render(request, schema_view)
