define(["jquery","underscore","backbone","models","apputil","leaflet","leafletdraw"],function($,_,Backbone,models,apputil,L,leafletdraw){
    
    window.app || (window.app = {});
    var app = window.app;
    if (! app.eventBus){
        app.eventBus = apputil.EventBus;
    }
    
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
            this.$el.height(size.height - 100);
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
        getFeatureClass:function(){return L.Marker},
        featureOption: null,
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
    
   return {
       "MapContainerView":MapContainerView
   }; 
});
