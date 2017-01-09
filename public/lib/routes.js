
var mapboxApiKey = "pk.eyJ1Ijoia3JhZnR5IiwiYSI6ImNpeGp2YnFmZjAwMXAycW5xMDhwdzUxYmkifQ.Fn9G950BYFYebpb7Yqy01g";

var streets = L.tileLayer('https://api.mapbox.com/styles/v1/krafty/cixjw31tp001i2socgz3zr6nx/tiles/256/{z}/{x}/{y}?access_token=' + mapboxApiKey);
var grayscale = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
var toner = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png');


var map = L.map('routemap', { 
    scrollWheelZoom: false,
    center: [-17.3933, -66.1451],
    zoom: 12,
    layers: [streets]
});

var baseMaps = {
    "Tile": grayscale,
    "MapBox": streets,
    "Toner":toner
};

L.control.layers(baseMaps).addTo(map);

var routeControl = L.Routing.control({
        routeWhileDragging: false,
        router: L.Routing.mapbox(mapboxApiKey),
        geocoder: L.Control.Geocoder.mapbox(mapboxApiKey),
        autoRoute: true,
        waypointNameFallback: function(latLng) {
            function zeroPad(n) {
                n = Math.round(n);
                return n < 10 ? '0' + n : n;
            }
            function hexagecimal(p, pos, neg) {
                var n = Math.abs(p),
                    degs = Math.floor(n),
                    mins = (n - degs) * 60,
                    secs = (mins - Math.floor(mins)) * 60,
                    frac = Math.round((secs - Math.floor(secs)) * 100);
                return (n >= 0 ? pos : neg) + degs + '°' + zeroPad(mins) + '\'' + zeroPad(secs) + '.' + zeroPad(frac) + '"';
            }

            return hexagecimal(latLng.lat, 'N', 'S') + ' ' + hexagecimal(latLng.lng, 'E', 'W');
        }
    })
    .on('routingerror', function(e) {
        try {
            map.getCenter();
        } catch (e) {
            map.fitBounds(L.latLngBounds(routeControl.getWaypoints().map(function(wp) { return wp.latLng; })));
        }
    })
    .addTo(map);

L.Routing.errorControl(routeControl).addTo(map);

function createButton(content, container) {

    var p = L.DomUtil.create("p", "", container);
    var button = L.DomUtil.create("button", "", p);
    button.setAttribute("class", "btn btn-default");
    button.innerHTML = content;
    return button;
}

map.on("click", function(e) {

    var div = L.DomUtil.create("div");
    var startBtn = createButton("Empezar aqui", div);
    var endBtn = createButton("Terminar aqui", div);

    L.DomEvent.on(startBtn, "click", function () {

        routeControl.spliceWaypoints(0, 1, e.latlng);
        map.closePopup();
    });

    L.DomEvent.on(endBtn, "click", function () {

        var end = routeControl.getWaypoints().length - 1;
        routeControl.spliceWaypoints(end, 1, e.latlng);
        map.closePopup();
    });

    L.popup()
        .setContent(div)
        .setLatLng(e.latlng)
        .openOn(map);
});

var LeafIcon = L.Icon.extend({
    options: {
        iconSize:     [48, 45],
        iconAnchor:   [22, 94],
        popupAnchor:  [3, -76],
        className:  'animated-icon my-icon-id' 
    }
});

var azulIcon = new LeafIcon({iconUrl: '/imagenes/marker2.ico'});
var verdeIcon = new LeafIcon({iconUrl: '/imagenes/marker3.ico'});
var posIcon = new LeafIcon({iconUrl: '/imagenes/marker5.png'});
var roseIcon = new LeafIcon({iconUrl: '/imagenes/marker8.ico'});

var socket = io.connect('http://localhost');
socket.on('news', function(data) {

    var current;
    var marker;
    var content;
    for (var i = 0; i< data.length; i++) {
        current = data[i];
        marker = L.marker([
            current.latlng.latitude, 
            current.latlng.longitude
        ], {
            icon: azulIcon
        });
        content = "<b>"+current.name+"</b><br><a href=\"/app/place/"+current._id+"\">Abrir</a>";
        marker.bindPopup(content);
        marker.addTo(map);
    }
});