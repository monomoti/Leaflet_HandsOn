#coding:UTF-8

from django.shortcuts import get_object_or_404, render
from django.http import HttpResponseRedirect, HttpResponse
from django.conf import settings
import json
import time
import codecs
import logging

def index(request):

    return render(request,'gjsv/index.html',{'message':"こんにちは！"})
    
def fetch(request,type):
    rtn = ""
    
    try:
        f = open(settings.STATIC_ROOT + type + '.js',"r")
        str = f.read()
        f.close()
        j = json.loads(str)
        rtn = json.dumps(j,sort_keys=True,indent=4)

    except Exception, e:
        rtn = json.dumps({'status':0,'rtnmsg':e.message})
        raise e
    finally:
        response =  HttpResponse(rtn)# content_type='application/json'
        response["Access-Control-Allow-Origin"] = "*"  
        # response["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"  
        response["Access-Control-Allow-Methods"] = "*"  
        response["Access-Control-Max-Age"] = "-1"  
        response["Access-Control-Allow-Headers"] = "*"

        return response

    

    # return HttpResponse(json.dumps(j,sort_keys=True,indent=4))# content_type='application/json'
    
    
    
        

    
def update(request,type):
    logger = logging.getLogger('dev')
    
    ajax = request.is_ajax()
    logger.debug("ajax: %d",ajax)
    # logger.error("key: %s","hahahahahaha")
    
    for key, value in request.POST.iteritems():
        logger.debug("key: %s",key)

    data = request.POST['saveData']
    
    rtn = ""
    try:
        f = codecs.open(settings.STATIC_ROOT + type + '.js',"w","utf-8")
        f.write(data)
        f.close()
    
        rtn = json.dumps({'status':1,'rtnmsg':'succeeded'})
    except Exception, e:
        rtn = json.dumps({'status':0,'rtnmsg':e.message})

    # return HttpResponse(rtn,content_type='application/json')
    
    response =  HttpResponse(rtn,content_type='application/json') 
    response["Access-Control-Allow-Origin"] = "*"  
    response["Access-Control-Allow-Methods"] = "*"  
    response["Access-Control-Max-Age"] = "-1"  
    response["Access-Control-Allow-Headers"] = "*"

    return response
    
    
def editor(request):
    ts = time.time()
    
    return render(request,'gjsv/editor.html',{'ts':ts})
    