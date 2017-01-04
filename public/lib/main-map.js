function onDocumentReady() {
  var socket = io.connect('http://localhost');


  var map = L.map('mimapa', {
      center: [51.505, -0.09],
      zoom: 3 //1 - 18 
  });

  
  var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar'});
  
  
  tiles.addTo(map);
  //var tiles = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {foo: 'bar'});
  //tiles.addTo(map);

  socket.on('news',onReceivedData)

  map.locate({
    enableHighAccuracy: true
  });

  map.on('locationfound', onlocationfound);
  function onlocationfound(position){
    var mycoords = position.latlng;
    var marker = L.marker([mycoords.lat, mycoords.lng]);
    marker.bindPopup("Estoy por aqui");
    marker.addTo(map);

    socket.emit('coords:me', {latlng: mycoords});

  }//Generally, events allow you to execute some function when something happens 
  //with an object (ej 'click' event, locationfound). and you can separate the function if you want
  function onReceivedData(data){
    console.log(data);
    var coords = data.latlng;
    var marker = L.marker([123, 123]);
    marker.bindPopup("Este es el otro");
    marker.addTo(map);
  }

}

$(document).on('ready', onDocumentReady);