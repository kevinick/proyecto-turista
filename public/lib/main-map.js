
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

  var sitioturistico = new LeafIcon({iconUrl: '/iconos/sitioturistico.ico'}),
    parque = new LeafIcon({iconUrl: '/iconos/parque.ico'}),
    restaurant = new LeafIcon({iconUrl: '/iconos/restaurant.ico'}),
    mercado = new LeafIcon({iconUrl: '/iconos/mercado.ico'}),
    hospital = new LeafIcon({iconUrl: '/iconos/hospital.ico'}),
    hotel = new LeafIcon({iconUrl: '/iconos/hotel.ico'}),
    parque = new LeafIcon({iconUrl: '/iconos/parque.ico'})
    plaza = new LeafIcon({iconUrl: '/iconos/plaza.ico'}),
    peligroso = new LeafIcon({iconUrl: '/iconos/peligroso.ico'}),
    ninguno = new LeafIcon({iconUrl: '/iconos/ninguno.ico'}),
    miposicion = new LeafIcon({iconUrl: '/iconos/miposicion.ico'});

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
    var marker = L.marker([mycoords.lat, mycoords.lng],{icon: miposicion});
    marker.bindPopup("<b>Estoy por aqui</b><br><a href=\"/app/new-place?lat="+mycoords.lat+"&lng="+mycoords.lng+"\">Crear lugar aqui</a>");
    /*
    marker.on('dblclick',dblClick);
    function dblClick(e) {alert(e.latlng);}
    */
    marker.addTo(map);
    //socket.emit('coords:me', {latlng: mycoords});

  }//Generally, events allow you to execute some function when something happens 
  //with an object (ej 'click' event, locationfound). and you can separate the function if you want
  function onReceivedData(data){
    console.log(data);
    for (var i = 0; i< data.length; i++) {
        var marker;
        var tipo = data[i].type + "";
        switch (tipo){
          case "Sitio Turistico" : icono = sitioturistico;
                              break;
          case "Parque" : icono = parque;
                      break;
          case "Restaurante" :   icono = restaurant;
                            break;
          case "Mercado" : icono = mercado;
                      break;
          case "Hospital" : icono = hospital;
                        break;
          case "Hotel" :   icono = hotel;
                      break;
          case "Plaza" :   icono = plaza;
                      break;
          case "Peligroso" : icono = peligroso;
                        break;
          default : icono = ninguno ;
        };

        var marker = L.marker([data[i].latlng.latitude, data[i].latlng.longitude],{icon: icono});
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

  var _lat = $("#lat").text();
  var _lng = $("#lng").text();
  if (_lat && _lng) {
    _lat = Number(_lat);
    _lng = Number(_lng);
    map.setView([_lat, _lng], 16);
  }
}

$(document).ready(onDocumentReady);