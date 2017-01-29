# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-01-29 19:44
from __future__ import unicode_literals

import django.contrib.auth.models
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
            options={
                'ordering': ('name',),
            },
        ),
        migrations.CreateModel(
            name='Item',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('location', models.CharField(max_length=100)),
                ('model_no', models.CharField(max_length=100)),
                ('quantity', models.IntegerField(default=0)),
                ('description', models.TextField(max_length=500)),
            ],
            options={
                'ordering': ('model_no',),
            },
        ),
        migrations.CreateModel(
            name='Request',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_filed', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('description', models.TextField(max_length=500)),
                ('status', models.CharField(choices=[('Waiting', 'Waiting'), ('Approved', 'Approved'), ('Complete', 'Complete')], default='Waiting', max_length=10)),
                ('items', models.ManyToManyField(to='api.Item')),
            ],
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
            options={
                'ordering': ('name',),
            },
        ),
        migrations.CreateModel(
            name='KUser',
            fields=[
            ],
            options={
                'proxy': True,
                'ordering': ('last_name',),
            },
            bases=('auth.user',),
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.AddField(
            model_name='request',
            name='kuser',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='api.KUser'),
        ),
        migrations.AddField(
            model_name='item',
            name='tags',
            field=models.ManyToManyField(to='api.Tag'),
        ),
    ]
