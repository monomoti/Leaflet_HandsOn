({
    
    /* when compiling one js file.*/
    baseUrl: "./js",
    name:"app",
    out:"./js/app-built.js",
    // exclude:["jquery","underscore","backbone","bootstrap","leaflet","leafletdraw"],
    exclude:["config"],
    /* when compiling one js file.*/

    paths: {
        "jquery": "lib/jquery-1.10.2.min",
        "underscore": "lib/underscore-min",
        "backbone": "lib/backbone-min",
        "bootstrap":"lib/bootstrap.min",
        "leaflet":"lib/leaflet/leaflet",
        "leafletdraw":"lib/leaflet/leaflet.draw"
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
        "bootstrap":{
            deps:["jquery"],
            exports: "bootstrap"
        },
        "leaflet":{
            exports:"L"
        },
        "leafletdraw":{
            deps:["leaflet"],
            exports:"leafletdraw"
        }            
    },
    
    
})