define(["jquery","underscore","backbone","models","apputil","leaflet","leafletdraw"],function($,_,Backbone,models,apputil,L,leafletdraw){
    
    window.app || (window.app = {});
    var app = window.app;
    if (! app.eventBus){
        app.eventBus = apputil.EventBus;
    }
    
    var MapContainerView = Backbone.View.extend({
        el:"#MapContainer",
        initialize:function(){
            this.map = L.map("map",{minZoom:2,maxZoom:20}).setView([34.8,135.7], 10);
            var baseTileUrl = 'http://{s}.tile.cloudmade.com/77b7b2219a944c3cbf118035611d6dae/997/256/{z}/{x}/{y}.png',
            attribution = 'Map data &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Imagery &copy; <a href="http://cloudmade.com">CloudMade</a>';
            L.tileLayer(baseTileUrl,{ attribution: attribution}).addTo(this.map);
            
            this.updateToWindowSize();
            this.listenTo(app.eventBus,app.eventBus.WINDOW_RESIZED,this.updateToWindowSize,this);
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
    
   return {
       "MapContainerView":MapContainerView
   }; 
});
