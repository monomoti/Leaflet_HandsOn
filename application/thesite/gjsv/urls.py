from django.conf.urls import patterns, url
from gjsv import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^fetch/(?P<type>.+)/$' ,views.fetch, name='fetch'),
    url(r'^update/(?P<type>.+)/$' ,views.update, name='update'),
    url(r'^editor/$',views.editor, name='editor'),
    
)
