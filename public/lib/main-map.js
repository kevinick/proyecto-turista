
function onDocumentReady() {

  var socket = io.connect('http://localhost');

  var mapboxApiKey = 'pk.eyJ1Ijoia3JhZnR5IiwiYSI6ImNpeGp2YnFmZjAwMXAycW5xMDhwdzUxYmkifQ.Fn9G950BYFYebpb7Yqy01g';
  var streets = L.tileLayer('https://api.mapbox.com/styles/v1/krafty/cixjw31tp001i2socgz3zr6nx/tiles/256/{z}/{x}/{y}?access_token=' + mapboxApiKey);
  var grayscale = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
  var toner = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png');
  //tiles.addTo(map);

  var map = L.map('mimapa', {
      center: [-17.3333,-66.1667],
      zoom: 8 ,//1 - 18 
      layers: [streets,grayscale],
      scrollWheelZoom: false
  });
  var baseMaps = {
    "Tile": grayscale,
    "MapBox": streets,
    "Toner":toner
  };

  L.control.layers(baseMaps).addTo(map);

  var LeafIcon = L.Icon.extend({
      options: {
          iconSize:     [48, 45],
          iconAnchor:   [22, 94],
          popupAnchor:  [3, -76],
          className:  'animated-icon my-icon-id' 
      }
  });

  var azulIcon = new LeafIcon({iconUrl: '/imagenes/marker2.ico'}),
    verdeIcon = new LeafIcon({iconUrl: '/imagenes/marker3.ico'}),
    posIcon = new LeafIcon({iconUrl: '/imagenes/marker5.png'}),
    roseIcon = new LeafIcon({iconUrl: '/imagenes/marker8.ico'});

  socket.on('news',onReceivedData);

  map.locate({
    enableHighAccuracy: true
  });

  map.on('locationfound', onlocationfound);

/*
  map.on('click', function(e){
      var marker = new L.marker(e.latlng).addTo(map);
  });
*/
  function onlocationfound(position){
    var mycoords = position.latlng;
    var marker = L.marker([mycoords.lat, mycoords.lng],{icon: roseIcon});
    marker.bindPopup("Estoy por aqui");
    /*
    marker.on('dblclick',dblClick);
    function dblClick(e) {alert(e.latlng);}
    */
    marker.addTo(map);
    socket.emit('coords:me', {latlng: mycoords});

  }//Generally, events allow you to execute some function when something happens 
  //with an object (ej 'click' event, locationfound). and you can separate the function if you want
  function onReceivedData(data){
    for (var i = 0; i< data.length; i++) {
        var marker = L.marker([data[i].latlng.latitude, data[i].latlng.longitude],{icon:azulIcon});
        var name = data[i].name;
        var innerHTML = "<b>"+name+"</b><br><a href=\"/app/place/"+data[i]._id+"\">Abrir</a>";
        marker.bindPopup(innerHTML);
        
        marker.addTo(map);
    }
  }

  //Poder crear un lugar despues de hacer click sobre el mapa para
  //obtener las coordenadas primero
  map.on("click", function(e) {

    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    var content = '<b>Latitud:</b> '+lat+' <b><br>Longitud:</b> '+lng+'<p><a href="/app/new-place?lat='+lat+'&lng='+lng+'">Crear lugar aqui</button></a>';
    L.popup()
      .setContent(content)
      .setLatLng(e.latlng)
      .openOn(map);
  });

}

$(document).ready(onDocumentReady);

/*CREATE ICON
  var greenIcon = L.icon({
    iconUrl: 'leaf-green.png',
    shadowUrl: 'leaf-shadow.png',

    iconSize:     [38, 95], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
Now putting a marker with this icon on a map is easy:

L.marker([51.5, -0.09], {icon: greenIcon}).addTo(map)



GRUPOS DE ICONOS

var littleton = L.marker([39.61, -105.02]).bindPopup('This is Littleton, CO.'),
    denver    = L.marker([39.74, -104.99]).bindPopup('This is Denver, CO.'),
    aurora    = L.marker([39.73, -104.8]).bindPopup('This is Aurora, CO.'),
    golden    = L.marker([39.77, -105.23]).bindPopup('This is Golden, CO.');
Instead of adding them directly to the map, you can do the following, using the LayerGroup class:

var cities = L.layerGroup([littleton, denver, aurora, golden]);
*/