define(["jquery","underscore","backbone","models","apputil"],function($,_,Backbone,models,apputil){
    
    window.app || (window.app = {});
    var app = window.app;
    if (! app.eventBus){
        app.eventBus = apputil.EventBus;
    }
    
    var MapContainerView = Backbone.View.extend({        
    });
    
   return {
       "MapContainerView":MapContainerView
   }; 
});
