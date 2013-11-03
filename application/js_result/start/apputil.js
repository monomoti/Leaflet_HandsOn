define(["jquery","underscore","backbone"],function($,_,Backbone){
    var EventBus = _.extend(Backbone.Events);
    EventBus.WINDOW_RESIZED = 0;
    
    
    return {
        "EventBus":EventBus,
    };
    
});