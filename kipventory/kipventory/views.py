from django.shortcuts import render


def index(request):
    context = {'var': 'testing'}

    if request.user.is_authenticated:
        print("GOOD!")
    else:
        print("SAD.")

    return render(request, 'kipventory/index.html', context)
