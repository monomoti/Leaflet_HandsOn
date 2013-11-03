(function(){
    
    requirejs.config({
        baseUrl: "/static/js",
        paths: {
            "jquery": "lib/jquery-1.10.2.min",
            "underscore": "lib/underscore-min",
            "backbone": "lib/backbone-min",
            // "bootstrap":"lib/bootstrap.min",
            "leaflet":"lib/leaflet/leaflet",
        },

        shim: {
            "jquery":{
                exports: "jQuery"
            },
            "underscore": {
                exports: "_"
            },
            "backbone": {
                deps: ["jquery", "underscore"],
                exports: "Backbone"
            },
            // "bootstrap":{
            //     deps:["jquery"],
            //     exports: "bootstrap"
            // },
            "leaflet":{
                exports:"L"
            },
            
        },
        urlArgs: "bust=" +  (new Date()).getTime()


    });
    
    require(["jquery","underscore","backbone","models","leaflet"], function($,_,Backbone,models, L){
        var EventBus = _.extend(Backbone.Events);
        EventBus.WINDOW_RESIZED = 0;
        
                
        window.app || (window.app = {});
        var app = window.app;
        if (! app.eventBus){
            app.eventBus = EventBus;
        }

        var ApplicationView = Backbone.View.extend({
            el :"#App",
            initialize:function(){

                this.pointGJModel = new models.PointGJModel();
                this.routeGJModel = new models.RouteGJModel();
                this.areaGJModel = new models.AreaGJModel();            

                this.mapView = new MapContainerView({
                    pointCollection:this.pointGJModel.get("features"),
                    routeCollection:this.routeGJModel.get("features"),
                    areaCollection:this.areaGJModel.get("features")
                    });
                $(window).on("resize",function(){
                    app.eventBus.trigger(app.eventBus.WINDOW_RESIZED,{width:$(window).width(),height:$(window).height()});
                });

                this.pointGJModel.fetch({url:"./fetch/points/",error:this.gJFailed});
                this.routeGJModel.fetch({url:"./fetch/lines/",error:this.gJFailed});
                this.areaGJModel.fetch({url:"./fetch/areas/",error:this.gJFailed});

            },
            gJFailed:function(model,response,options){
                console.log("gjFailed " + JSON.stringify(response));
            },
        });
        
        var MapContainerView = Backbone.View.extend({
            el:"#MapContainer",
            initialize:function(options){
                this.map = L.map("map",{minZoom:2,maxZoom:20}).setView([34.8,135.7], 10);
                var baseTileUrl = 'http://{s}.tile.cloudmade.com/77b7b2219a944c3cbf118035611d6dae/997/256/{z}/{x}/{y}.png',
                attribution = 'Map data &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Imagery &copy; <a href="http://cloudmade.com">CloudMade</a>';
                L.tileLayer(baseTileUrl,{ attribution: attribution}).addTo(this.map);

                this.updateToWindowSize();
                this.listenTo(app.eventBus,app.eventBus.WINDOW_RESIZED,this.updateToWindowSize,this);

                this.pointLayerView = new PointLayerView({collection:options.pointCollection});
                this.pointLayerView.layer.addTo(this.map);
                this.routeLayerView = new PolylineLayerView({collection:options.routeCollection});
                this.routeLayerView.layer.addTo(this.map);
                this.areaLayerView = new PolygonLayerView({collection:options.areaCollection});
                this.areaLayerView.layer.addTo(this.map);            
            },
            updateToWindowSize:function(size){
                if (!size){
                    size = {width:$(window).width(),height:$(window).height()};                
                }
                this.$el.height(size.height - 10);
                if (this.map){
                    this.map.invalidateSize();                
                }
            },


        });

        var LayerMixin = {
            initialize:function(){
                this.layer = new L.FeatureGroup();
                this.listenTo(this.collection,"reset",this.renderLayer,this);
            },
            renderLayer:function(){
                this.layer.clearLayers();
                this.collection.each(function(m){
                    this.addNewLayer(m);
                },this);
            },
            addNewLayer:function(m){
                var modelView = new (this.getFeatureViewClass())({model:m});
                modelView.layer.addTo(this.layer);
            }
        };

        var FeatureMixin = {
            initialize:function(){
                this.renderLayer();
            },
            renderLayer:function(){
                this.layer = new (this.getFeatureClass())(this.model.get("coordinates"),this.featureOption);
            },
        };

        // 一時避難所データの集合(pointCollection)を扱うView
        var PointLayerView = Backbone.View.extend(_.extend({},LayerMixin,{
            getFeatureViewClass:function(){return PointView},
        }));

        // 一時避難所データ(pointCollectionのModel)を扱うView
        var PointView = Backbone.View.extend(_.extend({},FeatureMixin,{
            // getFeatureClass:function(){return L.Marker},
            // featureOption: null,
            renderLayer:function(){
                
                this.layer = L.circleMarker(this.model.get("coordinates"),{
                    radius:this.model.get("capacity") * 0.25,
                    fillColor : this.getFillColor(),
                    fillOpacity : 0.8
                    
                }).bindPopup(this.model.get("name") + "<br>" + this.model.get("occupied") + "/" + this.model.get("capacity") + "人");
            },
            getFillColor:function(){
                var min=[0,0,255];
                var max=[255,0,0];
                var capacity = this.model.get("capacity");
                var occupied = this.model.get("occupied");
                var pct = (capacity && capacity > 0) ? occupied / capacity : 0;
                
                var rn = Math.round((max[0] - min[0]) * pct) + min[0];
                var gn = Math.round((max[1] - min[1]) * pct) + min[1];
                var bn = Math.round((max[2] - min[2]) * pct) + min[2];
                
                var r = rn.toString(16);
                if (r.length == 1){
                    r = "0" + r;
                    
                }
                var g = gn.toString(16);
                if (g.length == 1){
                    g = "0" + g;
                }
                var b = bn.toString(16);
                if (b.length == 1){
                    b = "0" + b;
                }
                var color = "#" + r + g + b;
                return color;
                
            }
        }));

        // 避難経路データの集合(routeCollection)を扱うView
        var PolylineLayerView = Backbone.View.extend(_.extend({},LayerMixin,{
            getFeatureViewClass:function(){return PolylineView},
        }));

        // 避難経路データ(routeCollectionのModel)を扱うView
        var PolylineView = Backbone.View.extend(_.extend({},FeatureMixin,{
            getFeatureClass:function(){return L.Polyline},
            featureOption: {opacity:1},
        }));

        // 避難対象区域データの集合(areaCollection)を扱うView
        var PolygonLayerView = Backbone.View.extend(_.extend({},LayerMixin,{
            getFeatureViewClass : function(){return PolygonView},
        }));

        // 避難対象区域データ(areaCollectionのModel)を扱うView 
        var PolygonView = Backbone.View.extend(_.extend({},FeatureMixin,{
            getFeatureClass:function(){return L.Polygon},
            featureOption:{color:"#f00",fillColor:"#f00",fillOpacity:0.8},
        }));
                
                
                
        var appView = new ApplicationView();
    });
    
    
})();