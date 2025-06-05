


    /**/           
            //locovar = position.coords.latitude+','+position.coords.longitude;
            var map; // Global declaration of the map
            var iw;
            //var iw = new google.maps.InfoWindow(); // Global declaration of the infowindow
            var lat_longs = new Array();
            var markers = new Array();
            var drawingManager;
            var all_overlays = [];
            var imdrawing = 0;
            var newShape;
            
            




            function initialize(plat, plong, tchords, crop_words) {
                var tpoints = [];  
                $('#save_poly_map').closest('.ui-btn').hide();

                //set start L&L to the first poly poss
                if(tchords.length>2){
                    plat = tchords[0][0];
                    plong = tchords[0][1];
                    
                for (var i = 0; i < tchords.length; i++) {
                    tpoints.push({
                        lat: tchords[i][0],
                        lng: tchords[i][1]
                    });                    
                }    
                    
                }
                
                
                
                

                var infopos = { lat: plat, lng: plong }; 
                var myLatlng = new google.maps.LatLng(plat, plong);
                var myOptions = {
                    zoom: 16,
                    center: myLatlng,
                    mapTypeId: google.maps.MapTypeId.SATELLITE
                }
              
              
            

            
              

            //consol e. log(triangleCoords);

                
              
              map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
              drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                drawingControl: true,
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON]
                },
                polygonOptions: {
                    editable: true,
                    fillColor: "#ffff00",
                    strokeColor: "#3B8C3B"
                }
              });
              drawingManager.setMap(null);
                
                
               
              google.maps.event.addListener(drawingManager, "overlaycomplete", function(event) {
                overlayClickListener(event.overlay);
                all_overlays = event.overlay.getPath().getArray();  
                $('#vertices').val(all_overlays);
                area_mypoly = google.maps.geometry.spherical.computeArea(event.overlay.getPath());
                area_mypoly = (area_mypoly/10000).toFixed(3);
                //ale rt(area_mypoly+' Hec');
                $('#map_area_val').html('Area: '+area_mypoly);  
                  
                newShape = event.overlay;
                newShape.type = event.type;
                  
                //$('#save_poly_map').closest('.ui-btn').show();  
              });
                
            google.maps.event.addListener(map, "mouseup", function(event) {
                if(imdrawing==0){
                  //imdrawing=1; 
                  //overlayRemoveAll(); 
                }
                //ale rt('dmc');
            });
            
                
                
              newPolys = new google.maps.Polygon({
                path: tpoints,
                fillColor: "#0E30D8",
                strokeColor: "#FFFFFF"
              });
              newPolys.setMap(map); 
                
        

            ///if we have an area????
            if(tchords.length>2){  
                    var area_mypoly = google.maps.geometry.spherical.computeArea(newPolys.getPath());                 

                    //crop_words = rz.CropNo+"/"+rz.Variety+"/"+rz.Farm Name+"/"+rz.field_ name+"/"+rz.FID+"/"+rz.Quantity;
                    crop_words_arr = crop_words.split("^");                
                    area_mypoly = (area_mypoly/10000).toFixed(3);
                    contentString =
                    '<div id="content">' +
                    '<h4 class="mb-0"><strong class="green">'+crop_words_arr[0]+'</strong></h4>' +
                    '<h5 class="mb-0 dark">'+crop_words_arr[1]+' - '+crop_words_arr[2]+'</h5>' +
                    '<h5 class="mb-0 dark">'+crop_words_arr[3]+'</h5>' +
                    '<h5 class="mb-0 dark">Area: '+crop_words_arr[4]+' | Calulated: '+area_mypoly+'</h5>' +      
                    "</div>";
                
                
                    $('#map_area_val').html('Area: '+area_mypoly);

                    iw = new google.maps.InfoWindow({
                    content: contentString
                    });
                    const marker = new google.maps.Marker({
                    position: infopos,
                    map,
                    title: crop_words_arr[0],
                    });
             
                    marker.setVisible(false);
                    iw.open(map, marker);
         
                    
  
                
            /**/
            }

                
      
                

            function overlayClickListener(overlay) {///happens at poly close!
                //ale rt('ocl');
                $('#save_poly_map').closest('.ui-btn').show();
                google.maps.event.addListener(overlay, "mouseup", function(event) {
                    all_overlays = overlay.getPath().getArray();
                    $('#vertices').val(all_overlays);
                    
                });
            }
            
                
            function overlayRemoveAll(stopdraw=0) {
                $('#save_poly_map').closest('.ui-btn').hide();
                $('#map_area_val').html('');
                if(stopdraw==1){
                    drawingManager.setMap(null);
                }else{
                    drawingManager.setMap(map);
                }
                if(newShape){
                    newShape.setEditable(false);
                    newShape.setMap(null);
                    newShape = null;
                }
                newPolys.setEditable(false);
                newPolys.setMap(null);
                newPolys = null;
                $('#vertices').val('');
                all_overlays = [];
                iw.close(map);
                
                
                
            } 


            
               
                $('#map_form #clear').click(function() {
                    overlayRemoveAll();
                });                
               
                
                $('#my_poss').click(function() {
                    mypos = new google.maps.LatLng(p_lat,p_long); 
                    map.setCenter(mypos);
                });
                
     
}///end init


             




            function load_map(latlng_json, marker_json,poly_str, cropwords, iamcon=0) {

                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                console.log(latlng_json);
                console.log(marker_json);
                console.log(poly_str);
                console.log(cropwords);
                console.log(p_lat);
                console.log(p_long);



               
                if(iamcon==1){
                    $('#map-canvas-all').show();                    
                    google.maps.event.addListener(window, 'load', initialize(p_lat, p_long, poly_str, cropwords));//was addDomListener
                                
                    
                }else{
                    ///hide the map
                    $('#map-canvas-all').hide();
                }    
            } 





