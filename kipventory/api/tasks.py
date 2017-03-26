# Create your tasks here
from __future__ import absolute_import, unicode_literals
from celery import shared_task, celery

app = Celery('tasks', broker='redis://localhost')

@app.task
def add(x,y):
	return x + y

@shared_task
def add2(x, y):
    return x + y


@shared_task
def mul(x, y):
    return x * y


@shared_task
def xsum(numbers):
    return sum(numbers)