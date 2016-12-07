
var divmapa=document.getElementById("mapa");  // aqui estara mi mapa en este div
var divmapa2=document.getElementById("mapa2"); 
	navigator.geolocation.getCurrentPosition(fn_ok,fn_mal);
	function fn_mal(){
		}
	function fn_ok(respuesta){   // recive una respuesta que nos va 
							 //a dar la ubicacion del dispositivo
		var lat=respuesta.coords.latitude;
		var lon=respuesta.coords.longitude;
		// esta informacion 
		//para el mapa dinamico de google, hay que convertirlo en un objeto de google
		var glatlon=new google.maps.LatLng(lat,lon);
		var configmapa={
		zoom: 17,
		center: glatlon
		}
		
	// para mi mapa en donde are zoom scroll
	var gmapa= new google.maps.Map(divmapa,configmapa); // recive dos datos, el primero es en donde se mostrara
		                                                // esto es en el div, el sogundo es una configuracion del mapa
		var objconfigmarker={                           
			position:glatlon,
			map:gmapa,
			title:"aqui estoy"
		}						  
	var chinche=new google.maps.Marker(objconfigmarker);
}
function mapade(lat,long){
		var divmapa2=document.getElementById("mapa2"); 
		var glatlon=new google.maps.LatLng(lat,long);
		var objConfmapa={
		zoom: 17,
		center: glatlon
		}
	var gmapa= new google.maps.Map(divmapa2,objConfmapa); 
		                                                
		var objconfigmarker={                           
			position:glatlon,
			map:gmapa,
			title:"aqui estoy"
		}						  
	var chinche=new google.maps.Marker(objconfigmarker);
}
function fn_mal2(){}