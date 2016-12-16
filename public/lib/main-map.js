function mostrarMouse(e){
    console.log(e.clientX);
    console.log(e.clientY);
}

function mapade(lat,long){
    var divmapa2=document.getElementById("mapa-principal"); 
    var glatlon=new google.maps.LatLng(lat,long);
    var objConfmapa={
                      zoom   : 10,
                      center : glatlon
                    }
    var gmapa= new google.maps.Map(divmapa2,objConfmapa); 

    var objconfigmarker={                           
                         position :glatlon,
                         map      :gmapa,
                         title    :"aqui estoy"
                        }                         
    var chinche=new google.maps.Marker(objconfigmarker);
}