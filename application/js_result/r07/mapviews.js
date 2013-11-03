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
            
            this.editControlView = new EditControlView({items:[
                {type:"place",text:"edit places"},
                {type:"route",text:"edit routes"},
                {type:"area",text:"edit areas"},
            ]});
            L.drawLocal.edit.toolbar.actions.save.text = "OK";
            this.map.addControl(this.editControlView.control);
            this.listenTo(this.editControlView,"toggleEdit",this.toggleEdit,this);
            
            this.map.on("draw:created",function(e){
                var layerView;
                switch(this.editControlView.activeType){
                    case "place":
                        layerView = this.pointLayerView;
                        break
                    case "route":
                        layerView = this.routeLayerView;
                        break
                    case "area":
                        layerView = this.areaLayerView;
                        break
                }
                if (layerView){
                    layerView.layerCreated(e.layer);
                }
            },this);
            
            this.map.on("draw:edited",function(e){
              e.layers.eachLayer(function(l) {
              	l.fire("myApp:edited");
              });
            },this);
            
            this.map.on("draw:deleted",function(e){
    			e.layers.eachLayer(function(l) {
    				l.fire("myApp:deleted");
    			});                
            },this);
            
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
        toggleEdit:function(type){
            if (this.activeEditControl){
                this.map.removeControl(this.activeEditControl);
                delete this.activeEditControl;
            }
            
            var options = {
                position:'topright',
                draw:{polyline:null,polygon:null,rectangle:null,circle:null,marker:null},
                edit:{remove: true}
            };
            switch(type){
                case "place":
                    options.draw.marker = true;
                    options.edit.featureGroup = this.pointLayerView.layer;
                    break
                case "route":
                    options.draw.polyline = true;
                    options.edit.featureGroup = this.routeLayerView.layer;
                    break
                case "area":
                    options.draw.polygon = true;
                    options.edit.featureGroup = this.areaLayerView.layer;
                    break                
            }
            if (options.edit.featureGroup){
                this.activeEditControl = new L.Control.Draw(options);            
                this.map.addControl(this.activeEditControl);
            }
        }
        
    });
    
    var LayerMixin = {
        initialize:function(){
            this.layer = new L.FeatureGroup();
            this.listenTo(this.collection,"reset",this.renderLayer,this);
            this.listenTo(this.collection,"add",this.addNewLayer,this);            
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
            this.listenTo(modelView,"requestRemove",function(){
                this.layer.removeLayer(modelView.layer);
                this.collection.remove(m);
            },this);
        }
    };

    var FeatureMixin = {
        initialize:function(){
            this.renderLayer();
        },
        renderLayer:function(){
            this.layer = new (this.getFeatureClass())(this.model.get("coordinates"),this.featureOption);
            this.layer.on("myApp:edited",this.layerEdited,this);
            this.layer.on("myApp:deleted",this.layerDeleted,this);     
        },
        layerDeleted:function(){
            this.trigger("requestRemove");
        }
    };
    
    // 一時避難所データの集合(pointCollection)を扱うView
    var PointLayerView = Backbone.View.extend(_.extend({},LayerMixin,{
        getFeatureViewClass:function(){return PointView},
        layerCreated:function(layer){
            var latLng = layer.getLatLng();
            this.collection.add(new models.PointModel({"coordinates":[latLng.lat,latLng.lng]}));
        }
    }));

    // 一時避難所データ(pointCollectionのModel)を扱うView
    var PointView = Backbone.View.extend(_.extend({},FeatureMixin,{
        getFeatureClass:function(){return L.Marker},
        featureOption: null,
        layerEdited:function(){
            var latLng = this.layer.getLatLng();
            this.model.set("coordinates",[latLng.lat,latLng.lng]);
        }
    }));
    
    // 避難経路データの集合(routeCollection)を扱うView
    var PolylineLayerView = Backbone.View.extend(_.extend({},LayerMixin,{
        getFeatureViewClass:function(){return PolylineView},
        layerCreated:function(layer){
            var coordinates = _.map(layer.getLatLngs(),function(c){return [c.lat,c.lng]});            
            this.collection.add(new models.RouteModel({"coordinates":coordinates}));
        }
    }));

    // 避難経路データ(routeCollectionのModel)を扱うView
    var PolylineView = Backbone.View.extend(_.extend({},FeatureMixin,{
        getFeatureClass:function(){return L.Polyline},
        featureOption: {opacity:1},
        layerEdited:function(){
            var latLngs = this.layer.getLatLngs();
            this.model.set("coordinates",_.map(latLngs,function(c){return [c.lat,c.lng]}));
        }
    }));

    // 避難対象区域データの集合(areaCollection)を扱うView
    var PolygonLayerView = Backbone.View.extend(_.extend({},LayerMixin,{
        getFeatureViewClass : function(){return PolygonView},
        layerCreated:function(layer){
            var coordinates = [_.map(layer.getLatLngs(),function(c){return [c.lat,c.lng]})];
            this.collection.add(new models.AreaModel({"coordinates":coordinates}));
        }
    }));

    // 避難対象区域データ(areaCollectionのModel)を扱うView 
    var PolygonView = Backbone.View.extend(_.extend({},FeatureMixin,{
        getFeatureClass:function(){return L.Polygon},
        featureOption:{color:"#f00",fillColor:"#f00",fillOpacity:0.8},
        layerEdited:function(){
            var coordinates =[ _.map(this.layer.getLatLngs(),function(c){return [c.lat,c.lng]})];
            this.model.set("coordinates",coordinates);
        }        
    }));
    
    var EditControlView = Backbone.View.extend({
        initialize:function(options){
            this.items = options.items;
            
            var that = this;
            var editControl = L.Control.extend({
                options: {
                    position: 'topright'
                },
                onAdd: function (map) {
                    var container = L.DomUtil.create('div', ' leaflet-bar');
                    _.each(that.items,function(i){
                        i.view = new EditControlItemView({type:i.type,text:i.text,containerView:this});
                        $(container).append(i.view.render().el);
                        this.listenTo(i.view,"itemClicked",this.itemClicked,this);
                    },that);
                    
                    return container;
                }
            });
            this.control = new editControl();
        },
        itemClicked:function(type){
            if (this.activeType === type){
                type = "";
            }
            _.each(this.items,function(i){
                if (type != i.type && i.view.$el.hasClass("active")){
                    i.view.$el.removeClass("active");
                }
            },this);
            this.activeType = type;
            this.trigger("toggleEdit",type);
        }
    });

    var EditControlItemView = Backbone.View.extend({
        tagName:"button",
        events:{
            "click":"fireClicked"
        },
        initialize:function(options){
            this.type = options.type;
            this.containerView = options.containerView;
            this.text = options.text;
        },
        render:function(){
            this.$el.text(this.text).addClass("btn btn-xs btn-primary").attr("type","button");
        	L.DomEvent.on(this.el,"click",L.DomEvent.stopPropagation);
        	L.DomEvent.on(this.el,"mousedown",L.DomEvent.stopPropagation);
            L.DomEvent.on(this.el,"dblclick",L.DomEvent.stopPropagation);
            
            return this;
        },
        fireClicked:function(e){
            this.$el.toggleClass("active").blur();
            this.trigger("itemClicked",this.type);
        }
    });    
    
   return {
       "MapContainerView":MapContainerView
   }; 
});
