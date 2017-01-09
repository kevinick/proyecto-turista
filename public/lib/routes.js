
var map = L.map('map', { 
    scrollWheelZoom: false 
}).setView(-17.3733, -66.14511966, 12);

var tileLayer = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';

L.tileLayer(tileLayer, {
    maxZoom: 18
}).addTo(map);