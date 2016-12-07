
	function fn_ok(lat,lon,id){   
		var divmapa=document.getElementById(id);
		var glatlon=new google.maps.LatLng(lat,lon);
		var configmapa={
		zoom: 14,
		center: glatlon
		}

	var gmapa= new google.maps.Map(divmapa,configmapa); 
		var objconfigmarker={                           
			position:glatlon,
			map:gmapa,
			title:"aqui estoy"
		}						  
	var chinche=new google.maps.Marker(objconfigmarker);
}
