define(["jquery","underscore","backbone","apputil","config"],function($,_,Backbone,apputil,config){

    var PointGJModel = Backbone.Model.extend({
        // url: config.API_ROOT_URL + "/gjsv/fetch/points/",
        url: "./stub/points.js",
        initialize:function(){
            this.set("features",new PointCollection());  
        },
        parse:function(response){
            this.get("features").resetWithGJFeatures(response.features);
            delete response.features;

            return response;
        },
        saveAsGeoJSON:function(){            
            var data = JSON.stringify(this.toGeoJSON());
            var that = this;
            postToServer(config.API_ROOT_URL + "/gjsv/update/points/",{saveData:data},function(data){that.dataSaved(data)},this.dataSaveFailed);
        },
        toGeoJSON:function(){
            var rtn = {"type": "FeatureCollection","features":[]};
            this.get("features").each(function(m){
                var obj = {"type": "Feature","properties":{},"geometry":{"type" : "POINT"}};
                _.each(m.keys(),function(k){
                    if (k != "coordinates"){
                       obj.properties[k] = m.get(k); 
                    }
                },this);
                var coordinates = m.get("coordinates");
                obj.geometry.coordinates = [coordinates[1],coordinates[0]];
                rtn.features.push(obj);
            },this);
            return rtn;
        },
        dataSaved:function(data){
            this.trigger("saved");
            this.get("features").trigger("reset");
        },
        dataSaveFailed:function(xhr, textStatus, errorThrown){
            console.log(textStatus);
        }
       
   });
   
   var PointCollection = Backbone.Collection.extend({
       model:PointModel,
       resetWithGJFeatures:function(features,options){
           var models = [];
           _.each(features,function(f){
               var obj = _.clone(f.properties,true);
               obj.coordinates = [f.geometry.coordinates[1],f.geometry.coordinates[0]];
               models.push(new PointModel(obj));
           },this);
           this.reset(models,options);
       }
   });
   var PointModel = Backbone.Model.extend({       
   });
   
   var RouteGJModel = Backbone.Model.extend({
       // url:config.API_ROOT_URL + "/gjsv/fetch/lines/",
       url:"./stub/lines.js",
       initialize:function(){
           this.set("features",new RouteCollection());  
       },       
       parse:function(response){
           this.get("features").resetWithGJFeatures(response.features);
           delete response.features;
           
           return response;
       },
       saveAsGeoJSON:function(){            
           var data = JSON.stringify(this.toGeoJSON());
           var that = this;
           postToServer(config.API_ROOT_URL + "/gjsv/update/lines/",{saveData:data},function(data){that.dataSaved(data)},this.dataSaveFailed);
       },
       toGeoJSON:function(){
           var rtn = { "type": "FeatureCollection","features":[]};
           this.get("features").each(function(m){
               var obj = {"type": "Feature","properties":{},"geometry":{"type" : "LineString"}};
               _.each(m.keys(),function(k){
                   if (k != "coordinates"){
                      obj.properties[k] = m.get(k); 
                   }
               },this);
               var coordinates = m.get("coordinates");
               obj.geometry.coordinates = _.map(coordinates,function(c){return [c[1],c[0]]});
               rtn.features.push(obj);
           },this);
           
           return rtn;
       },
       dataSaved:function(data){
           this.trigger("saved");
           this.get("features").trigger("reset");           
       },
       dataSaveFailed:function(xhr, textStatus, errorThrown){
           console.log(textStatus);
       }
       
   });
   
   var RouteCollection = Backbone.Collection.extend({
       model:RouteModel,
       resetWithGJFeatures:function(features,options){
           var models = [];
           _.each(features,function(f){
               var obj = f.properties ? _.clone(f.properties,true) : {};
               obj.coordinates = _.map(f.geometry.coordinates,function(c){return [c[1],c[0]]});
               models.push(new RouteModel(obj));
           },this);
           this.reset(models,options);
         }
       
   });
   
   var RouteModel = Backbone.Model.extend({
   });

   var AreaGJModel = Backbone.Model.extend({
       // url:config.API_ROOT_URL + "/gjsv/fetch/areas/",
       url:"./stub/areas.js",
       initialize:function(){
           this.set("features",new AreaCollection());  
       },
       parse:function(response){
           this.get("features").resetWithGJFeatures(response.features);
           delete response.features;
           
           return response;
       },
       saveAsGeoJSON:function(){            
           var data = JSON.stringify(this.toGeoJSON());
           var that = this;
           postToServer(config.API_ROOT_URL + "/gjsv/update/areas/",{saveData:data},function(data){that.dataSaved(data)},this.dataSaveFailed);
       },
       toGeoJSON:function(){
           var rtn = { "type": "FeatureCollection","features":[]};
           this.get("features").each(function(m){
               var obj = {"type": "Feature","properties":{},"geometry":{"type" : "Polygon"}};
               _.each(m.keys(),function(k){
                   if (k != "coordinates"){
                      obj.properties[k] = m.get(k); 
                   }
               },this);               
               var circleCoordinates = m.get("coordinates");
               obj.geometry.coordinates = [];
               _.each(circleCoordinates,function(cc){
                   obj.geometry.coordinates.push(_.map(cc,function(c){return [c[1],c[0]]}));
               },this);
               rtn.features.push(obj);
           },this);
           
           return rtn;
       },
       dataSaved:function(data){
           this.trigger("saved");
           this.get("features").trigger("reset");           
       },
       dataSaveFailed:function(xhr, textStatus, errorThrown){
           console.log(textStatus);
       }
       
   });

   var AreaCollection = Backbone.Collection.extend({
       model:AreaModel,
       resetWithGJFeatures:function(features,options){
           var models = [];
           _.each(features,function(f){
               var obj = f.properties ? _.clone(f.properties,true) : {};
               obj.coordinates = [];
               _.each(f.geometry.coordinates,function(cc){
                   obj.coordinates.push(_.map(cc,function(c){return [c[1],c[0]]}));
               },this);
               models.push(new AreaModel(obj));
           },this);
           this.reset(models,options);
         }
       
   });
   
   var AreaModel = Backbone.Model.extend({
   });

   
   var postToServer = function(url,sendData,callback,errorCallback){
       $.ajax(url, {
           type: 'POST',
           processData: true,
           data: sendData,
           dataType: 'json',
           // headers:{
           //     "X-CSRFToken":getCookie('csrftoken'),
           // },
           success: function(data){
               callback(data);
           },
           error:function(xhr, textStatus, errorThrown){
               errorCallback(xhr, textStatus, errorThrown);
           }
       });
       
   };

   var getCookie = function (name) {
       var cookieValue = null;
       if (document.cookie && document.cookie != '') {
           var cookies = document.cookie.split(';');
           for (var i = 0; i < cookies.length; i++) {
               var cookie = $.trim(cookies[i]);
               // Does this cookie string begin with the name we want?
               if (cookie.substring(0, name.length + 1) == (name + '=')) {
                   cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                   break;
               }
           }
       }
       return cookieValue;
   };
   
   
   return {
       "PointGJModel":PointGJModel,
       "PointCollection":PointCollection,
       "PointModel":PointModel,
       "RouteGJModel":RouteGJModel,
       "RouteCollection":RouteCollection,
       "RouteModel":RouteModel,
       "AreaGJModel":AreaGJModel,
       "AreaCollection":AreaCollection,
       "AreaModel":AreaModel,
    };
    
});
