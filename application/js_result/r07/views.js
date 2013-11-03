define(["jquery","underscore","backbone","models","apputil","mapviews"],function($,_,Backbone,models,apputil,mapviews){
    
    window.app || (window.app = {});
    var app = window.app;
    if (! app.eventBus){
        app.eventBus = apputil.EventBus;
    }
    
    var ApplicationView = Backbone.View.extend({
        el :"#App",
        events:{
            "click #SaveGJBtn":"saveBtnClicked",
        },
        initialize:function(){
            
            this.pointGJModel = new models.PointGJModel();
            this.routeGJModel = new models.RouteGJModel();
            this.areaGJModel = new models.AreaGJModel();            
 
            this.placeListView = new PlaceListView({collection:this.pointGJModel.get("features")});

            this.mapView = new mapviews.MapContainerView({
                pointCollection:this.pointGJModel.get("features"),
                routeCollection:this.routeGJModel.get("features"),
                areaCollection:this.areaGJModel.get("features")
                });
            $(window).on("resize",function(){
                app.eventBus.trigger(app.eventBus.WINDOW_RESIZED,{width:$(window).width(),height:$(window).height()});
            });

            this.pointGJModel.fetch({error:this.gJFailed});
            this.routeGJModel.fetch({error:this.gJFailed});
            this.areaGJModel.fetch({error:this.gJFailed});
            
            this.pointGJModel.on("saved",function(){this.oneSaved("point")},this);
            this.routeGJModel.on("saved",function(){this.oneSaved("route")},this);
            this.areaGJModel.on("saved",function(){this.oneSaved("area")},this);
            
        },
        gJFailed:function(model,response,options){
            console.log("gjFailed " + JSON.stringify(response));
        },
        saveBtnClicked:function(){
            this.saving = true;
            this.pointSaved = false;
            this.routeSaved = false;
            this.areaSaved = false;
            
            this.pointGJModel.saveAsGeoJSON();  
            this.routeGJModel.saveAsGeoJSON();  
            this.areaGJModel.saveAsGeoJSON();  
        },
        oneSaved:function(type){
            if (type == "point"){
                this.pointSaved = true;
            }else if(type == "route"){
                this.routeSaved = true;
            }else if(type == "area"){
                this.areaSaved = true;
            }
            if (this.pointSaved && this.routeSaved && this.areaSaved){
                this.saving = false;
                alert("SAVED!");
            }
        }
    });

    var PlaceListView = Backbone.View.extend({
        el:"#PlaceList",
        initialize:function(){
            this.listenTo(this.collection,"reset",this.renderList,this);
            this.listenTo(this.collection,"add",this.addNewRow,this);
            this.listenTo(this.collection,"remove",this.renderList,this);
            
            this.updateToWindowSize();
            this.listenTo(app.eventBus,app.eventBus.WINDOW_RESIZED,this.updateToWindowSize,this);
            
        },
        renderList:function(){
            this.$("tbody").empty();
            this.collection.each(function(m){
                this.addNewRow(m);
            },this);
            
        },
        addNewRow:function(m){
            var rowView = new PlaceListRowView({model:m});
            this.$("tbody").append(rowView.render().el);
        },
        updateToWindowSize:function(size){
            if (!size){
                size = {width:$(window).width(),height:$(window).height()};                
            }
            this.$el.parent().css({"height":size.height - 150});
            
        },
        
    });
    
    var PlaceListRowView = Backbone.View.extend({
        tagName:"tr",
        events:{
            "change input":"edited",  
        },
        initialize:function(){
            
        },
        template:_.template($("#PlaceListRow-template").html()),
        render:function(){
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        edited:function(e){
            var $target = $(e.target);
            this.model.set($target.data("field"),$target.val());
        }
    });
    
   return {
       "ApplicationView":ApplicationView
   }; 
});
