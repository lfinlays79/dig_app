window.IndexedDB;
var shortName = 'digappDB';
var db;
var version = 2;

var merch_id = 1;
var userkey = '';
var mobSysURL = '';
var username = '';
var remote_type = -1;
var merchname = '';
var this_sync_cnt = 0;
var igid = 0;
var aid = 0;
var last_inspect_rs = '';///existing crop inspection record! - used to prefill inspection if we have one recorded from live alre ady!
var locovar = '';
var p_lat = 0;
var p_long = 0;
var active_page = 'page_index';
var actual_user_cnt = 0;
var triangleCoords ='';
var walkmap_started = 0;
var sig_default = '';
var insp_list = '';
//request for location
var applive = false;
var app_user_type = 0;//0 admin 1 store user
var sigfile;
var sigfile_d;
var inspcommon_list = '';
var insp_common_html_list = [];

var arr_gro_stages_full = ['N/A','LESS THAN 100% EMERGENCE','100% EMERGENCE','MARKING ROWS','MEETING DOWN ROWS','MEETING ACROSS ROWS','MEETING ACROSS BEDS','BUDS FORMED','IN FLOWER','IN FULL FLOWER','LUSH GREEN','STARTING TO SENESCE','PART SENESCED'];
var arr_gro_stages = ['N/A','<100%','100% EM','MR','MDR','MAR','MAB','BF','IF','IFF','LGR','STS','PTS'];
////////////
var arr_gro_stagesfull_25 = ['N/A','Bare Land','Ploughed','Ridged','Planted','Seed Sprouting','Seed Sprouts up to 50mm','Stems 50mm from Emergence','Ridge Cracking','50% Emergence','100% Emergence','Hooking','Tuber Initiation','Meeting the Rows','Meeting Across the Rows','Buds Forming | Formed','Starting to Flower','In Flower','Full Flower','Petal Fall','Lush Green','Starting to Senesce','25% Senesced','Topped'];
var arr_gro_stages_25 = ['N/A','BL','PL','RG','PLT','SDS','SP50','S50E','RC','50% E','100% E','HK','TI','MTR','MAR','BF','STF','IF','FF','PF','LG','STS','25% SN','TOP'];


var trade_states = ['Pending','Agreed','Ready','Delivered','Invoiced','Awaiting Paid','Rejected','Cancelled','Complete'];
///////////

var arr_gro_states = arr_gro_stages_full;//select correct list to use and rebuld!
var arr_gro_min_state = arr_gro_stages;

var syear = 10;
//var s_year_min = 10;
function rebuld_growt_stage_drops(){
    
    console.log('View Year:',syear); 
    
    if(syear>24){
        arr_gro_states = arr_gro_stagesfull_25;
        arr_gro_min_state = arr_gro_stages_25;
    }else{
        arr_gro_states = arr_gro_stages_full;
        arr_gro_min_state = arr_gro_stages; 
    }   
    
    //build lists
    //GrowStage1//GrowStage2
    $('#GrowStage1').empty();
    $('#GrowStage2').empty();

    for(var c=0; c<arr_gro_states.length; c++){                         
        thiscu = arr_gro_states[c];
        $('#GrowStage1').append($('<option>', {value: c,text : thiscu}));
        $('#GrowStage2').append($('<option>', {value: c,text : thiscu}));
    }
    
    
}

//function that gets the location and returns it
function getLocation() {
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, positionError, { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 0 
        });
	}else{
		console.log("Geo Location not supported by browser");
	}

	if(navigator.onLine){
		$('#conbad').hide();
		$('#constate').html('Online');
	}else{
		$('#constate').html('Offline');
		$('#conbad').show();
	}
	
	
}

function positionError( error ) { 
    
        switch ( error.code ) { 
            case error.PERMISSION_DENIED: 
                $('#locovar').html('User denied the request for Geolocation');
                break; 
    
            case error.POSITION_UNAVAILABLE: 
                $('#locovar').html('Location information is unavailable');
                break; 
    
            case error.TIMEOUT: 
    
                //ale rt( "The request to get user location timed out." ); 
                break; 
    
            case error.UNKNOWN_ERROR: 
                $('#locovar').html('An unknown error occurred getting your location');
                break; 
        }
    }

//function that retrieves the position
function showPosition(position) {
    var location = {
    longitude: position.coords.longitude,
    latitude: position.coords.latitude
    }
    locovar = position.coords.latitude+','+position.coords.longitude;
    p_lat = position.coords.latitude;
    p_long = position.coords.longitude;
    $('#locovar').html(locovar);
    $('#locovarmap').html(locovar);
}





//(function () {
  var COMPAT_ENVS = [['Firefox', ">= 16.0"],['Google Chrome',">= 24.0 (you may need to get Google Chrome Canary), NO Blob storage support"]];
  var compat = $('#compat');
  compat.empty();
  compat.append('<ul id="compat-list"></ul>');
  COMPAT_ENVS.forEach(function(val, idx, array) {
    $('#compat-list').append('<li>' + val[0] + ': ' + val[1] + '</li>');
  });

  const DB_NAME = 'dig_app_db';
  const DB_VERSION = 1; // Use a long long for this value (don't use a float)
  const DB_STORE_NAME = 'crops';

  var db;

  // Used to keep track of which view is displayed to avoid uselessly reloading it
  var current_view_pub_key;
  $('#footer').hide();
    $('#status_bot').html('Starting DIG');

    function getObjectStore(store_name, mode) {
        var tx = db.transaction(store_name, mode);
        return tx.objectStore(store_name);
    }

  function openDb() {
    
    //consol e. log("openDb ...");
    var req = indexedDB.open(DB_NAME, DB_VERSION, "persistent");//DB_VERSION//{ version: 1, storage: "persistent" }
      
    req.onerror = function (evt) {
      //ale rt("DB Error");//evt.target.errorCode
      $('#status_bot').html('Database Error');    
    }; 
      
    
    

	
    req.onupgradeneeded = function (evt) {
		//ale rt("Welcome to DIG. Setting up your app now.");
		
		///check the sote, see if the users table ex ists or not... if so, get all the data!
		$('#status_bot').html('Rebuilding Data Store');

		
		
		create_db = evt.currentTarget.result.createObjectStore('podat_crops', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "gid", "CropNo", "Grower", "FarmName", "FID", "FieldGeneration", "Variety", "varietyid", "EntryUnionGrade", "AttainedUnionGrade", "BoxCount", "e3555", "eTotal", "eStartTotal", "allocated_quant", "dispatched_quant", "Quantity", "CropRating", "TestDigRating", "StoreRating", "DatePlanted", "BurnDate", "HarvestDate", "DateHerb", "LatLong", "geo_temp", "eWare", "allocated_quant_s", "allocated_quant_w", "dispatched_quant_s", "dispatched_quant_w", "purc_id", "field_name", "ImActive", "syear", "thisornext"];
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		
		create_db = evt.currentTarget.result.createObjectStore('podat_inspections', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "myuid", "gid", "isp_date", "isp_data", "synckey"]; 
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        create_db = evt.currentTarget.result.createObjectStore('podat_inspection_notes', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "myuid", "gid", "innid", "note_date", "note_desc", "note_state", "add_by_user", "synckey"]; 
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		create_db = evt.currentTarget.result.createObjectStore('podat_testdigs', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "dig_myuid", "gid", "td_date", "td_area", "td_area2", "td_stems", "td_plants", "td_wastage_ratio", "CropRating", "td_score", "td_disease", "td_pest", "td_coments", "dig_1", "dig_2", "dig_3", "dig_4", "synckey"];
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		create_db = evt.currentTarget.result.createObjectStore('podat_boxcounts', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "box_myuid", "gid", "bc_date", "bc_new", "bc_wastage_ratio", "synckey"];
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		

		create_db = evt.currentTarget.result.createObjectStore('podat_dressings', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "id", "dress_myuid", "gid", "CropNo", "OID", "CropGrower", "var_type_grade_country", "drs_by_date", "amt", "chem_at", "store_at", "inspection_date", "size_name", "tons_and_tubs", "diff_chemical", "boxes_used", "boxes_waste", "boxes_remain", "farmer_ready", "got_labels", "notes_after_dress", "pickup_date", "di_status", "Despatch_Ref", "Vehicle_Reg", "part_grade_tns", "synckey", "extra_rs"];//extra_rs is extra data from trade type of dressing
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		create_db = evt.currentTarget.result.createObjectStore('podat_photos', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "ptid", "pttype", "photo_uri", "photo_file", "longlat", "gid", "x_id", "synckey", "idkey"];
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		create_db = evt.currentTarget.result.createObjectStore('podat_pre_burn', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "burn_myuid", "gid", "preb_date", "size_results", "pre_burn_comments", "synckey"];
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		create_db = evt.currentTarget.result.createObjectStore('podat_misc_saves', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "misc_type", "gid", "save_value", "synckey"];
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		
		create_db = evt.currentTarget.result.createObjectStore('podat_user', { keyPath: 'id', autoIncrement: true });
		colarr = ["merc_id", "aid", "username", "userkey", "remote_type", "app_user_type", "digurl", "merchname", "sync_cnt", "sig_default", "insp_list", "insp_html", "insp_common_list"];
		colLn = colarr.length;
		for (i = 0; i < colLn; i++) {
			create_db.createIndex(colarr[i], colarr[i], { unique: false });
		}

		
		//aler_t('DB BUILD DONE');
		

		
		
    };
      
    
      
    req.onsuccess = function (evt) {
		// Equal to: db = req.result;
		db = this.result;
		//ale rt("openDb DONE");
		$('#status_bot').html('Welcome'); 
		$('#footer').hide();
		
		store = getObjectStore('podat_user', 'readonly');
		getusr = store.count();
		getusr.onsuccess = function(evt) {
			
			//aler_t('ucnt:'+evt.target.result);
			//get Location();
			
			//uncomment this for live!
			if ((applive && window.matchMedia('(display-mode: standalone)').matches) || !applive) {  
				
			
			     $('#status_bot').html('Authorising...'); 
			
			
                if(evt.target.result==0){
                    $.mobile.changePage( "#page_index");
                    $('#status_bot').html('Enter URL & Email Address'); 					
                    $('#auth_form').show();

                }else if(evt.target.result==1){
                    //get the record! and load it...
                    actual_user_cnt = 1;

                    load_user(0);
                }else{
                    ///show the merch list
                    actual_user_cnt = evt.target.result;



                    $('#status_bot').html('Select Merchant or Register'); 
                    $('#select_merchant_rows div').remove();
                    //urslst = getObjectStore('podat_user', 'readonly');
                    store.openCursor().onsuccess = function(x) {
                        cursor = x.target.result;
                        //consol e. log("row :", cursor.value, 'k:'+cursor.key);
                        if (cursor) {
                            trow = cursor.value;
                            thismdiv ='<div class="mb-3 mt-2"><a class="h3 a_box" onclick="select_existing('+trow.merc_id+',\''+trow.merchname+'\')">'+trow.merchname;
                            if(trow.sync_cnt!='0'){thismdiv +=' <span class="fr circlered">'+trow.sync_cnt+'</span>';}
                            //thismdiv +=' <span class="fr circlered">3</span>';
                            thismdiv +='</a></div>';
                            $('#select_merchant_rows').append(thismdiv);
                            cursor.continue();
                        }

                    };	

                    $.mobile.changePage( "#page_index");

                    $('#auth_form').show();
                    $('#select_merchant_div').show();			


                }
			//uncomment this for live!	
			}else{
                
                installguide = "<h2>Welcome</h2><h3 style='color:#3CAB64; padding-bottom:29px;'>To install, add this to your mobile homescreen.</h3>";   
                installguide += "<div style='background:#414141; border-radius:13px; padding:15px;'>";
                installguide += "<h3 style='color:#d36448'>iPhone Guide</h3>";
                installguide += "<p>Open your share menu at the bottom of your SAFARI screen, it looks like a box with an arrow in it.</p>";
                installguide += "<p>In that menu, choose the option <strong style='color:#d36448;'>Add to Home Screen</strong> and Add the app.</p>";
                installguide += "<p>Close your browser, and open the new App in your homescreen icons.</p>";
                installguide += "<p>Access the app by using the address in your invite, or ask your merchant for guidance.</p>";
                installguide += "<p style='padding-top:10px;'><a href='https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing' style='color:#d36448;' target='_blank'>General Guide</a></p>";
                
                installguide += "</div><div style='margin-top:15px; background:#414141; border-radius:13px; padding:15px;'>";
                installguide += "<h3 style='color:#d36448;'>Android Guide</h3>";
                installguide += "<p>Click the three dots at the top of your CHROME screen.</p>";
                installguide += "<p>Select <strong style='color:#d36448;'>Add to Home Screen</strong> and Add the app.</p>";
                installguide += "<p>Close your browser, and open the new App in your homescreen icons.</p>";
                installguide += "<p>Access the app by using the address in your invite, or ask your merchant for guidance.</p>";
                installguide += "<p style='padding-top:10px;'><a href='https://support.google.com/chrome/answer/9658361' style='color:#d36448;' target='_blank'>Google Guide</a></p>";
                installguide += "</div>";
                $('#status_bot').html(installguide); 
			}	
				
				
				
		};
    };  
      
      
    req.onblocked = function (evt) {
      alert("Your database version can't be upgraded because the app is open somewhere else.");
    $('#status_bot').html('Database Locked');
    };
	 
	setTimeout(gocheckStart, 4000);	 
	
	  
  }

  
 function gocheckStart(){
   // ale rt($('#status_bot').html());
     
    if($('#status_bot').html()=='Welcome'){
        $('#status_bot').html('Starting DIG...');
        openDb();//fucking iOS! 
        
    }
    
     
 }
  
 

//})(); // Immediately-Invoked Function Expression (IIFE)



//https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
//https://medium.com/jspoint/service-workers-your-first-step-towards-progressive-web-apps-pwa-e4e11d1a2e85
//https://medium.com/jspoint/indexeddb-your-second-step-towards-progressive-web-apps-pwa-dcbcd6cc2076
//https://codelabs.developers.google.com/codelabs/workbox-indexeddb/index.html?index=..%2F..index#2



// Registering Service Worker
if('serviceWorker' in navigator) {
	navigator.serviceWorker.register('./sw.js');
};

$(document).delegate("#page_crops", "pageshow", function() {    
	$("#footer").hide();
	$("#crop_edit_foot").fadeOut(500);	
});



function set_button_high() {	
	active_page = $.mobile.pageContainer.pagecontainer( 'getActivePage' ).attr( 'id' );
	
	$(".foot_icon").removeClass('active');	
	
	if(active_page=='page_crop_inspection'){
		$(".inspect").addClass('active');
	}else if(active_page=='page_test_dig'){
		$(".testdig").addClass('active');  
	}else if(active_page=='page_box_count'){
		$(".boxcount").addClass('active');  
	}else if(active_page=='page_dress'){
		$(".dress").addClass('active');  
	}
}

function back_clicked() {
	$(".foot_icon").removeClass('active');
	active_page = $.mobile.pageContainer.pagecontainer( 'getActivePage' ).attr( 'id' );
	//aler_t(active_page);
	if(active_page=='page_crops'){
		swap_my_access();
	}else{
		window.history.back(); 		
	}
	
}


function back_home(){
	///reload the crops
	reset_active_crops_then_load();
	$.mobile.changePage( "#page_crops", { transition: "flip"} );
}

function backhome(forcehome=0){
    active_page = $.mobile.pageContainer.pagecontainer( 'getActivePage' ).attr( 'id' );
	if(active_page=='page_crop_details' || forcehome==1){
		back_home();
	}else{
		$.mobile.changePage( "#page_crop_details", { transition: "flip"});
        gotop('page_crop_details');
	}
}




function gotop(what) {
	//event.preventDefault();
	$('#'+what).delay(300).animate({scrollTop: 0}, 500, 'swing');
}


function load_box_in_form() {
    ///reset
    $("#bxin_mark_1").val('');
    $("#bxin_cnt_1").val('');
    $("#bxin_mark_2").val('');
    $("#bxin_cnt_2").val('');
    $("#bxin_mark_3").val('');
    $("#bxin_cnt_3").val('');
    $("#bxin_comments").val('');
    $("#bxin_haulier").val('');
    $("#bxin_date").val('');
    $("#bxin_vehicle").val('');
    $("#bxin_customer_name").val('');
    //$("#bxin_type1").prop("checked", true);
    $("#bxin_type1").attr('checked', 'checked');
	$.mobile.changePage( "#page_box_in_form", { transition: "flip"});
    gotop('page_box_in_form');
}


function format_date(ddd) {
    date = new Date(ddd);
    day = date.getDate();
    month = date.getMonth();
    year = date.getFullYear();

    document.write(day + '/' + month + '/' + year);
}




function submit_boxes_in() {
    
    if(navigator.onLine){

            
            var boxinform = $('#boxinform').serialize();
			$('#no_live_data').hide();
            //consol e.log('save_passport save boxinform:',boxinform);
            
			$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "boxinform":boxinform, "x": "_1%&6881$*$£632hs"}, url: mobSysURL+"dig_mobxxx/db_save_box_in_report.php", success: function(data){
                
				if(data=='404'){
					alert('Sorry, no match found, please try again. [6]');
				}else{
					var rz = data.rez[0];
 
                    if(rz=='success'){
                        $("#bxin_mark_1").val('');
                        $("#bxin_cnt_1").val('');
                        $("#bxin_mark_2").val('');
                        $("#bxin_cnt_2").val('');
                        $("#bxin_mark_3").val('');
                        $("#bxin_cnt_3").val('');
                        $("#bxin_comments").val('');
                        $("#bxin_haulier").val('');
                        $("#bxin_date").val('');
                        $("#bxin_vehicle").val('');
                        $("#bxin_customer_name").val('');
                        //$("#bxin_type1").prop("checked", true);
                        //$("#bxin_type1").prop("checked", true);
                        $("#bxin_type1").attr('checked', 'checked');
                        
                        
                        alert('Boxes I/O saved and reported to merchant.');
                        $.mobile.changePage( "#page_crops", { transition: "flip"});
                        gotop('page_crops');
                        
                        
                    }else{
                        alert('Mmmm there was an error, please check your values.');
                    }
                  
										
                        
				}

			},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Mmmmm report did not save!!! ');}
			});
		}else{
			$('#no_live_data').show();
		}
    
    
    
	
}


function clean_quotes(str) {
	
	if(!str || str===''){
		str = '';
	}
	nustr = str;
	nustr = nustr.trim();
	
	if(nustr.length>0){
		nustr = nustr.replace(/'''/g, "'");
		nustr = nustr.replace(/'''/g, "'");
		nustr = nustr.replace(/''/g, "'");
		nustr = nustr.replace(/''/g, "'");
		nustr = nustr.replace(/'/g, "''");
		nustr = nustr.replace(/:null,/g, ':"",');
		nustr = nustr.replace(/\0/g,"");
	}
	return nustr.trim();
}




function clean_url(str, con=0) {
	nustr = str;
	nustr = nustr.trim();
	nustr = nustr.trim();
	nustr = nustr.toLowerCase();
	while (nustr.indexOf(" ") > -1) {
        nustr = nustr.replace(" ", "");
    }
	if(nustr.length>0){
		nustr = nustr.replace(/'''/g, "'");
		nustr = nustr.replace(/'''/g, "'");
		nustr = nustr.replace(/''/g, "'");
		nustr = nustr.replace(/''/g, "'");
		nustr = nustr.replace(/'/g, "''");
		nustr = nustr.replace(/:null,/g, ':"",');
		nustr = nustr.replace(/\0/g,"");
		nustr = nustr.replace(/ /g,"");
		nustr = nustr.replace(/&/g,"");
		nustr = nustr.replace(/[\(\)]/g,"");
	}
	
	if(con==1){
	nustr = convert(nustr);   
	}
	
	
	return nustr.trim();
}

function convert(nustr) {
	ret = '';
	for (var i = 0; i < nustr.length; i++) {
		ret += nustr[i].charCodeAt(0);
	}
	return ret;
}



function rand_str(length) {
	var ret = '';
	var characters = '8MH5PGRLXA9WSV47FT3KUJ21YNOEQB0D6ZCI';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
		ret += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return ret;
}

function ajaxerror(a,b,c,d,e) {
    if(b){
    alert(a+'||'+b+'||'+c+'||'+d+'||'+e);   
    }else{
    alert(a);   
    }
	
}



function show_loading(){
	$("#loaderh3").html('SYNCING');
	$("body").addClass('ui-disabled');
	$("#loadbox").show();

}
function hide_loading(){
	/*$.mobile.loading('hide');*/
	$("body").removeClass('ui-disabled');
	$("#loadbox").hide();
	$("#loaderh3").html('SYNCING');
}






function swap_my_access(){	
	//!!!!!!!!!stop, need to check for any sync stuff!!!	
	//if (confirm('Are you sure you want to swap merchants. We recommend you do a sync first.')) {
		swap_my_access_gogo();		
	//}else{
		
	//}	
}


function swap_my_access_gogo(){
	$.mobile.changePage( "#page_index");
	$('#status_bot').html('Enter URL & app key');
	$('#auth_form').show();
	$("#footer").show();
}


function select_existing(selmerch,gn) {
	$('#status_bot').html('Loading User');
$('#concust_list_box').hide();
$('#dress_list_box').hide();
$('#passport_list_box').hide();
$('#crop_list_boxg').hide();
$('#crop_list_boxv').hide();
	load_user(selmerch);
}

function get_index_by_val(s_name, the_obj='', the_val='', dbrow, gotofun=''){
	var store = getObjectStore(s_name, 'readonly');	
	var gotreclen = 0;
	//aler_t(s_name+'/'+the_obj+'/'+the_val+' / '+merch_id);
	try{
		store.openCursor().onsuccess = function(e) {
			
			var cursor = e.target.result;
			
			if(cursor){
				//get_index_by_ val('podat_ crops', 'gid', trow.gid, trow, 'load_dress_ list_add_ row');
				if (cursor.value[the_obj]==the_val && cursor.value.merc_id==merch_id) {
					gotreclen = 1;
					//aler_t(cursor.value);
					
					if(gotofun!=''){
						if (typeof window[gotofun] == "function"  ) {
							window[gotofun](dbrow, cursor.key, cursor.value.Grower);
						}
						//this[gotofun](record);
					  // return fill_crop_ detail(record);
					}else{
						return cursor.value; 
					}
					
					
																	
				};   

				cursor.continue();  
				
			}else if(gotreclen==0){
				return -1;	
			}


		};
	}catch(e){
		console.error("GET ROW ERROR:", evt.target.errorCode);
		throw e;
		return -1;			
	}
}




function get_row_by_index(s_name, the_obj, gotofun=''){
	//consol e. log("get_row_by_ index:", s_name, the_obj, gotofun);
	var retval = 0;//assume success
	var req;
	var store = getObjectStore(s_name, 'readonly');	
	try{
		req = store.get(the_obj);
		req.onsuccess = function (evt) {
			///okay
			var record = evt.target.result;
			//consol e. log("get single :", record);					
			if (typeof record == 'undefined') {
				//aler_t("No matching record fo und");
			}else{
				if(gotofun!=''){
					if (typeof window[gotofun] == "function"  ) {
						window[gotofun](record);
					}
					//this[gotofun](record);
				  // return fill_crop_ detail(record);
				}else{
					return record;
				}
			}
		};
		req.onerror = function (evt) {
			//this.error
			retval = 0;	
		};	
	}catch(e){
		console.error("GET ERROR:", evt.target.errorCode);
		retval = -1;	
		throw e;
	}	
	return retval;	
}



function get_row_by_val(s_name, the_obj, the_val, gotofun='', the_obj2=0, the_val2=0, actionarray=''){
	var store = getObjectStore(s_name, 'readonly');	
	var gotreclen = 0;
    var actionarray_go = actionarray;
    use_dri_type = $('#dress_id_type').val();
    //if(actionarray_go!=''){consol e.log('get_row_by_val act', actionarray_go);}
	
    
	try{
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			
			if(cursor){
				
				if (cursor.value[the_obj]==the_val && cursor.value.merc_id==merch_id) {
					if(the_obj2==0 || (the_obj2!=0 && cursor.value[the_obj2]==the_val2)){ ///check for 0 or another value comparison
						//consol e. log("get rbv:", cursor.value);
						gotreclen = 1;
						if(gotofun!=''){
							if (typeof window[gotofun] == "function" ) {
                                window[gotofun](cursor.value, actionarray_go); 

							}
						}else{
							return cursor.value;  
						}
						
						//cursor.stop();
						
						
					}								
				};   

				cursor.continue();  
				
			}else if(gotreclen==0){
				if(gotofun!=''){
					if (typeof window[gotofun] == "function"  ) {
						window[gotofun](-1, actionarray_go);
					}
					//this[gotofun](record);
				  // return fill_crop_ detail(record);
				}else{
					return -1;  
				}
			}


		};
		
		
		
		
		
		
		
	}catch(e){
		console.error("GET ROW ERROR:", evt.target.errorCode);
		throw e;
		return -1;			
	}
	
	
	
	//return -1;	
}


function go_insert_(s_name, the_obj){
	//consol e. log("addCrop Row Args:", arguments);
	var retval = 1;//assume success
	var req;
	var store = getObjectStore(s_name, 'readwrite');	
	try{
		req = store.add(the_obj);
		req.onsuccess = function (evt) {
			///okay
		};
		req.onerror = function (evt) {
			//this.error
			retval = 0;	
			console.error("TRANS ERROR 1:", evt.target.errorCode);
		};	
	}catch(e){
		console.error("TRANS ERROR 2:", e);
		retval = -1;	
		throw e;
	}
	
	
	return retval;	
}


function set_active_crop_(the_gid, the_active=0, the_dress=0){
	if(the_gid>0 && (the_active>0 || the_dress>0)){
		//aler_t(the_gid);
		var store = getObjectStore('podat_crops', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			//consol e. log("row :", cursor.value, 'k:'+cursor.key);
			if(cursor){
				if (cursor.value.gid==the_gid) {

					updateData = cursor.value;		

					if(the_active>0){updateData.ImActive = 1;}


					const request = cursor.update(updateData);
					request.onsuccess = function() {
						//consol e. log("ste to active :"+updateData, 'thegid:'+the_gid);

					};

					//////////////////////////////////

				}else{
					cursor.continue();
				}
			
			}
			
		};
	}
}




var act_List = [];

function reset_active_crops_then_load(){
        
		$("#reload_buts_box").show();
    
		act_List = [];
		
		////////////////////podat_ inspections,podat_testdigs,podat_ photos,podat_pre_burn,podat_misc_saves
		var store = getObjectStore('podat_boxcounts', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.gid>0) {
					act_List.push(cursor.value.gid);
				}
				cursor.continue();			
			}		
		};
	
		////////////////////
		var store = getObjectStore('podat_inspections', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.gid>0) {
					if(!act_List.includes(cursor.value.gid)){act_List.push(cursor.value.gid);}
				}
				cursor.continue();
			
			}		
		};
	
		////////////////////
		var store = getObjectStore('podat_testdigs', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.gid>0) {
					if(!act_List.includes(cursor.value.gid)){act_List.push(cursor.value.gid);}
				}
				cursor.continue();
			
			}		
		};
	
		////////////////////
		var store = getObjectStore('podat_photos', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.gid>0) {
					if(!act_List.includes(cursor.value.gid)){act_List.push(cursor.value.gid);}
				}
				cursor.continue();			
			}		
		};
	
		////////////////////
		var store = getObjectStore('podat_pre_burn', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.gid>0) {
					if(!act_List.includes(cursor.value.gid)){act_List.push(cursor.value.gid);}
				}
				cursor.continue();			
			}		
		};
	
		////////////////////
		var store = getObjectStore('podat_misc_saves', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.gid>0) {
					
					if(!act_List.includes(cursor.value.gid)){
						//aler_t(cursor.value.gid);
						act_List.push(cursor.value.gid);
					}
				}
				cursor.continue();			
			}else{
				setTimeout(fin_act_list, 500);
				//fin_act_ list();
				//aler_t(JSON.stringify(act_ List)); 
			}		
		};
	
		//if(act_ List.length>0){
		//aler_t(JSON.stringify(act_ List));   
		//}
		
        
}



function fin_act_list(){
	
        
		//aler_t(JSON.stringify(act_ List));	
		
		var store = getObjectStore('podat_crops', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			//consol e. log("row :", cursor.value, 'k:'+cursor.key);
			if(cursor){
				
				
				if(act_List.length>0 && act_List.includes(cursor.value.gid)){
					updateData = cursor.value;
					updateData.ImActive = 1;
					const request = cursor.update(updateData);
				}else if(cursor.value.ImActive=='1' || cursor.value.ImActive==1){
					updateData = cursor.value;
					updateData.ImActive = 0;
					const request = cursor.update(updateData);
				}
				
								
				
				cursor.continue();				
			
			}else{
				//aler_t(act_ List.length);
				buildCropView();
                if(remote_type==0 && username.length<=3 && username.length>1){
                    
                    $('#syncmess').hide();
                    $('#searchboxdiv').hide(); 
                    $("#reload_buts_box").hide();
                    get_live_con_customers();
                }else{
                    $('#syncmess').show();
                    $('#searchboxdiv').show();
                    $("#reload_buts_box").show();
                }
			}
			
		};
		

}


function set_val_by_(s_name, the_gid, the_item=0, the_val=0, the_item2=0, the_val2=0){
	
	if(the_gid>=0 && the_item!='' && s_name!=''){

		//e_gid = parseInt(the_gid);
		//ale rt('1:: '+the_gid+' / '+the_item+' / '+the_val+' in:: '+s_name);
		var store = getObjectStore(s_name, 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				//ale rt(cursor.value.gid);
				if (cursor.value.gid==the_gid) {
					
					//ale rt('2:: '+the_gid+' / '+the_item+' / '+the_val+' in:: '+s_name);
					if((the_item2==0) || (the_item2!=0 && cursor.value[the_item2]==the_val2)){
						//consol e. log("upitem :"+cursor.value, 'k:'+cursor.key, 's:'+s_name, 'gid:'+the_gid, 'i:'+the_item, 'v:'+the_val);
						updateData = cursor.value;

						updateData[the_item] = the_val;

						const request = cursor.update(updateData);
						request.onsuccess = function() {
						
						}


					};
				
			}
			cursor.continue();
				//////////////////////////////////

				
			};
		};
	}
}
function set_user_val_by_(s_name, aid, the_item=0, the_val=0){
	
	if(aid>=0 && the_item!='' && s_name!=''){

		var store = getObjectStore(s_name, 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				//ale rt(cursor.value.gid);
				if (cursor.value.aid==aid) {

					

						updateData = cursor.value;

						updateData[the_item] = the_val;

						const request = cursor.update(updateData);
						request.onsuccess = function() {
					


					};
				
			}
			cursor.continue();
				//////////////////////////////////

				
			};
		};
	}
}


function delete_from_store_where(s_name, z_column=0, z_val=0, x_column=0, x_val=0) {

	
	var store = getObjectStore(s_name, 'readwrite');
	store.openCursor().onsuccess = function(e) {
		var cursor = e.target.result;
		if(cursor){
		if (cursor.value.merc_id==merch_id) {
			//consol e. log("row :", 'k:'+cursor.key, 'sss:'+s_name);
			//delete_from_store_ where('podat_boxcounts', 'box_myuid', 'EX5YPW8LR0VOEC9EC40CT72B', 'synckey', userkey);		
					
					del_key = cursor.key;
					//its a match, delete it!//////////			
					var req = store.get(del_key);


							req.onsuccess = function(evt) {
								var record = evt.target.result;
								//consol e. log("record:", record);					
										if (typeof record == 'undefined') {
											//aler_t("No matching record found");
											//return;
										}else{
													// Warning: The exact same key used for creation needs to be passed for// the deletion. If the key was a Number for creation, then it needs to// be a Number for deletion.
													///do we have a seocnd value?
													delgogo = 0;
											
													if(x_column!=0 && z_column!=0){
														if((cursor.value[z_column]==z_val) && (cursor.value[x_column]==x_val)){
															delgogo = 1;
														}   
													}else if(z_column!=0 && z_val!=0 && cursor.value[z_column]==z_val){
														delgogo = 1;
													}else if(x_column==0 && z_column==0){
														///delete all
														delgogo = 1;
													}

													if(delgogo == 1){

														ddd = store.delete(del_key);
														ddd.onsuccess = function(evt) {
															//consol e. log("evt:", del_key, z_column, z_val);
														};
														ddd.onerror = function (evt) {
															console.error("deleteerron:", evt.target.errorCode);
														};

													}



										}
							};
							req.onerror = function (evt) {
								console.error("deleteerr:", evt.target.errorCode);
							};
					
			
			
		};
			
			
		cursor.continue();
		}
	};

}

//delete_from_store_not_where('podat_ inspections', 'myuid', 'NEW');
function delete_from_store_not_where(s_name, z_column=0, z_val=0, x_column=0, x_val=0) {

	
	var store = getObjectStore(s_name, 'readwrite');
	store.openCursor().onsuccess = function(e) {
		var cursor = e.target.result;
		if(cursor){
		if (cursor.value.merc_id==merch_id) {
			//consol e. log("row :", 'k:'+cursor.key, 'sss:'+s_name);
			//delete_from_store_ where('podat_boxcounts', 'box_myuid', 'EX5YPW8LR0VOEC9EC40CT72B', 'synckey', userkey);		
					
					del_key = cursor.key;
					//its a match, delete it!//////////			
					var req = store.get(del_key);


							req.onsuccess = function(evt) {
								var record = evt.target.result;
								//consol e. log("record:", record);					
										if (typeof record == 'undefined') {
											//aler_t("No matching record found");
											//return;
										}else{
													// Warning: The exact same key used for creation needs to be passed for// the deletion. If the key was a Number for creation, then it needs to// be a Number for deletion.
													///do we have a seocnd value?
													delgogo = 0;
											
													if(x_column!=0 && z_column!=0){
														if((cursor.value[z_column]!=z_val) && (cursor.value[x_column]!=x_val)){
															delgogo = 1;
														}   
													}else if(z_column!=0 && z_val!=0 && cursor.value[z_column]!=z_val){
														delgogo = 1;
													}else if(x_column==0 && z_column==0){
														///delete all
														delgogo = 1;
													}

													if(delgogo == 1){

														ddd = store.delete(del_key);
														ddd.onsuccess = function(evt) {
															//cons ol e. log("evt:", del_key, z_ olumn, z_ val);
														};
														ddd.onerror = function (evt) {
															console.error("deleteerron:", evt.target.errorCode);
														};

													}



										}
							};
							req.onerror = function (evt) {
								console.error("deleteerr:", evt.target.errorCode);
							};
					
			
			
		};
			
			
		cursor.continue();
		}
	};

}


function delete_all_from_store_(s_name) {

	
	var store = getObjectStore(s_name, 'readwrite');
	store.openCursor().onsuccess = function(e) {
		var cursor = e.target.result;
		if(cursor){
			if (cursor.value.merc_id==merch_id) {				
				del_key = cursor.key;
				ddd = store.delete(cursor.key);	
			};	

			cursor.continue();
		}else{
            if(s_name=='podat_crops'){
                get_crop_data_gogo();
            }
		}
	};
	
	//ale rt('e');
}
















function go_check_key(){	

	
	
	
	var my_email = $('#my_email').val().trim();
	var akey = $('#my_access_key').val().trim();
	var digurl = $('#my_dig_url').val().trim();
	
	digurl = digurl.replace("http://", "");
	digurl = digurl.replace("/dig/", "");
	digurl = digurl.toLowerCase();
	
	my_email = my_email.toLowerCase();
	//if(akey=='PURGE'){db_purge();}
	
	if(akey.length==10 && digurl.length>10){		

				$('#status_bot').html('Authorising SMS Code');
        
        //if(digurl=='www.tayfusion.com'){dg folder = 'dig-demo';}else{dg folder = 'dig';}
		//$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"something":akey, "x": "dasd%&$dkasgdas"}, url: "https://"+digurl+"/"+dg folder+"/dig_mobxxx/db_auth_usr.php", success: function(data){
				$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"something":akey, "x": "dasd%&$dkasgdas"}, url: "https://"+digurl+"/dig_mobxxx/db_auth_usr.php", success: function(data){

					if(data=='404'){
						alert('Sorry no match found, please try again [1]');
					}else{
						var rz = data.rez;

						if(rz.length==1 && rz[0]['mob_key'].length==26){
								$('#auth_form').hide();
								///create user
								//"merc_id", "username", "userkey", "remote_ type", "digurl", "merchname"
                                //consol e.log('USercheck:', rz[0]);
								thismerc = actual_user_cnt+1;
								var obj = {merc_id: thismerc, aid: rz[0]['id'], username: rz[0]['username'], userkey: rz[0]['mob_key'], remote_type: rz[0]['remote_type'], app_user_type: rz[0]['app_user_type'], digurl: digurl, merchname: rz[0]['growname'], sync_cnt:0, sig_default:'', insp_list: rz[0]['insp_list'], insp_html: rz[0]['insp_html'], insp_common_list: rz[0]['insp_common_list']};	
								docall = go_insert_('podat_user', obj);
								if(docall==1){
									//aler_t("Insertion in Crops successful");
									//do_i_exist();
									actual_user_cnt++;				
									load_user(thismerc);
									
									
									
								}else{
									alert("Error adding account");
									$('#my_email').val('');
									$('#my_access_key').val('');
									$('#my_dig_url').val('');
									$('.logdivhide').show();
									$('.logdivshow').hide();
								}
						}


					}

				},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Check Your URL, it may be incorrect. Be Precise.');}
				});		
	}else if(my_email.length>6 && digurl.length>10){
		///get my key text
			//aler_t('Call KEY');
			$('#status_bot').html('Authorising Email');
            //consol e.log('digurl',digurl);
		        //if(digurl=='www.tayfusion.com'){dg folder = 'dig-demo';}else{dg folder = 'dig';} 
                //$.ajax({type: "POST", dataType: "html", crossDomain: true, cache: false, data:{"myem":my_email, "x": "dasd%&$dkasgdas"}, url: "https://"+digurl+"/"+dg folder+"/dig_mobxxx/db_auth_usr.php", success: function(data){
				$.ajax({type: "POST", dataType: "html", crossDomain: true, cache: false, data:{"myem":my_email, "x": "dasd%&$dkasgdas"}, url: "https://"+digurl+"/dig_mobxxx/db_auth_usr.php", success: function(data){

					if(data=='404' || data==0){
						alert('Sorry, no match found, please try again. [2]:'+data);
						//$('#my_email').val('');
						$('#my_access_key').val('');
						//$('#my_dig_url').val('');
						$('.logdivhide').show();
						$('.logdivshow').hide();
					}else{
						if(data==1){
							//aler_t('We have sent your access key by SMS text. Please check your mobile phone.');
							///change the view
							$('.logdivhide').hide();
							$('.logdivshow').show();
						}else{
							alert('Sorry, we could not send your access key. Please confirm with the merchant that you have access.');
						}
						//aler_t(data);
						
					}

				},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Check Your URL, it may be incorrect. Enter it exactly.');}
				});		 
	}else{
			 
			 
	}
	
	
	
	
	
	
}


function load_user(mcid){
	
	///reset form - for next time
	
	$('#logdivshow').hide();
	$('#my_email').val('');
	$('#my_access_key').val('');
	$('#my_dig_url').val('');
	////////////////////
	insp_common_html_list = [];
	//aler_t('MCID:'+mcid);
	//"merc_id", "user name", "userkey", "remote_ type", "digurl", "merchname"
	var store = getObjectStore('podat_user', 'readonly');
	//if there are no records, this will do nothing!
	store.openCursor().onsuccess = function(e) {
		var cursor = e.target.result;		
		if (cursor) {
			//consol e. log("U ROW :", cursor.value, 'k:'+cursor.key);
			//////////////////////////////////
			urow = cursor.value;
			if((mcid>0 && urow.merc_id==mcid) || mcid==0){
				///load this user!
				merch_id = urow.merc_id;
				aid = urow.aid;
				userkey = urow.userkey;
                mobSysURL = 'https://'+urow.digurl+'/';
				
				username = urow.username;
				remote_type = urow.remote_type;
				merchname = urow.merchname;
				this_sync_cnt = urow.sync_cnt;
				sig_default = urow.sig_default;
                app_user_type = urow.app_user_type;
                insp_list = urow.insp_list;
                
                insp_list_track_items  = insp_list.split(","); 
                
                $('#live_inspect_html').html(urow.insp_html);
                $('#live_inspect_html').trigger("create");//.trigger('pagecreate');
                //$('#live_inspect_html').listview('refresh').trigger("create");//.trigger('pagecreate');
                
                $('#common_notes_table').html('');
                if(urow.insp_common_list !=null){
                inspcommon_list = JSON.parse(urow.insp_common_list);

                    //consol e.log(inspcommon_list);
                    //common_notes_div //common_notes_table //common_notes_tog_but
                    if(inspcommon_list.length>=1){
                        $.each(inspcommon_list, function(idx, itm) { 
                            if(itm.note_is_common==1){
                                $('#common_notes_table').append('<tr><td class="nofold py-2 bold clickynote" onClick="click_go_note(\''+itm.note_desc+'\');">'+itm.note_desc+'</td></tr>').enhanceWithin();
                            }else{
                                insp_common_html_list.push(itm);
                            }
                            //
                            
                        });
                        $('#common_notes_tog_but').show();
                        //$('#common_notes_div').show();
                    }else{
                        $('#common_notes_tog_but').hide();
                        //$('#common_notes_div').hide();
                    }
                }
                
                
                
                //consol e.log('urow check',urow);
                if(app_user_type=='0'){
                    //admin
					$('.foot_icon.testdig').show();
                    $('.foot_icon.inspect').show();
				}else{
                    //store user
					$('.foot_icon.testdig').hide();
                    $('.foot_icon.inspect').hide();
				}
                
				if(remote_type==1 || remote_type==0){
					$('.testdig').show();	
				}else{
                    //app user
					//$('.testdig').hide();
				}

				
				$.mobile.changePage( "#page_crops", { transition: "flip"} );
                $('#auth_form').show();///do this later so it does not flash up!
				//get Location();
				//store.close();
				//buildCrop View();///build the view first!
				reset_active_crops_then_load();///get active & build the view first!
				//get_crop_ data();
			}else{
			     cursor.continue();
			}
		}
	}
}


//

function common_notes_tog(){
	$("#common_notes_div").slideToggle();
}




function click_go_note(nte){

    nown = $('#notepdesc').val();
    //okay, check see if it is there?
    if(nown.includes(nte)){
        itthere = 1;
    }else{
        itthere = 0;
    }

 
    if(itthere==1){
        ///remove
        nown=nown.replace(nte, "");
        nown=nown.trim();
        $('#notepdesc').val(nown);
    }else{
        if(nown.length){nown+="\r"+nte;}else{nown=nte;}
        $('#notepdesc').val(nown);
    }
    //clean
    nown = $('#notepdesc').val();
    nown = nown.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, "");
    $('#notepdesc').val(nown);

}









function get_all_crop_data(){
	$delall_ = delete_all_from_store_('podat_crops');
}





function get_crop_data_gogo(){
	
    //$delall_ = delete_all_from_ store_('podat_crops');
	$("#crop_edit_foot").hide();
	$('#status_bot').html('Getting Live Crops');
	$('#crop_list_tableg div').remove();
    $('#crop_list_tablev div').remove();
    getseason = $("#get_crop_ns").val();
	show_loading();
	$("#footer").hide();

	//al ert(getseason);
	
	
	///delete all where the merc_id is the current active merc_id
	
	
	
	//consol e. log('get_crop_data_ gogo',userkey, '_7s65%&$*%$kmg321', mobSysURL);
	
	
	if(!applive){console.log('Zpp Live: UK',userkey, mobSysURL);}
	
	if(userkey.length==26){
		
        
        
		$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "x": "_7s65%&$*%$kmg321", "seas":getseason}, url: mobSysURL+"dig_mobxxx/db_get_my_crops.php", success: function(data){
			
			
			//console. log(JSON.stringify(data));
            
            
			if(JSON.stringify(data)=="404"){
				
				///user is connected, and its a 404, so their access has been revoked!
				//db.transaction(function(tx){tx.executeSql("DELETE FROM podat_user WHERE userkey='"+userkey+"'",[], successCallBack, errorHandler);},errorHandler,successCallBack);
				$delallu_ = delete_all_from_store_('podat_user');
                $('#status_bot').html('No connection to merchant [1]');
				$.mobile.changePage( "#page_index");
				$('#status_bot').html('Enter URL & app key');
				$('#auth_form').show();

				
				
				
			}else{			
					rz = data.rez;
					
					
					if(rz.length>0 && rz[0]!='0'){
							//aler_t('got db rows: '+rz.length);
							//"merc_id", "gid", "CropNo", "Grower", "Farm Name", "FID", "FieldGeneration", "Variety", "Entry UnionGrade", "Attained UnionGrade", "BoxCount", "e3555", "eTotal", "eStartTotal", "allocated_quant", "dispatched_quant", "Quantity", "CropRating", "TestDigRating", "StoreRating", "DryMatter_ PCT", "Spraing_PCT", "DatePlanted", "BurnDate", "Harvest Date", "Dress Waiting"
								
							transokay = false;
							for(var z=0; z<rz.length; z++){						
								if(rz[z]['CropNo']!=undefined){
                                    
                                    //
                                    //set up the inspection page!
                                    if(z==0 && parseInt(rz[z]['syear'])!=syear){
                                        syear = parseInt(rz[z]['syear']);                                                
                                        rebuld_growt_stage_drops();                                        
                                        //consol e.log('CRPX:',rz[z]);                                        
                                    }
                                    
                                    
                                    
                                    
                                    

											CropNo = clean_quotes(rz[z]['CropNo']);
											Grower = clean_quotes(rz[z]['Grower']);
											FarmName = clean_quotes(rz[z]['FarmName']);
                                            field_name = clean_quotes(rz[z]['field_name']);
											FID = clean_quotes(rz[z]['FID']);
											Variety = clean_quotes(rz[z]['Variety']);
											FieldGeneration = clean_quotes(rz[z]['FieldGeneration']);

							        
									
											var obj = {merc_id: merch_id, gid: rz[z]['id'], CropNo: CropNo, latlng_json:rz[z]['latlng_json'], marker_json:rz[z]['marker_json'], Grower: Grower, FarmName: FarmName, FID: FID, FieldGeneration: FieldGeneration, Variety: Variety, varietyid: rz[z]['variety_id'], EntryUnionGrade: rz[z]['EntryUnionGrade'], AttainedUnionGrade: rz[z]['AttainedUnionGrade'], BoxCount: rz[z]['BoxCount'], e3555: rz[z]['e3555'], eTotal: rz[z]['eTotal'], eStartTotal: rz[z]['eStartTotal'], allocated_quant: rz[z]['allocated_quant'], dispatched_quant: rz[z]['dispatched_quant'], Quantity: rz[z]['Quantity'], CropRating: rz[z]['CropRating'], TestDigRating: rz[z]['TestDigRating'], StoreRating: rz[z]['StoreRating'], DatePlanted:rz[z]['DatePlanted'], BurnDate:rz[z]['BurnDate'], HarvestDate:rz[z]['HarvestDate'],DateHerb:rz[z]['DateHerb'], LatLong:rz[z]['LatLong'], geo_temp:rz[z]['geo_temp'], eWare:rz[z]['eWare'], allocated_quant_s:rz[z]['allocated_quant_s'], allocated_quant_w:rz[z]['allocated_quant_w'], dispatched_quant_s:rz[z]['dispatched_quant_s'], dispatched_quant_w:rz[z]['dispatched_quant_w'], purc_id:rz[z]['purchase_id'], field_name:rz[z]['field_name'], ImActive:0, syear:rz[z]['syear'], thisornext:$("#get_crop_ns").val() };	
											//docall=1;
                                            console.log('insert crp: ', CropNo);
											docall = go_insert_('podat_crops', obj);
									
											if(docall==1){
												//aler_t("Insertion in Crops successful");
												//hide_loading();
											}else{
												alert("Error adding :"+rz[z]['id']+" / "+CropNo+" / "+Grower+" / docall:"+docall);
											}
											
								}
							}
							hide_loading();
							get_live_dressings();
                        
                         
					}else{
                        if(remote_type==0 && username.length<=3 && username.length>1){
                            //ale rt('No crops... Loading your Contract Customers');
                            hide_loading();        
                                
                            
                        }else{
                            alert('No crops...');
                        }
						
					}
			}
		},error: function(XMLHttpRequest, textStatus, errorThrown) {
            ajaxerror('Error Getting Crops');
        }
		});
        
        
        
	
	}else{
        $delallu_ = delete_all_from_store_('podat_user');

        $.mobile.changePage( "#page_index");
        $('#status_bot').html('No connection to merchant [2]');
        $('#auth_form').show();
    }
}





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///GET DRESSINGS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var crid = '';
function get_live_dressings(){
	///delete all!
	delcurrddats_ = delete_from_store_where('podat_dressings', 'synckey', userkey);///is this the right time to do this?
	//var crid = '';
		$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "x": "_8s&$*%$kmg32165%"}, url: mobSysURL+"dig_mobxxx/db_waiting_dressings.php", success: function(data){
			//consol e.log('db_waiting_dressings', data);
			if(data=='404'){				
			
				//db.transaction(function(tx){tx.executeSql("DELETE FROM podat_user WHERE userkey='"+userkey+"'",[], successCallBack, errorHandler);},errorHandler,successCallBack);
				//aler t('Sorry, no connection to tha t merchant [3]');///this means we connected, but the user is not authenticated any more...I think!!!
				$.mobile.changePage( "#page_index");
				$('#status_bot').html('No connection to merchant [3]');
				$('#auth_form').show();	

			}else{
				
				
				
				
				
				rz = data.rez;
				//consol e. log(JSON.stringify(rz));
				if(rz.length>0 && rz[0]!='0'){
					for(var z=0; z<rz.length; z++){	
						thiscrid = rz[z];
						if(thiscrid['CropNo']!=undefined || thiscrid['extra_rs']!=''){
							CropNo = clean_quotes(thiscrid['CropNo']);
                            CGrower = clean_quotes(thiscrid['Grower']);
							var_type_grade_country = clean_quotes(thiscrid['var_type_grade_country']);
							size_name = clean_quotes(thiscrid['size_name']);
                            
                    
tons_and_tubs = [{tons: thiscrid['dr_tonnage_1'], tubs: thiscrid['dr_tubc_1']}, {tons: thiscrid['dr_tonnage_2'], tubs: thiscrid['dr_tubc_2']}, {tons: thiscrid['dr_tonnage_3'], tubs: thiscrid['dr_tubc_3']}, {tons: thiscrid['dr_tonnage_4'], tubs: thiscrid['dr_tubc_4']}];
                         
//["merc_id", "id", "dress_myuid", "gid", "CropNo", "CropGrower", "var_type_grade_country", "drs_by _date", "amt", "chem_at", "store_at", "inspection_date", "size_name", "to n1", "to n2", "ton3", "diff_chemical",
//"boxes_used", "boxes_waste", "boxes_remain", "farmer_ready", "got_labels", "notes_after_dress", "pickup_date", "di_status", "synckey", "extra_rs"];//extra_rs is extra data from trade type of dressing
var obj = {merc_id: merch_id, id: thiscrid['id'], dress_myuid:'NEW', gid: thiscrid['gid'], CropNo: CropNo, OID: thiscrid['order_id'], CropGrower: CGrower, var_type_grade_country: var_type_grade_country, drs_by_date: thiscrid['drs_by_date'], amt: thiscrid['amt'], chem_at: 0, store_at: 0, inspection_date: thiscrid['dr_inspect_date'], size_name: size_name, tons_and_tubs: tons_and_tubs, diff_chemical: thiscrid['dr_chem_used'], boxes_used: thiscrid['boxes_used'], boxes_waste: thiscrid['boxes_waste'], boxes_remain: 0, farmer_ready: thiscrid['farmer_ready'], got_labels: thiscrid['got_labels'], pickup_date: thiscrid['haul_deliver_by_date'], di_status: thiscrid['di_status'], Despatch_Ref: thiscrid['dr_dispatch_number'], Vehicle_Reg: thiscrid['dr_dispatch_vehicle'], part_grade_tns:0, notes_after_dress: thiscrid['dr_notes_after_dress'], synckey: userkey, extra_rs: thiscrid['extra_rs']};
docall = go_insert_('podat_dressings', obj);
						}						

						if(z==(rz.length-1) || rz.length==1){			
							reset_active_crops_then_load();
						}						

					}	
				}else{
					reset_active_crops_then_load();
				}
			}
				
		},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Gradings Error');}
		});

}

$('#concust_list_box').hide();
$('#dress_list_box').hide();
$('#passport_list_box').hide();
$('#crop_list_boxg').hide();
$('#crop_list_boxv').hide();

function get_live_con_customers(){
    //consol e.log('get_live_con_customers...');
    $('#concust_list_table').html('');
    $('#concust_list_box').hide(); 
    if(remote_type==0 && username.length<=3 && username.length>1){
        //consol e.log('reset_active_crops_then_load', userkey);
		$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "x": "_8ss65mu165%&$g32vi*%$k"}, url: mobSysURL+"dig_mobxxx/db_contract_custs.php", success: function(data){
			if(data=='404'){				
				//aler t('Sorry, no connection to tha t merchant [4]');///this means we connected, but the user is not authenticated any more...I think!!!
				$.mobile.changePage( "#page_index");
				$('#status_bot').html('No connection to merchant [4]');
				$('#auth_form').show();	

			}else{
                //cid'=>###,'cname'=>'bob smith'
				rz_all = data.rez;
				rz = rz_all['cux'];
				if(rz.length>0 && rz[0]!='0'){
                    
					for(var z=0; z<rz.length; z++){
						thiscrid = rz[z];
                       
                        //consol e.log(JSON.stringify(thiscrid));
                        
                        /*
                        (
                            [cid] => 308
                            [cname] => A G Wright & Son
                            [statelist] => 2|0|0|2|0
                            [plan_tns] => 5097
                            [con_tns] => 5097
                            [con_tns_c] => 0
                            [con_tns_s] => 5097
                        )
                        <td class="ac nofold mx-auto" title="[1|0|0|0|0]">
                        
                        </td>
                        */
                        
                        if(thiscrid.statelist!='' && thiscrid.statelist!=null){
                            stlist = thiscrid.statelist.split("|");
                        }else{
                            stlist = [0,0,0,0,0];
                        } 
                        
                        thistr ='<div class="itm ccon rounded p-5" onclick="clicked_ccon(\''+clean_quotes(thiscrid.cid)+'\')"><h4 style="color:#D4DDEC; display:inline-block;"><strong style="color:#EBE6F0">'+thiscrid.cname+'</strong></h4>';
                        thistr +='<div style="float:right; display:inline-block; margin:2px 2px 2px 0px;"><span class="fbox bgc_1" title="Planned">'+stlist[1]+'</span><span class="fbox bgc_2" title="Confirmed">'+stlist[2]+'</span><span class="fbox bgc_3" title="Signed">'+stlist[3]+'</span></div>';
                        //<span class="fbox bgc_0" title="To Plan">'+stlist[0]+'</span><span class="fbox bgc_4" title="Amended">'+stlist[4]+'</span>
                        thistr +='</div>';
                        $('#concust_list_table').append(thistr).enhanceWithin();
						if(z==(rz.length-1) || rz.length==1){			
						  ///end
                            $('#concust_list_box').show();
                            $("#openclosewc").show();
						}						

					}

                    
        
                    
				}else{
				    $('#concust_list_box').hide();	
				}
                
                
                
                ///////////fill vars!
                $('#wc_var_id').empty();
                $('#wc_var_id').append($('<option>', {value: 0,text : "Select..." }));
                varlst = rz_all['vars'];
                for(var c=0; c<varlst.length; c++){                         
                    thiscu = varlst[c];
                    $('#wc_var_id').append($('<option>', {value: thiscu['id'],text : thiscu['variety_name']}));   
                }
                $('#wc_var_id').val(0).change();
                
                $('#oc_var_id').empty();
                $('#oc_var_id').append($('<option>', {value: 0,text : "Select..." }));
                varlst = rz_all['vars'];
                for(var c=0; c<varlst.length; c++){                         
                    thiscu = varlst[c];
                    $('#oc_var_id').append($('<option>', {value: thiscu['id'],text : thiscu['variety_name']}));   
                }
                $('#oc_var_id').val(0).change();
                ////////////////////////////////////////////////////
                
                ////seed size
                $('#wc_seed_size').empty();
                $('#wc_seed_size').append($('<option>', {value: 0,text : "Select..." }));
                sdlst = rz_all['sdsiz'];
                for(var c=0; c<sdlst.length; c++){                         
                    thiscu = sdlst[c];
                    $('#wc_seed_size').append($('<option>', {value: thiscu['id'],text : thiscu['size_name']}));   
                }
                ////packaging
                $('#wc_pack_id').empty();
                $('#wc_pack_id').append($('<option>', {value: 0,text : "Select..." }));
                pkgin = rz_all['pkgin'];
                for(var c=0; c<pkgin.length; c++){                         
                    thiscu = pkgin[c];
                    $('#wc_pack_id').append($('<option>', {value: thiscu['id'],text : thiscu['p_desc']}));   
                }
                
                
                
                $("#concust_list_table").slideToggle();
                
			}
				
		},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Contract Custs Error');}
		});
    }
}

$(document).on('change','#wc_deliver_date',function(e){ 
var day = new Date($(this).val()).getUTCDay();
    //consol e.log(day);
  if([6,0].includes(day)){
    e.preventDefault();
    $(this).val('');
    alert('No Weekend delivery');
  }

});

$(document).on('change','#wc_con_id',function(e){ 
  vwc_con_id = $(this).val();    
  if(vwc_con_id==0){
     $('#cvarhide').show(); 
  }else{
      $('#cvarhide').hide();
  }
});

var ostatearr = Array('??', 'Unconfirmed', 'Accepted', 'Processing', 'Allocated', 'Part Uplifted', 'Uplifted', 'Invoiced');
var cc_code = '';
var todayDate = new Date().toISOString().slice(0, 10);


function clear_seed_order(){
    $('#wc_con_id').val(-1).change();
    $('#wc_var_id').val(0).change();;
    $('#wc_o_type').val(0).change(); 
    $('#wc_seed_size').val(0).change();
    $('#wc_pack_id').val(0).change();
    $('#wc_area').val('').change();
    $('#wc_tonnes').val('').change();
    $('#wc_seed_rate').val('').change();
    $('#wc_shipping').val(0).change();
    $('#wc_deliver_address').val(0).change();
    $('#wc_deliver_date').val('').change();
    $('wc_notes#').val('').change();
}

function save_seed_order(){
    //ale rt($("#wc_deliver_date").val().length);
    event.preventDefault();
    
    if(navigator.onLine){
        if($("#wc_con_id").val()<0 || $("#wc_var_id").val()<0 || $("#wc_seed_size").val()<1 || $("#wc_pack_id").val()<0 || ($("#wc_area").val()<=0 && $("#wc_tonnes").val()<=0) || $("#wc_shipping").val()<=0 || $("#wc_deliver_address").val()==0 || $("#wc_deliver_date").val()=='' || $("#wc_deliver_date").val().length<10){
            alert('Check your entries, something is missing or wrong.');
              
        }else{
            
            
            var cswfrm = $('#cconform').serialize();
			$('#no_live_data').hide();
            //consol e.log('save_seed_order cswfrm', cc_code, cswfrm);
            
			$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":cc_code, "x": "32h1%&1_$*$£6688s", "cswfrm":cswfrm}, url: mobSysURL+"dig_mobxxx/db_get_this_cust.php", success: function(data){
                //consol e.log('save_ passport save:',data);
				if(data=='404'){
					alert('Sorry, no match found, please try again. [3]');
				}else{
                   // consol e.log(data);
					var rz = data.rez[0];
                    
                    if(rz=='success'){
                        //
                        alert('Order has been submitted successfully..');
                        //clicked_ccon(cc_code)
                        clear_seed_order();
                        $.mobile.changePage( "#page_crops", { transition: "flip"});
                    }else{
                        alert('Mmmm there was an error, please check your values.');
                    }
                  
										
                        
				}

			},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Mmmmm something is wrong with the order!!! ');}
			});
            /**/
		}
		///////////////////////////////////////// 

    }else{
        alert('You are offline!');
    }
    
}

var wp_states = ['To Plan','Planned','Confirmed','Signed','Amended'];
function clicked_ccon(c_code){
   
   if(remote_type==0 && username.length<=3 && username.length>1){
       cc_code = c_code; 
		if(navigator.onLine){
            //consol e.log(userkey,cc_code);
			$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":cc_code, "x": "32h1%&1_$*$£6688s"}, url: mobSysURL+"dig_mobxxx/db_get_this_cust.php", success: function(data){
                
				if(data=='404'){
					alert('Sorry, no match found, please try again. [4]');
				}else{
					var rz = data.rez;
                    //consol e.log('clicked_ccon', rz, cc_code);
                    cust = rz['cust'];
                    cons = rz['cons'];
                    ords = rz['ords'];
                                    
                    $("#cc_name").html(cust[0]['business_name']);
                    $("#cc_contact").html(cust[0]['contact_name']);

                    
                    ///addresses
                    $('#wc_deliver_address').empty();
                    $('#wc_deliver_address').append($('<option>', {value: 0,text : "Select..." }));
                    for(var c=0; c<cust.length; c++){                         
                        thiscu = cust[c];
                        adddx = thiscu['a2']+'. '+thiscu['a2']+'. '+thiscu['town']+'. '+thiscu['region']+'. '+thiscu['postcode'];
                        $('#wc_deliver_address').append($('<option>', {value: thiscu['id'],text : adddx}));   
                    }
                    

                    
                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    $('#wc_var_id').val(-1);///disable
                    $('#cvarhide').hide();
                    $('#wc_con_id').empty();
                    $('#wc_con_id').append($('<option>', {value: -1,text : "Select..." }));
                    
                    $("#my_contracts").html('');
                    ordhtml = '';
                    
                    for(var o=0; o<cons.length; o++){
                        thisor = cons[o];
                        
                        //consol e.log(thisor);
                        
                        $('#wc_con_id').append($('<option>', {value: thisor['cn_id'],text : thisor['ContractNo']+' ['+thisor['Variety']+']'})); 
                        
                        
                        ordhtml += '<table style="width:100%; font-size: 1em" class="mt-1 mb-3" border="2" bordercolor="#3F475C" cellspacing="5" cellpadding="5">';                        
                        if(thisor['ContractNo']==''){thisor['ContractNo']='Free-Buy';}
                        ordhtml += '<tr><td class="td_dark" title="'+thisor['cn_id']+'" colspan="2"><h3><strong style="color:#ff7755">'+thisor['Variety']+'</strong> - '+thisor['ContractNo']+'</h3></td></tr>';	

                        ordhtml += '<tr><td class="bold td_blue">Status</td><td class="bold bgc_'+thisor['status_id']+'" style="padding: 5px 8px; width:65%">'+wp_states[thisor['status_id']]+'</td></tr>';
                        
                        //ordhtml += '<tr><td class="bold td_blue" title="'+thisor['variety_id']+'">Variety</td><td class="bold td_lblue"></td></tr>';	
       
                        ordhtml += '<tr><td class="bold td_blue">Contract/T</td><td class="bold td_lblue">'+thisor['TotalTonsReq']+'</td></tr> ';	

                        //ordhtml += '<tr><td class="bold td_blue">Planned/T</td><td class="bold td_lblue">'+thisor['PlannedTonnes']+'</td></tr>';	

                        //ordhtml += '<tr><td class="bold td_blue">Seed Required (Est)</td><td class="bold td_lblue"><strong style="color:#c4d1df">'+thisor['t_req']+'t</strong></td></tr>';
                        
                        ordhtml += '<tr><td class="bold td_blue">Seed Ordered</td><td class="bold td_lblue"><strong style="color:#c4d1df">'+thisor['t_orda']+'h ['+thisor['t_ord']+'t]</strong></td></tr>';

                        ordhtml += '<tr><td class="bold td_blue">Y/TPh</td><td class="bold td_lblue" title="wc_seed_size">'+(thisor['YieldTHa']=='0.00'?thisor['varTPH']:thisor['YieldTHa'])+'</td></tr> ';	
                        
                        //////////////////////////////////////////////////////////
                        /**/
                        ordhtml += '<tr><td class="bold td_dark" colspan="2">Delivery Plan [Allocated]</td></tr>';
                        alloh = '';//ords
                        
                     
                        //consol e.log('ords::: ',ords);                        
                        for(var ox=0; ox<ords.length; ox++){
                            thisoxr = ords[ox];
                            if(thisoxr[0]==thisor['cn_id']){                            
                                alloh += '<span class="rounded" style="background: #915f35; padding:5px 10px;white-space: nowrap; margin: 3px 0px; display: inline-block;">[WK:'+thisoxr[2]+'] '+thisoxr[3]+'h '+thisoxr[4]+'t</span> ';
                            }
                        }
                        ordhtml += '<tr><td class="td_lblue" colspan="2">'+alloh+'</td></tr>';
                        
                        /////////////////////////////////////////////////////////////
                        

                        ordhtml += '<tr><td class="bold td_dark" colspan="2">Planned Delivery to Factory - Estimated</td></tr>';	
                        planh = '';
                        pln = thisor['weekplan'];
                        for(var p=0; p<pln.length; p++){
                            thispp = pln[p];
                            planh += '<span class="rounded" style="background: #2f893b; padding:5px 10px;white-space: nowrap; margin: 3px 0px; display: inline-block;">'+thispp['planned']+' tonnes [WK:'+thispp['wkno']+']</span> ';    
                        }
                        ordhtml += '<tr><td class="td_lblue" colspan="2">'+planh+'</td></tr>';	
                        ordhtml += '</table>';    
                    }
                    $("#my_contracts").html(ordhtml);
                    $('#wc_con_id').append($('<option>', {value: 0,text : "Free-Buy" }));
                    
                    
/*
	


                              







{
"cn_id": "462",
"ContractNo": "W420347",
"status_id": "2",
"variety_id": "6",
"Variety": "ROYAL",
"TotalTonsReq": "4897",
"PlannedTonnes": "4897",
"ConSeedRate": "0.00",
"def_seed_rate": "2.50",
"YieldTHa": "59.00",
"varTPH": "59.00",
    "weekplan": [
        {
            "wid": "582",
            "wcyy": "24",
            "wkno": "19",
            "planned": "1761",
            "alloc": "0"
        },
        {
            "wid": "583",
            "wcyy": "24",
            "wkno": "23",
            "planned": "3136",
            "alloc": "0"
        }
    ],
"t_ord": "208.00",
"t_req": "207.50"
}
*/                   
                    
                    
                    // $("#my_s_orders").html(JSON.stringify(ords));
                    $("#wp_order_div").html('');
                    $("#vend_seed_orders").hide();
                    /*
                    ordhtml = '';
                    for(var o=0; o<ords.length; o++){
                        thisor = ords[o];
                        Stx = ostatearr[thisor['wc_status']];
                        ordhtml += '<table style="width:100%; font-size: 1em" class="mt-1 mb-3" border="2" bordercolor="#51453F" cellspacing="5" cellpadding="5">';                        
                        if(thisor['ContractNo']==''){thisor['ContractNo']='Free-Buy';}
                        ordhtml += '<tr><td class="td_dark" title="'+thisor['id']+'"><strong>'+thisor['ContractNo']+'</strong></td><td class="td_dark" title="'+thisor['wc_date']+'"><div style="float:right" title="'+thisor['status_id']+'"><strong style="background:#954242; color:#fff; padding:2px 5px; border-radius:5px;">'+Stx+'</strong></div></td></tr>';	

                        ordhtml += '<tr><td class="bold td_green">Variety</td><td class="bold td_brown">'+thisor['variety_name']+'</td></tr>';	
                        xd = thisor['wc_deliver_date'];
                        if(xd.length==10){
                            fd = new Date(xd);
                            xd = fd.toLocaleString('en-En',{weekday: "short", month: "short", day: "numeric"});
                            //$("#cd_burnd").html(xd);
                        }
                        ordhtml += '<tr><td class="bold td_green">Required</td><td class="bold td_brown">'+xd+' [WK:'+thisor['wc_wn']+']</td></tr>';	
                        ordhtml += '<tr><td class="bold td_green">Size</td><td class="bold td_brown" title="'+thisor['wc_seed_size']+'">'+thisor['size_name']+'</td></tr>';	
                        
                        ordhtml += '<tr><td class="bold td_green">Tonnes</td><td class="bold td_brown">'+thisor['wc_tonnes']+' <span style="color:#b19d94">['+(thisor['wc_o_type']==1?'Area Order':'Tonnes Order')+']</span></td></tr>';

                        if(thisor['wc_area']>0){ordhtml += '<tr><td class="bold td_green">Area</td><td class="bold td_brown">'+thisor['wc_area']+' <span style="color:#b19d94">['+(thisor['wc_o_type']==1?'Area Order':'Tonnes Order')+']</span></td></tr>';}	

                        ordhtml += '<tr><td class="bold td_green">Packaging</td><td class="bold td_brown">'+thisor['p_desc']+'</td></tr>';	

                        ordhtml += '<tr><td class="bold td_green">Ship Type</td><td class="bold td_brown">'+(thisor['wc_shipping']==1?'Delivered':'Ex Farm')+'</td></tr>';	

                        ordhtml += '<tr><td class="bold td_green">Ship To</td><td class="bold td_brown">'+thisor['a2']+', '+thisor['town']+'. '+thisor['region']+'. '+thisor['postcode']+'</td></tr>';	
                        ordhtml += '</table>';    
                    }
                    
                    if(ords.length>=1){
                        $("#vend_seed_orders").show();
                        $("#wp_order_div").html(ordhtml);   
                    }*/
                    
                    
/*wp_order_div
 


{
"ContractNo": "W420347",
"id": "1",
"wc_date": "2023-10-01 08:42:27",
"wc_o_type": "1",
"wc_seed_size": "92",
"wc_tonnes": "208.00",
"wc_seed_rate": "2.5",
"wc_area": "83.00",
"wc_shipping": "1",
"wc_wn": "14",
"user name": "MarkM",
"p_desc": "Bag 1.25T E-Lift (Branded)",
"a1": "Hermitage Farm",
"town": "Ely",
"region": "Cambridgeshire",
"variety_name": "Royal",
"size_name": "35x45x55mm"
}*/
                    
                    
                    
										
                    $.mobile.changePage( "#page_custcons", { transition: "flip"});
                    gotop('page_custcons');
				}

			},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Mmmmm customer did not load fully....');}
			});
		}else{
			alert('You need to be online for that...');
		}
		/////////////////////////////////////////   
   }
}




function save_consug_order(){
    //oc_var_id, oc_o_type, oc_area_tns, oc_notes, oc_deliver_date 
    event.preventDefault();

    
    
    if(navigator.onLine){
        if($("#oc_var_id").val()<0 || isNaN($("#oc_o_type").val()) || isNaN($("#oc_area_tns").val()) || $("#oc_area_tns").val()<0 || $("#oc_deliver_date").val()=='' || $("#oc_deliver_date").val().length<10){
            alert('Check your entries, something is missing or wrong.');              
        }else{
            
            
            var sugconfrm = $('#sconform').serialize();
            //consol e.log('sugconfrm',sugconfrm);
			$('#no_live_data').hide();

			$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":cc_code, "x": "32h1%&1_$*$£6688s", "sugconfrm":sugconfrm}, url: mobSysURL+"dig_mobxxx/db_get_this_cust.php", success: function(data){
                //consol e.log('sconform save:',data);
				if(data=='404'){
					alert('Sorry, no match found, please try again. [CR]');
				}else{
                   // consol e.log(data);
					var rz = data.rez[0];
                    
                    if(rz=='success'){
                        //
                        alert('Contract request has submitted successfully..');
                        $("#oc_deliver_date").val('');
                        $("#oc_notes").val();
                        $("#oc_area_tns").val();
                        $("#oc_o_type").val();
                        $("#c_var_id").val();
                        //clicked_ccon(cc_code)
                        $.mobile.changePage( "#page_crops", { transition: "flip"});
                    }else{
                        alert('Mmmm there was an error, please check your values.');
                    }
                  
										
                        
				}

			},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Mmmmm something is wrong with the contract call!!! ');}
			});
            
		}
		///////////////////////////////////////// 

    }else{
        alert('You are offline!');
    }
    
}






function get_live_passports(){
    //consol e.log('get_live_passports...');
    $('#passport_list_table').html('');
    $('#passport_list_box').hide(); 
    if(remote_type>0){
		$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "x": "_8s&$*%$kmg32165%"}, url: mobSysURL+"dig_mobxxx/db_waiting_passports.php", success: function(data){
			if(data=='404'){				
				//aler t('Sorry, no connection to tha t merchant [5]');///this means we connected, but the user is not authenticated any more...I think!!!
				$.mobile.changePage( "#page_index");
				$('#status_bot').html('No connection to merchant [5]');
				$('#auth_form').show();	

			}else{

				rz = data.rez;
				
				if(rz.length>0 && rz[0]!='0'){
                    collectiondayname = '';
					for(var z=0; z<rz.length; z++){	
						thiscrid = rz[z];
                        harvest_date = thiscrid.harvest_date;
                        hdate = '';
                        harvested = '';
                        //cp_type, Organic //gcn_customer_ref
                        if(thiscrid.Organic==1){
                            hdate = ' pportorg';
                            harvested += ' <span style="color:#cfa997">[Organic]</span>';
                            isorg =' <strong class="white rounded" style="font-size:0.9em; background: #156C21; padding:1px 2px; display: inline-block;">ORG</strong>';   
                        }else{
                            isorg ='';   
                        }
                        
  
                        
                        if(harvest_date!='null' && harvest_date!=null){hdate = ' pportharv';harvested += ' <span style="color:#cfa997">[Harvested]</span>';}
                        deltime = thiscrid.collection_time;
                        if(deltime!=''){thiscrid.collection_date += ' '+deltime;}
                        //consol e.log(JSON.stringify(thiscrid));
                        //{"pxid":"1","access_code":"gPpKhDceHZPoyQ2Mp0Fwq1xh9UpAopT20sHmc0mi2dBzu29Aa2W8ikws58fj3dpc4DlQwa7eG2rngEieMnjpJXmy4IuWPP93nmnFU","collection_date":null,"prodname":"25.000t of Hermes [Auto] UG [W]"}
                        thistr = '';
                        if(collectiondayname!=thiscrid.collection_day_name){
                            thistr +='<div class="p-5"><h2 style="color:#4E4428">&nbsp;'+thiscrid.collection_day_name+'</h2></div>';
                            collectiondayname = thiscrid.collection_day_name;   
                        }
                        
                        
                        thistr +='<div class="itm pport'+hdate+' rounded p-5" onclick="clicked_pass(\''+clean_quotes(thiscrid.access_code)+'\')"><h3 style="color:#D4DDEC;"><span class="white">'+thiscrid.trade+'</span> <strong class="white">'+clean_quotes(thiscrid.collection_date)+'</strong>'+harvested+'</h3>';
                        thistr +='<h4 style="color:#FFF; font-size:1.1em; padding-top:0px;">For: '+clean_quotes(thiscrid.pcustname)+'</h4>';
                        //if(thiscrid.custref.length>0){thistr +=' | <span class="white">Ref: '+clean_quotes(thiscrid.custref);}
                        thistr +='<h4 style="color:#D1E0E9; font-size:1.1em;"><span>'+clean_quotes(thiscrid.prodname)+isorg+'</h4>';
                        if(thiscrid.custref!=''){thistr +='<h4>Ref: <strong class="white rounded" style="font-size:1em; background: rgba(73,73,73,0.2); padding:2px 6px; display: inline-block;">'+clean_quotes(thiscrid.custref)+'</strong></h4>';}
                        if(thiscrid.note_seller!=undefined && thiscrid.note_seller!=''){thistr +='<div style="padding-top:2px; margin-top:2px; border-top:1px dashed #eee;"><h4 style="padding-top:3px"><em>'+clean_quotes(thiscrid.note_seller)+'</em></h4></div>';}
                        thistr +='</div>';
                        
                        $('#passport_list_table').append(thistr).enhanceWithin();
                        
						if(z==(rz.length-1) || rz.length==1){			
						  ///end
                            $('#passport_list_box').show();
                            $("#openclosepp").show();
						}						

					}

                    
        
                    
				}else{
				    $('#passport_list_box').hide();	
				}
			}
				
		},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Passport Error');}
		});
    }
}

var view_trade_pid = 0;var view_trade_id = 0;
var pp_code = '';
var grower_box_marks_avail_str = '';


var bmo = '';
var clic_itm = '';
var curr_bmo = '';
$('body').on('click', '.bmoclick', function() {
//$('.bmoclick').click(function(e){
    //echo '<a class="bmoclick btn btn-'.($boxthere?'dark':'info').' btn-sm mr-2" data-bmo="'.$bmo.'" id="bmo _'.$bmo.'">'.$bmo.'</a>';gcn_marks_out

    bmo = $(this).data('bmo').trim();
    clic_itm = $(this);
    curr_bmo = $('#gcn_marks_out').val().trim();
    
    //is it in the list?
    curr_bmoArray = curr_bmo.split(",");
    curr_bmoArray = curr_bmoArray.map(s => s.trim()); 
    var curr_bmoArray = curr_bmoArray.filter(function (el) {
      return el != null;
    });
    //consol e.log('bmo START', curr_bmoArray, bmo, curr_bmoArray.length);
    
     
    //n = text.search([0-9]/w3schools/i);|
    if(curr_bmoArray.length==0 || (curr_bmoArray.length==1 && curr_bmoArray[0]=='')){
        curr_bmoArray[0]=bmo;
        bxnclean = bmo.replace(' ', '_');
        $('#bmo_'+bxnclean).removeClass('btn-info'); 
        $('#bmo_'+bxnclean).addClass('btn-dark'); 
    }else{
        weaddthis = 0;
        for(i=0;i<curr_bmoArray.length;i++){

            bxn = curr_bmoArray[i];
            bxn = bxn.trim();
            curr_bmoArray[i] = bxn;
            //

            bxn = bxn.replace(/^[0-9]+\s/g, '');
            //consol e.log('Arr loop :',i, bxn);
    

            if(bxn==bmo){
                weaddthis = 0;
                ///remove it 
                curr_bmoArray.splice(i, 1);
                //consol e.log('Arr remove:',bmo);
                bxnclean = bxn.replace(' ', '_');
                $('#bmo_'+bxnclean).removeClass('btn-dark'); 
                $('#bmo_'+bxnclean).addClass('btn-info'); 
                break;
            }else{
                //add it
                weaddthis = bmo;
            }
        }
        
        if(weaddthis!=0){
            bxnclean = weaddthis.replace(' ', '_');
            $('#bmo_'+bxnclean).removeClass('btn-info'); 
            $('#bmo_'+bxnclean).addClass('btn-dark'); 
            curr_bmoArray.push(weaddthis);
        }    
    }
    
    
    
    //consol e.log('bmo end', curr_bmoArray);
    curr_bmoArray = curr_bmoArray.toString();
    
    $('#gcn_marks_out').val(curr_bmoArray); 
    
    
}); 
    
    
    
    
   


var current_pp_state = 0;
var next_pp_state = 0;

function clicked_pass(p_code){
   pp_code = p_code;
   view_trade_pid = 0;
   view_trade_id = 0; 
   ///try and get this
		if(navigator.onLine){
			$('#no_live_data').hide();
            //consol e.log('db_get_this_ passport pp_code:',pp_code);
			$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":pp_code, "x": "_1%&6881$*$£632hs", "clickpp":1}, url: mobSysURL+"dig_mobxxx/db_get_this_passport.php", success: function(data){
                
				if(data=='404'){
					alert('Sorry, no match found, please try again. [5]');
				}else{
					var rz = data.rez[0];
                    
                    //consol e.log('clicked_pass',rz);
                    if(rz.cp_name==null){
                        rz.cp_name  = rz.CropNo;  
                    }
                    
                    gcn_prodname = rz.tp_amt+'t '+rz.cp_name;
                    if(rz.size_name){
                        gcn_prodname += ' ['+rz.size_name+']';
                    }
                    
                    trade_tt='T'+rz.tp_trade_id;
                    //trade_tt='T'+rz.tp_trade_id+'-'+rz.trade_id;
                    view_trade_pid = rz.trade_id;
                    view_trade_id = rz.tp_trade_id;
                    $("#cp_name").html(gcn_prodname);
                    
          
                    
                    if(rz.gcn_status<3){
                        $(".hidepp_fin").show(); 
                        $(".ppisdone").hide();
                    }else{
                        $(".hidepp_fin").hide();
                        $(".ppisdone").show();
                    } 
                    
                    //tp_cust_name//a.gcn_customer_ref, p.tp_cust_ref,
                    
                    ////set the TRADE status
                    //pp_state_change//pp_state_now//trade_states///////////////////////
                    //consol e.log('clicked_pass data:',rz);
                    current_pp_state = Number(rz.tp_status);
                    next_pp_state = current_pp_state+1;
                    $("#pp_state_change_div").hide();
                    $("#bump_pp_state_but").hide(); 
                    $("#pp_state_id").val(current_pp_state);
                    $("#pp_state_now").text(trade_states[current_pp_state]);
                    if(current_pp_state<3){
                        $("#bump_pp_state_but").show();
                        $("#pp_state_change_div").show();
                        $("#pp_state_next").text(trade_states[next_pp_state]);
                    }

                    ///////////////////////////////////////////////////////////////////
                    
                    
                    $("#cp_trade").html('Trade: <span class="red">['+trade_tt+']</span> Passport #: <span class="green">['+rz.gcn_gcn_number+']</span>');
                    //<br>Customer Ref: <span class="green">'+rz.gcn_customer_ref+'</span>
                    gcn_type = 0;//WARE
                    if(rz.tp_w_or_s==1){
                        gcn_type = 1;//SEED          
                    }
                    
                    //consol e.log('db_get_this_ passport:',data);
                    //ale rt(rz.tp_w_or_s+' gcn_type:'+gcn_type);
                    if(gcn_type == 0){
                        $(".gcn_type_1").hide();
                        $(".gcn_type_0").show();
                    }else{
                        $(".gcn_type_0").hide();
                        $(".gcn_type_1").show();
                    }

                    //"id": "4", .change();
                    //"trade_id": "8",
                    $("#gcn_status").val(rz.gcn_status);      
                    $("#gcn_last_update").text(rz.gcn_last_update); 
                    $("#gcn_harvest_date").val(rz.gcn_harvest_date); 
                    $("#gcn_collection_date").val(rz.gcn_collection_date); 
                    $("#gcn_delivery_date").val(rz.gcn_delivery_date);
                    $("#gcn_customer_site").val(rz.gcn_customer_site);
                    $("#gcn_customer_ref").val(rz.gcn_customer_ref); 
                    $("#gcn_load_number").val(rz.gcn_load_number); 
                    $("#gcn_merc_prod_number").val(rz.gcn_merc_prod_number); 
                    $("#gcn_grower_name").val(rz.gcn_grower_name); 
                    $("#gcn_grower_name_real").val(rz.gcn_grower_name_real); 
                    $("#gcn_grower_address").val(rz.gcn_grower_address); 
                    $("#gcn_crop_grown").val(rz.gcn_crop_grown); 
                    $("#gcn_crop_origin").val(rz.gcn_crop_origin); 
                    $("#gcn_field_ref").val(rz.gcn_field_ref);
                    $("#gcn_store_ref").val(rz.gcn_store_ref);
                    if(rz.gcn_soil_type==null || rz.gcn_soil_type==''){rz.gcn_soil_type = 'SAND';}
                    $("#gcn_soil_type").val(rz.gcn_soil_type).change(); 
                    $("#gcn_loaded_by").val(rz.gcn_loaded_by); 
                    $("#gcn_haulier").val(rz.gcn_haulier); 
                    $("#gcn_haul_contact").val(rz.gcn_haul_contact); 
                    $("#gcn_haul_reg").val(rz.gcn_haul_reg); 

                    $("#gcn_container_no").val(rz.gcn_container_no); 
                    $("#gcn_driver_name").val(rz.gcn_driver_name); 
                    $("#gcn_cust_site_deliver_to").val(rz.gcn_cust_site_deliver_to);
                    //consol e.log('gcn_bags_boxes_bulk', rz.gcn_bags_boxes_bulk, rz);
                    
                    if(rz.gcn_bags_boxes_bulk==null || rz.gcn_bags_boxes_bulk==''){rz.gcn_bags_boxes_bulk = 'BOXES';}
                    $("#gcn_bags_boxes_bulk").val(rz.gcn_bags_boxes_bulk).change(); 
                    $("#gcn_bags_boxes_bulk_num").val(rz.gcn_bags_boxes_bulk_num); 
                    $("#gcn_box_weight").val(rz.gcn_box_weight); 
                    $("#gcn_weighbridge_weight").val(rz.gcn_weighbridge_weight); 
                    $("#gcn_box_out").val(rz.gcn_box_out); 
                    $("#gcn_box_in").val(rz.gcn_box_in);
                    
                    
                    
                    $("#gcn_marks_out").val(rz.gcn_marks_out);
                    grower_box_marks_avail_str = rz.grower_box_marks;
                    if(grower_box_marks_avail_str=='null' ||grower_box_marks_avail_str==null){grower_box_marks_avail_str='';}
                    //$("#grower_box_avail_marks").val(grower_box_marks_avail_str);
                    
                    /*consol e.log(rz);
                    foreach($grower_box_marks_a as $bmo){
                        $bmo = trim($bmo);
                       <a class="bmoclick btn btn-info btn-sm mr-2" data-bmo="'.$bmo.'" id="bmo_'.str_replace(' ','_',$bmo).'">'.$bmo.'</a>

                    }
                    */
                    
                    bmd_html = '';
                    $("#grower_box_marks_div").html('');
                    $("#grower_box_marks_div").hide();
                    
                    if(grower_box_marks_avail_str.length){                        
                        var grower_box_marks_arr = grower_box_marks_avail_str.split(",");
                        grower_box_marks_arr = grower_box_marks_arr.map(s => s.trim());
                        
                        //consol e.log('grower_box marks',grower_box_marks_avail_str, grower_box_marks_arr);
                        
          
                        //add the click box links
                        for(i=0;i<grower_box_marks_arr.length;i++){
                            bxn = grower_box_marks_arr[i].trim();
                            bxn = bxn.replace(/^[0-9]+\s/g, '');
                            grower_box_marks_arr[i] = bxn;
                            //if this bxn is in my list, change the class
                            bxnclean = bxn.replace(' ', '_');                     
                            bmd_html += '<a class="bmoclick ui-btn ui-btn-inline btn-info mr-1" data-role="button" data-bmo="'+bxn+'" id="bmo_'+bxnclean+'">'+bxn+'</a>';
                        }
                        
                        curr_bmo = $('#gcn_marks_out').val();    
                        curr_bmoArray = curr_bmo.split(",");
                        curr_bmoArray = curr_bmoArray.map(s => s.trim());
                        
                        for(i=0;i<curr_bmoArray.length;i++){

                            bxn = curr_bmoArray[i].trim();
                            bxn = bxn.replace(/^[0-9]+\s/g, '');
                            curr_bmoArray[i] = bxn;
                            //consol e.log('grower_box marks',grower_box_marks_avail_str, grower_box_marks_arr);
                            //if this bxn is in my list, change the class
                            bxnclean = bxn.replace(' ', '_');
                            $('#bmo_'+bxnclean).removeClass('btn-info'); 
                            $('#bmo_'+bxnclean).addClass('btn-dark');

                        }
                        
                        ////
                        
                        
                        $("#grower_box_marks_div").html(bmd_html); 
                        $("#grower_box_marks_div").show();
                       
                        
                    }
                    
                    
                    $("#gcn_marks_in").val(rz.gcn_marks_in); 
                    $("#gcn_bag_branding").val(rz.gcn_bag_branding); 
                    $("#gcn_deliver_to").val(rz.gcn_deliver_to); 
                    $("#gcn_graded").val(rz.gcn_graded).change();                      
                    $("#gcn_is_org").val(rz.gcn_is_org).change();  
                    $("#gcn_org_code").val(rz.gcn_org_code); 
                    $("#gcn_accred_1").val(rz.gcn_accred_1); 
                    $("#gcn_accred_2").val(rz.gcn_accred_2); 
                    $("#gcn_accred_3").val(rz.gcn_accred_3); 
                    $("#gcn_assessment_version").val(rz.gcn_assessment_version); 
                    $("#gcn_safe_haven").val(rz.gcn_safe_haven).change(); 
                    $("#gcn_cipc").val(rz.gcn_cipc).change();  
                    $("#gcn_sign_name").val(rz.gcn_sign_name); 

                    $("#gcn_variety").val(rz.gcn_variety); 

                    $("#gcn_comments").val(rz.gcn_comments);
                    
                    
                    if(rz.trade_seed_terms_note){$("#trade_seed_terms_note").text(rz.trade_seed_terms_note);}

                    
                    
                    ////////////////////////////////////////////
                    $(".ldlay").val(0).change();
                    //consol e.log('gcn_load_layout',rz.gcn_load_layout);
                    if(rz.gcn_load_layout && rz.gcn_load_layout.length>5){
                        ldlay = JSON.parse(rz.gcn_load_layout);
                        for(i=1;i<27;i++){
                            if(ldlay[i] && ldlay[i]>0){
                                $("#layout_"+i).val(ldlay[i]).change();
                            }
                        }
                    }
                    ///////////////////////////////////////////
                    
                    $(".size0_1").val(0).change();
                    $(".size0_bx").val(0);
                    //consol e.log('gcn_size_json',rz.gcn_size_json);
                    //'{"1":["25","35","22"],"2":["35","45","33"]}
                    if(rz.gcn_size_json && rz.gcn_size_json.length>5){
                        
                        
                        
                        sjson = JSON.parse(rz.gcn_size_json);
                        //consol e.log('sjson',sjson);
                        if(sjson['1'] && sjson['1'].length && sjson['1'][2]>0){
                            $("#size1_1").val(sjson['1'][0]).change();
                            $("#size1_2").val(sjson['1'][1]).change();
                            $("#size1_bx").val(sjson['1'][2]);
                        }
                        if(sjson['2'] && sjson['2'].length && sjson['2'][2]>0){
                            $("#size2_1").val(sjson['2'][0]).change();
                            $("#size2_2").val(sjson['2'][1]).change();
                            $("#size2_bx").val(sjson['2'][2]);
                        }   
                        if(sjson['3'] && sjson['3'].length && sjson['3'][2]>0){
                            $("#size3_1").val(sjson['3'][0]).change();
                            $("#size3_2").val(sjson['3'][1]).change();
                            $("#size3_bx").val(sjson['3'][2]);
                        }
                        if(sjson['4'] && sjson['4'].length && sjson['4'][2]>0){
                            $("#size4_1").val(sjson['4'][0]).change();
                            $("#size4_2").val(sjson['4'][1]).change();
                            $("#size4_bx").val(sjson['4'][2]);
                        }
                        
                       
                    }
                    
                    
                    ////////////////////////////////////////////

                    //consol e.log('gcn_seed_array',rz.gcn_seed_array);
                    if(rz.gcn_seed_array && rz.gcn_seed_array.length>5){
                        //sdv_0_0 - sdv_0_7 //sdv_1_0 - sdv_1_7
                        sdarr = JSON.parse(rz.gcn_seed_array);
                        for(i=0;i<4;i++){
                            //consol e.log('gcn_seed_array',i,sdarr[i]);
                            sdrow = sdarr[i];
                            for(z=0;z<8;z++){                                
                                if(sdrow[z] && sdrow[z]!=''){
                                    $("#sdv_"+i+"_"+z).val(sdrow[z]).change();
                                }
                            }
                        }
                    }
                    
                    
                    
                    ///////////////////////////////////////////
                    $('.rem_chem_used_table').remove(); //kill
                    if(rz.chem_array){
                        for(z=0;z<rz.chem_array.length;z++){                        
                            $('#chem_used_table').append("<tr class='rem_chem_used_table'><td colspan='3' class='pt-2'><h3>"+rz.chem_array[z]+"</h3></td></tr>").enhanceWithin();
                            if(z==0){$('#chem_used_table').append('<tr class="rem_chem_used_table"><td>Last Applied</td><td>Harvest Interval</td><td>Apply Amt</td></tr>').enhanceWithin();}
                            $('#chem_used_table').append('<tr class="rem_chem_used_table"><td width:40%><input type="date" name="cu_appdate_'+z+'" id="cu_appdate_'+z+'" value="" class="form-control" autocomplete="dasdz423423" /></td><td><input type="number" name="cu_harvint_'+z+'" id="cu_harvint_'+z+'" value="" class="form-control ac" autocomplete="dasdz423423" placeholder="Hvst Interval" /></td><td><input type="number" name="cu_amt_'+z+'" id="cu_amt_'+z+'" value="" class="form-control ac" autocomplete="dasdz423423" placeholder="Apply Amt" /></td></tr>').enhanceWithin(); 
                        }
                    }
                    //{"0":[1,"2023-08-15","15","16"],"2":[1,"2023-08-30","77","88"]}
                    //consol e.log('gcn_chem_json',rz.gcn_chem_json);
                    if(rz.gcn_chem_json && rz.gcn_chem_json.length>3){                        
                        ldlay = JSON.parse(rz.gcn_chem_json);
                        //ldlaysize = Object.keys(ldlay).length;
                        //consol e.log('gcn_chem_json ldlay:', ldlay);
                        for(i=0;i<rz.chem_array.length;i++){                            
                            if(ldlay[i] && ldlay[i].length==4){
                                $("#cu_appdate_"+i).val(ldlay[i][1]).change();
                                $("#cu_harvint_"+i).val(ldlay[i][2]).change();
                                $("#cu_amt_"+i).val(ldlay[i][3]).change();
                            }
                        }
                        
                    }
                    ///////////////////////////////////////////
                    
                    
                   ///////////////////////////////////////////
                    if(rz.test_array){
                    for(z=0;z<rz.test_array.length;z++){                        
                        $('#chem_test_table').append('<tr class="rem_chem_used_table"><td class="pr-5 nofold pb-2"><input type="checkbox" name="ct_apply_'+z+'" id="ct_apply_'+z+'" value="1" class="form-checkbox big_checkbox" data-role="none" /></td><td class="pr-5 pb-2 nofold"><h3>'+rz.test_array[z]+'</h3></td></tr>').enhanceWithin();     
                    }
                    }
                    //{"0":1,"1":1,"4":1}
        
                    if(rz.gcn_chem_test_json && rz.gcn_chem_test_json.length>3){                        
                        ldlay = JSON.parse(rz.gcn_chem_test_json);
                        //ldlaysize = Object.keys(ldlay).length;
                        //consol e.log('gcn_chem_json ldlay:', ldlay);
                        for(i=0;i<rz.test_array.length;i++){                            
                            if(ldlay[i] && ldlay[i]==1){
                                $("#ct_apply_"+i).prop( "checked", true);
                            }
                        }
                        
                    }
                    
                    sigfile.jSignature("clear");
                    if(rz.sigfile_this && rz.sigfile_this.length>10){  
                        sigfile.jSignature("setData", "data:image/jsignature;base30,"+rz.sigfile_this) ;
                    }
                    
                    sigfile_d.jSignature("clear");
                    if(rz.sigfile_driver && rz.sigfile_driver.length>10){  
                        sigfile_d.jSignature("setData", "data:image/jsignature;base30,"+rz.sigfile_driver) ;
                    }
                    /////////////////////////////////////////// 

                    //"gcn_size_json": "[]",
                    //"gcn_chem_json": "[]",
                    //"gcn_chem_test_json": "[]",
                    
                    
                    
                    
                    /*
                    
                    $p['seedt_arr'] = $seedt_arr;
                    $p['seedt_arr_ph'] = $seedt_arr_ph;
                    $p['chem_array'] = $chem_array;
                    $p['test_array'] = $test_array;
                    
                    "tp_amt").val(rz.); 
                    "tp_w_or_s").val(rz.); 
                    "tp_collect_address": "14",
                    "tp_origin": "UK",
                    "tp_cust_ref").val(rz.); 
                    "tp_psize": "-99",
                    "cp_name": "Desiree UG [W] [UK]",
                    "cp_variety_id": "32",
                    "CropNo": null,
                    "Variety": null,
                    "size_name": null,
                    "variety_name": "Desiree",
                    "tp_cust_name": "Mackay Potatoes",
                    "tp_seller_name": "AAA Grower",
                    "tp_haul_name").val(rz.); 
                    "tp_date_collect": "2023-08-29 12:42:00",
                    "tp_date_collect_f": "2023-08-29"
                    */
                    
                    
                    $("#gcn_gogo").prop( "checked", false);
                    
										
                    $.mobile.changePage( "#page_passport", { transition: "flip"});
                    gotop('page_passport');
				}

			},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Mmmmm passport did not load fully....');}
			});
		}else{
			$('#no_live_data').show();
		}
		/////////////////////////////////////////   
     
}




function bump_pp_state(){
	if(navigator.onLine){
        if(confirm('Are you sure you want to advance this trade?')) {
            $("#bump_pp_state_but").hide();
            if(next_pp_state==(current_pp_state+1) && next_pp_state>0 && next_pp_state<4){
                
                //consol e.log('bump_pp_state vv', "cc",pp_code, "view_trade_pid",view_trade_pid, "view_trade_id",view_trade_id, "next_pp_state",next_pp_state, "advancepp",1);
                //bump_pp_state 3038 3041 0 1
                $.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":pp_code, "view_trade_pid":view_trade_pid, "view_trade_id":view_trade_id, "next_pp_state":next_pp_state, "advancepp":"1", "x": "_1%&6881$*$£632hs"}, url: mobSysURL+"dig_mobxxx/db_get_this_passport.php?rnd="+Math.random(), success: function(data){
                    //consol e.log('bump_pp_state:',next_pp_state,data);
                    
                    if(data=='404'){
                        alert('Sorry, no match found, please try again. [6]');
                    }else{
                        var nowtp_status = data.rez[0].tp_status;

                        if(!isNaN(nowtp_status) && nowtp_status==next_pp_state){
                            //alert('cool... now at: '+nowtp_status);
                        }else{
                            alert('Mmmm... Could not advance trade.');
                        }

                        if(!isNaN(nowtp_status)){
                            current_pp_state = Number(nowtp_status);
                             
                            if(current_pp_state>=3){
                                $("#pp_state_change_div").hide();
                                
                                //go back to home
                                if(remote_type>0){get_live_passports();}
                                $.mobile.changePage( "#page_crops", { transition: "flip"});
                                
                            }else{
                                
                                next_pp_state = current_pp_state+1;

                                $("#pp_state_id").val(current_pp_state);
                                $("#pp_state_now").text(trade_states[current_pp_state]);

                                $("#pp_state_change_div").show();
                                $("#pp_state_next").text(trade_states[next_pp_state]);                             
                                
                                $("#bump_pp_state_but").fadeIn();
                            }
                            
                              
                        }

                    }

                },error: function(XMLHttpRequest, textStatus, errorThrown) {console.log('AJX Error', textStatus, errorThrown);ajaxerror('Mmmmm trade status did not save!');}
                });    
                
                
                
            }else{
                alert('Mmmm that trade cant do that!');
            }

        }
    }
}



//function undo sig(){
//    sigf ile.jSignatu re("un do");   
//}


$('body').on('click', '#gcn_gogo', function() {
	$('#gcn_comments').blur();
    $('#gcn_sign_name').blur();
    $('input').blur();
    $('textarea').blur();
});


function load_sig_default(){
    //"3P31211101000Z223434467567454Y2444444_1O24354455555333121100000Z2113112111_4BZ52Y22310224_3w03332Z45Y331_4L0Z32Y3014300350000_3x52Z32541Y25Z520Y5555_5C244334Z124540Y2111355_3DZ3112214310Y253444200_6WZ43434400Y244330Z255Y3_2SZ12121Y255311225300Z2_8MZ4Y3Z44_2N22Z21_9C0Z52Y4Z52_2RZ50Y310Z3_9AZ4333444452312231100000Y213443555555322111100Z20114_2yZ222212110Y4243334555555342112100000Z23344445545441_7W53431_3y02124_8P_2U"
    if(sig_default!='' && sig_default.length>10){
        sigfile.jSignature("clear");
        sigfile.jSignature("setData", "data:image/jsignature;base30,"+sig_default);
    }    
}


function save_passport(){
    
    
    
        gcn_bags_boxes_bulk = $('#gcn_bags_boxes_bulk').val();
        var messagebad = "";
        var formokay = true;
    
        
    
        if(gcn_bags_boxes_bulk=='' || gcn_bags_boxes_bulk==null || gcn_bags_boxes_bulk=='null'){
            formokay = false;
            messagebad += "Please enter Bags/Boxes/Bulk selection\r";   
        }

        if(gcn_bags_boxes_bulk=='BOXES'){

            if($('#gcn_bags_boxes_bulk_num').val()=='' || isNaN($('#gcn_bags_boxes_bulk_num').val())){
                formokay = false;
                messagebad += "Please enter total [BOXES] to Bags/Boxes/Bulk\r";
            }
            if( isNaN($('#gcn_box_out').val()) ||  $('#gcn_box_out').val()==''){
                formokay = false;
                messagebad += "Please enter [BOXES OUT] Number\r";
            }
            boxoutname = $('#gcn_marks_out').val().trim();
            if(boxoutname.length<1){
                formokay = false;
                messagebad += "Please enter accurate [BOXES MARKS OUT]\r";
            }
            
            boxinname = $('#gcn_marks_in').val().trim();
            boxinnums = $('#gcn_box_in').val().trim();
            if(boxinname!='' || boxinnums!=''){
                ///okay, they have added in box stuff, do the checks
                if( isNaN(boxinnums) ||  boxinnums==''){
                    formokay = false;
                    messagebad += "Please enter correct [BOXES IN] Number\r";
                }
                if(boxinname.length<1){
                    formokay = false;
                    messagebad += "Please enter accurate [BOXES MARKS IN]\r";
                }
            }
  
        }

        
if(!formokay){
    //gottopx = $('#page_passport').offset().top-$('#boxbastard').offset().top;
    //gottopx = gottopx*-1;
    //var relativeY = $("#page_passport").offset().top - $("#boxbastard").offset().top;
    alert(messagebad);
    gottopx = 1530;
    
    $('#page_passport').delay(300).animate({scrollTop: gottopx}, 500, 'swing');
    //gotop("page_passport");
    //$(window).delay(300).animate({scrollTop: 600 }, 2000);
    //$.mobile.silentScroll(500);



}else{
        
   
    
    
    
    
    
   
    ///////////////////////////////////////// ///////////////////////////////////////// ///////////////////////////////////////// 
		if(navigator.onLine){

            sigfile_this = sigfile.jSignature('getData', 'base30');
            sig_default = sigfile_this[1];
            
            $('#sigfile_this').val(sig_default);
            
            set_user_val_by_('podat_user', aid, 'sig_default', sig_default);
            
            sigfile_thisd = sigfile_d.jSignature('getData', 'base30');
            sig_driv = sigfile_thisd[1];
            $('#sigfile_d_this').val(sig_driv);
            
            var ppfrm = $('#passform').serialize();
			$('#no_live_data').hide();
            
            /*
            [
                "image/jsignature;base30",
                "2O3533522344855546s533433544Z3324423222322323326343a434430Y222374436656656d55433211243321110001100311Z44635664477774664Y5563844448474594548756Z11221211Y453322221212511001100213345554332323222114011134332122_3M20Z42433244835445m423222322Y2435743545555464459444a33432Z66666d4321221111100Y22234431Z346445665Y4456f44110Z212111232111110Y222211122121101010000Z644453441Y235555443430Z457677675544100Y2243433535544Z1754521Y224434"
            ]
            */
            
            //consol e.log('save_passport sig:',sig_driv);
            //consol e.log('save_passport ppfrm:',ppfrm);
            
            
			$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":pp_code, "ppfrm":ppfrm, "x": "_1%&6881$*$£632hs"}, url: mobSysURL+"dig_mobxxx/db_get_this_passport.php", success: function(data){
                //consol e.log('save_passport save:',data);
				if(data=='404'){
					alert('Sorry, no match found, please try again. [6]');
				}else{
					var rz = data.rez[0];
                    //consol e.log(rz);
                    if(rz=='success'){
                        if(remote_type>0){get_live_passports();}
                        $.mobile.changePage( "#page_crops", { transition: "flip"}); 
                    }else{
                    alert('Mmmm there was an error, please check your values.');
                    }
                  
										
                        
				}

			},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Mmmmm passport did not save!!! ');}
			});
		}else{
			$('#no_live_data').show();
		}
		///////////////////////////////////////// ///////////////////////////////////////// /////////////////////////////////////////  
    
    
}
}


function load_dress_list(){	
	$('#dress_list_table').html('');
    $('#dress_list_box').hide();
    var retdval = [];//assume success
	var store = getObjectStore('podat_dressings', 'readonly');
	var drs_len = 0;	
	req = store.count();
	req.onsuccess = function(evt) {
		drs_len = evt.target.result;
		var crps_html = '';
		crpgotlen = 0;///reset;
		
		if(drs_len>0){
                   
				//if there are no records, this will do nothing!
				store.openCursor().onsuccess = function(e) {
					var cursor = e.target.result;		
					if (cursor) {
							trow = cursor.value;
							if(trow.merc_id==merch_id && (trow.CropNo!='' || trow.extra_rs!='')){						
									
                                ///there may be dupes if the sync has happened and there is a waiting sync with a myuid not equal to ACTIVE
                                if(trow.id>0){
                                    retdval.push(trow);
                                }
									
							}
							cursor.continue();									
					}else{
                        //dont do this is looking at next years crops!
                        if($("#get_crop_ns").val()==0){BuildDRsView(retdval);}
                        
                    }

				};     
		}else{
             
            //$("#crop_list_ tableg").delay(800).slideToggle();    
        }	
	};
    
	//end of success
	
	if(remote_type>0){
        get_live_passports();
    }
	
	
};

var firsttime = true;
var cntdrs = 0;


function BuildDRsView(retdval){

    $('#dress_list_table div').remove(); 

    retdval.sort(function(a, b){
      let x = a.CropGrower.toLowerCase();
      let y = b.CropGrower.toLowerCase();
      if (x < y) {return -1;}
      if (x > y) {return 1;}
      return 0;
    });
       
    var cgro = '';    
    cntdrs = 0;
    //currdid = trow.id;   
    currdid = 0; 
    drs_len = retdval.length;
    if(drs_len>0){ 
        $('#dress_list_box').show(); 
        for(i = 0; i < drs_len; i++) {
            trow = retdval[i];
            
            //consol e.log('dress_list_ box',trow); 
            //is this a trade?
            typ = 0;
            if(trow.extra_rs!=''){
                if(trow.CropNo==''){
                    trow.CropNo = 'Trade Crop [T'+trow.extra_rs.tp_trade_id+''+(trow.extra_rs.tp_seller_ref?' '+trow.extra_rs.tp_seller_ref:'')+']';
                }
                typ = 1;
            }

            if(cgro!=trow.CropGrower){
                $('#dress_list_table').append("<div><h2 class='mb-0 mt-1 pl-1 white'>"+trow.CropGrower+"</h2></div>").enhanceWithin();    
            }
            cntdrs++;
            cgro=trow.CropGrower;
            
            ///////////////////////
            amtx = Number(trow.amt);
            amtf = Math.floor(amtx);
            t_symb = '';
            t_left = (amtx-amtf);
            if(t_left==0.5){t_symb = '&half;';}else if(t_left==0.25){t_symb = '&frac14;';}else if(t_left==0.75){t_symb = '&frac34;';}
            ///////////////////////
               
            //clicked_ crop(crop, merch,  drsid)
            CROPX = Number(trow.gid);///this needs to be the store index id, not the crop ID
            //<span style='color:#8AC585'>t</span>
            ditype = '[Grading] ';
            if(trow.OID==0){
                ditype = '<span style="color:#d3dd85;">[OPEN Grading]</span> ';
            }
            dicls = '';
            di_key_date=trow.drs_by_date;
            if(trow.di_status>3){
                ditype = '[Despatch] ';
                dicls = ' disph';
                if(trow.pickup_date==null){trow.pickup_date='TBC';}
                di_key_date=trow.pickup_date;
            }
            
            
            thistr ="<div class='itm dress"+dicls+" rounded p-5 OID_"+trow.OID+"' onclick='clicked_crop("+CROPX+",0,"+Number(trow.id)+","+typ+")'><table data-role='table' data-mode='columntoggle:none' class='ui-responsive smtd'><tr><td style='width:15%'><h3 class='ac' style='color:#9ad995' title='"+t_left+" / "+trow.amt+"'>"+amtf.toString()+t_symb+"t</h3></td><td><h5><strong>"+ditype+"</strong>"+trow.var_type_grade_country+"</h5><h5><span style='color:#9ad995'>"+trow.CropNo+"</span> <span style='color:#C1E7BE; float:right; padding:0 8px 0px'>"+di_key_date+"</span></h5></td></tr></table></div>";
            $('#dress_list_table').append(thistr).enhanceWithin();
            //cursor.keyidxval
            //ale rt(cntdrs); "+cntdrs+" / "+drs_len+"
            if(cntdrs==drs_len && firsttime){
                firsttime = false;                
                $("#openclosedrs").show();
            }
            
            
        }
    }else{
        //$('#dress_list_ box').append("<div><h1 class='mb-0 mt-2 pl-1 white overl aybg'>My Crops</h1></div>").enhanceWithin();
        
    }


}

$('body').on('click', '#openclosewc', function() {
	$("#concust_list_table").slideToggle();
    if($("#dress_list_table").is(":visible")) {$("#dress_list_table").slideToggle();}
    if($("#crop_list_tableg").is(":visible")) {$("#crop_list_tableg").slideToggle();}
    if($("#crop_list_tablev").is(":visible")) {$("#crop_list_tablev").slideToggle();}   
    if($("#passport_list_table").is(":visible")) {$("#passport_list_table").slideToggle();}
});
$('body').on('click', '#openclosepp', function() {
	$("#passport_list_table").slideToggle();
    if($("#dress_list_table").is(":visible")) {$("#dress_list_table").slideToggle();}
    if($("#crop_list_tableg").is(":visible")) {$("#crop_list_tableg").slideToggle();}
    if($("#crop_list_tablev").is(":visible")) {$("#crop_list_tablev").slideToggle();}   
    if($("#concust_list_table").is(":visible")) {$("#concust_list_table").slideToggle();}
});
$('body').on('click', '#openclosedrs', function() {
	$("#dress_list_table").slideToggle();
    if($("#passport_list_table").is(":visible")) {$("#passport_list_table").slideToggle();}
    if($("#crop_list_tableg").is(":visible")) {$("#crop_list_tableg").slideToggle();}
    if($("#crop_list_tablev").is(":visible")) {$("#crop_list_tablev").slideToggle();}   
    if($("#concust_list_table").is(":visible")) {$("#concust_list_table").slideToggle();}
});
$('body').on('click', '#openclosecrpg', function() {
	$("#crop_list_tableg").slideToggle();
    if($("#passport_list_table").is(":visible")) {$("#passport_list_table").slideToggle();}
    if($("#dress_list_table").is(":visible")) {$("#dress_list_table").slideToggle();}
    if($("#crop_list_tablev").is(":visible")) {$("#crop_list_tablev").slideToggle();}
    if($("#concust_list_table").is(":visible")) {$("#concust_list_table").slideToggle();}
});
$('body').on('click', '#openclosecrpv', function() {
	$("#crop_list_tablev").slideToggle();
    if($("#passport_list_table").is(":visible")) {$("#passport_list_table").slideToggle();}
    if($("#dress_list_table").is(":visible")) {$("#dress_list_table").slideToggle();}
    if($("#crop_list_tableg").is(":visible")) {$("#crop_list_tableg").slideToggle();}
    if($("#concust_list_table").is(":visible")) {$("#concust_list_table").slideToggle();}
}); 





























function buildCropView(){
	
	
	
	getLocation();
	
	
	
    $('#crop_list_tableg div').remove();
	$('#crop_list_tablev div').remove();
    
	$("#footer").hide();
	$("#crop_edit_foot").hide();
	$.mobile.changePage( "#page_crops", { transition: "flip"} );
	//$('#constate').html(checkConnection());
	
	
	//consol e. log("addCrop Row Args:", arguments);
	var retval = [];//assume success
	var req;
	var store = getObjectStore('podat_crops', 'readonly');	
	var c_len = 0;	
	req = store.count();
	
	req.onsuccess = function(evt) {
		c_len = evt.target.result;
			
			if(c_len>0){	
				store.openCursor().onsuccess = function(e) {
				var cursor = e.target.result;		
				if (cursor) {
					trow = cursor.value;
					if(trow.merc_id==merch_id){						
						///there may be dupes if the sync has happened and there is a waiting sync with a myuid not equal to ACTIVE
						retval.push(trow);
						//aler_t(trow);
					}
					cursor.continue();									
				}else{
					//aler_t(JSON.stringify(retval));
					buildCropView_build(retval);
				}
			}
			}else{
				//$("#welcomex").show();
			}	
	};
	
	
}






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///GET ACTIVE CROP LISTS

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///LIST ALL CROP
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var open_merch_id = 0;
var open_merchv_id = 0;

function buildCropView_build(crp_arr) {
	
	hide_loading();
	
    
	//consol e. log(crp_arr);
	
	auto_load_crops = false;
	searchvar = $('#crop_search_str').val();

	srchgo_ids = [];
	srchgo = '';
	if(searchvar.length>=2){		
		//if(searchvar=="KILL.ME.NOW"){db_purge();}	
		searchvar = clean_quotes(searchvar);
		srchgo = searchvar.toLowerCase();
        
        if($("#crop_list_tableg").is(":visible")) {}else{$("#crop_list_tableg").slideToggle();}
        if($("#crop_list_tablev").is(":visible")) {$("#crop_list_tablev").slideToggle();}
        if($("#dress_list_table").is(":visible")) {$("#dress_list_table").slideToggle();}
        
        
	}
	
	
	$("#openclosecrp").show();
	
	
	prevactive = 0;
	curr_v = '';
	curr_g = '';
	curr_g_num = 100;
	//aler_t('dsds');
	//consol e. log('podat_ crops GET');
	var crps_html = '';
    var vrps_html = '';
	var crp_len = 0;
	var crpgotlen = 0;
	if(crp_arr.length==0){
		if(navigator.onLine){
			get_all_crop_data();	
		}else{
			alert('We cannot get your crops... you seem to be offline. Please refresh when you are online.');
		}  
	}else{
		//consol e.log(crp_arr);
		for (i = 0; i < crp_arr.length; i++) {
			trow = crp_arr[i];
			
			
			if(trow.merc_id==merch_id && trow.CropNo!=''){
                
                
                    //set up the inspection page! from current crop year
                    if(i==0 && parseInt(trow.syear)!=syear){
                        syear = parseInt(trow.syear);
                        rebuld_growt_stage_drops();
                        $("#get_crop_ns").val(trow.thisornext).change();
                    }
                
                
                
                    
                    if(trow.Grower=='' || trow.Grower==null){trow.Grower = "Bad Grower Fix Me";}

					if(trow.Grower!=curr_g){												

						if(curr_g!=''){crps_html += '</table></div>';}
						//if(prevactive==curr_g_num){crps_html += '<script>$("#'+curr_g_num+' .sel- btn").fadeIn();</script>';}
						curr_g_num++;
						curr_v = '';
                        //<span class='sel-btn light fr' style='display:none;'></span>
						crps_html +="<div class='td_head rounded' data-gn='"+trow.Grower+"' id='"+curr_g_num+"'>"+trow.Grower.toUpperCase()+"</div><div class='hidtabblock'><table data-role='table' data-mode='columntoggle:none' class='ui-responsive smtd'><tr class='dark'><td>Crop</td><td class='ac'>Rate</td><td class='ac'>Area</td><td class='ac'>Tns</td></tr>";
						//$('#crop_ list_ table').append(thistr);
						curr_g = trow.Grower;
						prevactive = 0;   
					}

					//is this crop active?
					////trow.id
					cls = 'dark';
					crpid = trow.id;
					//ico cls = '';
					cncls = 'dark';
		
					if(trow.ImActive=='1'){
						//ico cls = ' redarr';
						prevactive = curr_g_num;
						cncls = 'red';
					}

		
                    avail = parseFloat(trow.e3555-trow.allocated_quant_s);
					if(avail!=0){
						avail = avail.toFixed(1);
					}
					
				
					if(trow.Variety!=curr_v){
						crps_html +="<tr class='itm var'><td colspan='4'><h5>"+trow.Variety+"</h5></td></tr>";
						curr_v = trow.Variety;
					}

					quantc = parseFloat(trow.Quantity);
					quantc = quantc.toFixed(1);
				
					srccls = '';
				
					if(srchgo!=''){
						srchgo.toLowerCase();
						frm_temp = trow.field_name.toLowerCase();
						crp_temp = trow.CropNo.toLowerCase();
						//var_temp = trow.Variety.toLowerCase();// || var_temp.includes(srchgo))
						if((srchgo==crp_temp || crp_temp.includes(srchgo)) || (srchgo==frm_temp || frm_temp.includes(srchgo))){
							srccls = ' high';
							if(!srchgo_ids.includes(curr_g_num)){srchgo_ids.push(curr_g_num);}
						}
					}


					if(trow.field_name.length>18){///was FarmName
					   trow.field_name = trow.field_name.substr(0, 17)+'*';
					}
				
					grde = trow.AttainedUnionGrade;
					if(grde=='' || grde==null){grde = trow.EntryUnionGrade;}
                    if(grde=='' || grde==null){grde = '?';}
                    if(trow.FieldGeneration=='0' || trow.FieldGeneration=='null'){trow.FieldGeneration = '';}
                
                    trow.CropNo = trow.CropNo.replace("PURCH", "PCH");
                    //<td class='ar'><a class='sel-btn"+ico cls+"'></a></td>
                    if(trow.FieldGeneration=='TP'){
                       ///trade product
                       quantc =  trow.eTotal;
                       avail =  trow.eTotal-trow.allocated_quant; 
					   crps_html +="<tr id='cn_"+trow.gid+"' class='itm"+srccls+"'><td><span style='color:#9A2525;'>P:</span><strong class='"+cncls+"' style='display:inline-block;'>"+trow.CropNo+"</strong></td><td class='ac'>-</td><td class='ac' style='color:#6e6d56;'>"+quantc+"</td><td class='ac'><strong class='"+(avail<0?'red':'green')+"'>"+avail+"</strong></td></tr>";
                    }else{
                       ratcls = 0; 
                       
                       if(!isNaN(trow.CropRating) && trow.CropRating>=1){
                           ratcls = trow.CropRating*10;
                       }else{
                           trow.CropRating = '?'; 
                       }
                       ratinx = '<div class="rag_'+ratcls+' ragdiv mx-auto">'+trow.CropRating+'</div>';
                        farmfield = trow.field_name;
                       if(farmfield==''){farmfield = trow.FarmName;} 
                       crps_html +="<tr id='cn_"+trow.gid+"' class='itm"+srccls+"' onclick='clicked_crop("+crpid+","+curr_g_num+",0)'><td><strong class='"+cncls+"'>"+trow.CropNo+"</strong> <span class='green'>"+grde+trow.FieldGeneration+"</span> "+farmfield+"</td><td class='ac'>"+ratinx+"</td><td class='ac'><strong class='green'>"+quantc+"</strong></td><td class='ac'><strong class='brown'>"+avail+"</strong></td></tr>";     
                    }
                    crpgotlen++;

			}
			
			
			
			
		}
		
		crps_html += '</table></div>';
		$('#crop_list_tableg').append(crps_html).enhanceWithin();
		//$('#crop_list_ table').html(crps_html);
        
        
        
        
        
        
        ///addd sorted items to Crops by Variety
        crp_arr.sort(function(a, b){
          let x = a.Variety.toLowerCase();
          let y = b.Variety.toLowerCase();
          if (x < y) {return -1;}
          if (x > y) {return 1;}
          return 0;
        });
        
        
        curr_g = '';
        curr_v = '';

        stns = 0;
        wtns = 0;
            
        for (i = 0; i < crp_arr.length; i++) {
			trow = crp_arr[i];
			if(trow.merc_id==merch_id && trow.CropNo!=''){
                
                    //if(trow.Grower=='Fairfields Farming Co'){consol e.log(trow);}
                    
                    //eWare, allocated_quant_s, allocated_quant_w
         
					if(trow.Variety!=curr_v){
						if(curr_v!=''){
                            stns = stns.toFixed(1);
                            wtns = wtns.toFixed(1);
                            
                            vrps_html +="<tr class='itm'><td class='pr-5 ar' style='padding: 0.1em 0.2em!important; color:#dbd9ba;'>Seed/Ware Est.</td><td class='ac' style='padding: 0.2em 0em!important;'><div class='rounded white' style='background:#265C16; margin: 0.2em 0.2em!important; padding: 0.1em 0.3em!important;'>"+stns+"t</div></td><td class='ac' style='padding: 0.2em 0em!important;'><div class='rounded white' style='background:#666543; margin: 0.2em 0.2em!important; padding: 0.1em 0.3em!important;'>"+wtns+"t</div></td></tr><tr class='itm'><td class='pr-5 ar' colspan='3' style='padding: 0.3em 0.2em!important;'></td></tr>";
                            vrps_html += '</table></div>';
                            
                            stns = 0;
                            wtns = 0;
                        }
                        curr_v = trow.Variety;
						vrps_html +="<div class='td_head rounded' data-gn='"+trow.Grower+"' data-vn='"+trow.Variety+"' id='v"+trow.varietyid+"'>"+trow.Variety.toUpperCase()+"</div><div class='hidtabblock'><table data-role='table' data-mode='columntoggle:none' class='ui-responsive smtd'><tr class='dark'><td>Crop</td><td class='ac'>Rate</td><td class='ac'>Area</td><td class='ac'>Tns</td></tr>"; 
					    curr_g = '';   
                    }

					//is this crop active?
					////trow.id
					cls = 'dark';
					crpid = trow.id;
					//ico cls = '';
					cncls = 'dark';


					avail = parseFloat(trow.e3555-trow.allocated_quant_s);
					
					wvail = parseFloat(trow.eWare-trow.allocated_quant_w);
					
				
					if(trow.Grower!=curr_g){
						vrps_html +="<tr class='itm var'><td colspan='4'><h5>"+trow.Grower+"</h5></td></tr>";
						curr_g = trow.Grower;
                        curr_g_num++;
					}

				
					if(trow.field_name.length>14){
					   trow.field_name = trow.field_name.substr(0, 13)+'*';
					}
				
					grde = trow.AttainedUnionGrade;
					if(grde=='' || grde==null){grde = trow.EntryUnionGrade;}
                
                    
                
                    if(trow.FieldGeneration=='0' || trow.FieldGeneration==null){trow.FieldGeneration = '';}
                
                    trow.CropNo = trow.CropNo.replace("PURCH", "PCH");
                    //<td class='ar'><a class='sel-btn"+ico cls+"'></a></td>
                
                
                
                
                    if(trow.FieldGeneration=='TP'){
                       ///trade product
                       if(trow.EntryUnionGrade=='W'){
                           quantc =  0;
                           avail =  trow.eTotal-trow.allocated_quant;
                           wvail = avail.toFixed(1);
                           wtns+=parseFloat(wvail);
                       }else{
                           quantc =  trow.eTotal-trow.allocated_quant;
                           avail =  0;
                           avail = quantc.toFixed(1);
                           stns+=parseFloat(avail);
                       } 
                       
                       // <span class='white'>"+trow.eTotal+"t</span> 
					   vrps_html +="<tr id='vn_"+trow.gid+"' class='itm'><td><span style='color:#9A2525;'>P:</span><strong class='"+cncls+"' style='display:inline-block;'>"+trow.CropNo+"</strong></td><td class='ac'></td><td class='ac' style='color:#6e6d56;'>"+quantc+"t</td><td class='ac'><strong class='green'>"+avail+"t</strong></td></tr>";
                    }else{
                        if(avail!=0){
                            avail = avail.toFixed(1);
                            stns+=parseFloat(avail);
                        } 
                        if(wvail!=0){
                            wvail = wvail.toFixed(1);
                            wtns+=parseFloat(wvail);
                        }
                        
                            quantc = parseFloat(trow.Quantity);
                            quantc = quantc.toFixed(1);
                        
                        ratcls = 0; 

                        if(!isNaN(trow.CropRating) && trow.CropRating>=1){
                           ratcls = trow.CropRating*10;
                        }else{
                           trow.CropRating = '?'; 
                        }
                        ratinx = '<div class="rag_'+ratcls+' ragdiv mx-auto">'+trow.CropRating+'</div>';  
                        farmfield = trow.field_name;
                        if(farmfield==''){farmfield = trow.FarmName;}
                        vrps_row ="<tr id='vn_"+trow.gid+"' class='itm' onclick='clicked_crop("+crpid+",-"+trow.varietyid+",0)'><td><strong class='green'>"+grde+trow.FieldGeneration+"</strong> <strong class='"+cncls+"'>"+trow.CropNo+"</strong> "+farmfield+"</td><td class='ac'>"+ratinx+"</td><td class='ac'><strong class='green'>"+quantc+"</strong></td><td class='ac'><strong class='brown'>"+avail+"</strong></td></tr>";
                        //consol e.log('crop_list_tablev', vrps_row);
                        
                        
                        vrps_html +=vrps_row;
   
                    }
                    
                
					
					crpgotlen++;

			}
        }
        if(curr_v!=''){
            //last one!
            stns = stns.toFixed(1);
            wtns = wtns.toFixed(1);
            vrps_html +="<tr class='itm'><td class='pr-5 ar' style='padding: 0.1em 0.2em!important; color:#dbd9ba;'>Seed/Ware Est.</td><td class='ac' style='padding: 0.2em 0em!important;'><div class='rounded white' style='background:#265C16; margin: 0.2em 0.2em!important; padding: 0.1em 0.3em!important;'>"+stns+"t</div></td><td class='ac' style='padding: 0.2em 0em!important;'><div class='rounded white' style='background:#666543; margin: 0.2em 0.2em!important; padding: 0.1em 0.3em!important;'>"+wtns+"t</div></td></tr><tr class='itm'><td class='pr-5 ar' colspan='3' style='padding: 0.3em 0.2em!important;'></td></tr>";
            
            stns = 0;
            wtns = 0;
        }

		
		vrps_html += '</table></div>';
        
        
        
        
		$('#crop_list_tablev').append(vrps_html).enhanceWithin();

        
        
        
        ///////////////////////////////////////////////////////////////////////////
        $('#crop_list_boxg').show();//admin only
        $("#crop_list_tablev").show();
        
		if(remote_type==1){
            
        }else if(remote_type==2){
            //crop_list_tablev
            
        }
        
        $('#crop_list_boxv').show();
		$("#openclosecrpg").show();
        $("#openclosecrpv").show();

	}
	
	
	//$("#crop_ list_ tableg").table().table("rebuild");
	$(".ui-content").trigger("updatelayout");
	
	

		
	
	if(srchgo_ids.length){
		//aler_t(JSON.stringify(srchgo_ids)); 
		for(o = 0; o < srchgo_ids.length; o++){
			//aler_t(srchgo_ids[o]);
			$('#'+srchgo_ids[o]).next(".hidtabblock").slideToggle("slow");			
		}
	}
	
	
	if(open_merch_id>0){
	  	$('#'+open_merch_id).next(".hidtabblock").slideToggle("slow"); 
	}
	if(open_merchv_id>0){
	  	$('#v'+open_merchv_id).next(".hidtabblock").slideToggle("slow"); 
	}		
					
	///try and do a sync!
	
	if(act_List.length>0){
	 	//do_the_ sync();
        
	}
	
	load_dress_list();


	
}






$('body').on('click', '.td_head', function() {
	$(this).next(".hidtabblock").slideToggle("fast");   
});









/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///VIEW FULL CROP
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function clean_crop_table(){
	$('#crop_inspections_table tr').remove();
    $('#crop_photos_table tr').remove(); 
    $('#ltd_table tr').remove();
    $("#ltd_by_name").html('N/A');
    $("#pbtd_date").html('N/A');
	$("#crop_details_table .td_grey").html('');
	$("#page_crop_details #cd_Grower").html('No Live Data.');
	$("#page_crop_details #cd_FarmName").html('No connection.');
}




//clicked_crop(CROPID (gid),0,DI ID,DI 0 or TRADE 1)
function clicked_crop(cc, merch,  drsid, typ=0){
	
	clean_crop_table();
	getLocation();
    
    console.log('clicked_crop', 'cc:', cc, 'mrch:', merch,  'drs:', drsid, 'typ:', typ);
    
    
    if(merch>0){
	   open_merch_id = merch;
    }else if(merch<0){
        merch =- merch;//make positive
        open_merchv_id = merch;       
    }
	
	last_inspect_rs = '';
	set_button_high();	
	$("#igid").val(0);//
	igid = 0;
    

    
	//cc: 999 mrch: 0 drs: 293 typ: 0
	if(drsid>0){
		$('#dress_id').val(drsid);
        $('#dress_id_type').val(typ);
        if(cc>0){
           get_row_by_val('podat_crops', 'gid', cc, 'fill_crop_detail');
        }else{
            //its a trade crop, with no direct matching crop
            load_dress(drsid);
        }
	}else{
		$('#dress_id').val(0);
        $('#dress_id_type').val(0);
        crop_row = get_row_by_index('podat_crops', cc, 'fill_crop_detail');
	}
    
		


	
}


function dd(dx) {
    // Take the difference between the dates and divide by milliseconds per day.
    // Round to nearest whole number to deal with DST.
	ff = new Date();
    return Math.round((ff-dx)/(1000*60*60*24));
}


var purc_id = 0;
var ptypes = ['','Doc Photo','Crop Photo','Dig Photo','DI Photo'];
var defectlist_all = ['waste','soil','ftypo','stones','rogues','blight','cracking','passes','pvy','gks','virus','trees','pylons','hollows','endrigs','common_scab','powdery_scab','black_scurf','rots','mech_damage','dm','bruising','bruising_major','browning','irs','spraing','hollow','scab','bdot','sscurf','pest','storetype','storability','priority','market','rec_cust_list','tubertemp_in','tubertemp_out','scuffing','netting','brightness','greens','russett','line_break'];
var defectnames_all_mini = ['G/Waste','Soil','Topo','Stones','Rogues','Blight','Cracking','Passes','PVY+','GroundK','Virus','Trees','Pylons','Hollows','Endrigs','C/Scab','P/Scab','B/Scurf','Rots','M/Damage','D/Matter','Bruise (Min)','Bruise (Maj)','Int/Brown','IRS','Spraing','Hollows','Scab','B/Dot','S/Scurf','Pest','Store','Storability','Priority','Market','Customers','T/Temp [I]','T/Temp [O]','Scuffing','Netting','Brightness','greens','russett','|LINE-BREAK|'];
var ins_ignore = ['CropPhotos','TD_String','isp_grower_name','isp_crop','isp_irrig_date','isp_irrig_mm','isp_user','isp_date','id'];
var arr_instnces = ['N/A','CLEAN','TRACE','LOW','MOD','HIGH','VERY HIGH'];
var arr_instnces_store = ['N/A','Ambient','C/Ambient','Airmix','Coldstore'];//storetype
var arr_instnces_market = ['N/A','Washing','2nd Washing','Bakers','Processing','Frying','Necktie','Brushing','Crisping','Export','Seed','Stock Feed'];//market
var arr_instnces_storeability = ['N/A','Short','Medium','Long'];//storability
var normalidx = ['Date', 'tubertemp_in', 'tubertemp_out', 'priority', 'dm', 'bruising', 'bruising_major', 'cracking', 'rec_cust_list', 'blackleg','rogues','virus','vari','score','gks','pvy'];

var arr_soil = ['VERY LIGHT','LIGHT','LIGHT-MEDIUM','MEDIUM','MEDIUM-HEAVY','HEAVY','VERY HEAVY'];
var arr_endrigs = ['NO','YES','OTHER VARIETY'];
var arr_ftypo = ['FLAT','FAIRLY FLAT','SLOPING','UNDULATING','BOWL','UPTURNED BOWL'];
var arr_hollows = ['NO','YES','POSSIBLE'];
var arr_stones = ['VERY FEW','FEW','AVERAGE','MANY','VERY MANY'];			
var arr_pylons = ['NO','YES'];
var arr_freedrain = ['NO','YES','PARTIAL'];
var arr_trees = ['NO','YES'];
var arr_blight = ['NIL','TRACE','SLIGHT','MOD','SEVERE'];









function fill_crop_detail(rz){
	    //consol e. log('fill_crop_ detail', rz);   
		//TestDigRating: rz[z]['TestDigRating'], StoreRating: rz[z]['StoreRating'], DryMatter_ PCT: rz[z]['DryMatter_ PCT'], Spraing_PCT: rz[z]['Spraing_PCT']
		igid = parseInt(rz.gid);
		$("#igid").val(igid);//
    
        if($('#dress_id').val()>0){
            //ignore
        }else{
            get_inspection_notes_from_server(igid);
        }
    
		
		$('.dts_saved_div').hide();	

	    grde = rz.AttainedUnionGrade;
        if(grde==''){grde = '<span style="color:#e3e2c8">'+rz.EntryUnionGrade+'</span>';}
        ch1 = "<span class='green'>"+rz.Variety+"</span> "+grde+(rz.FieldGeneration!="0"?rz.FieldGeneration:'');
        
		$(".page_crop_head_h1").html(ch1);//

    
		$("#current_bc").html(rz.BoxCount);//
		$("#bx_txt").html(rz.BoxCount);
		
		$("#dig_cropshouldbe").val(rz.CropNo);//
	
		$("#td_field_area").val(rz.Quantity);//for t dig page		
		purc_id = rz.purc_id;
    
    
        if(app_user_type=='0'){
            //admin
            $('.foot_icon.testdig').show();
            $('.foot_icon.inspect').show();
        }else{
            //store user
            $('.foot_icon.testdig').hide();
            $('.foot_icon.inspect').hide();
        }
    
	   
	   //<div id="crop_edit_foot"><a class="foot_icon inspect" onclick="load_inspect_ crop();">Inspect</a><a class="foot_icon testdig"  onclick="load_test_dig();">Test Dig</a><a class="foot_icon boxcount" onclick="load_box_count();">Box Count</a></div>
		if(rz.CropRating=='0.0'){rz.CropRating=0;}
		if(rz.StoreRating=='0.0'){rz.StoreRating=0;}
    
    
        ratcls = 0; 

        if(!isNaN(rz.CropRating) && rz.CropRating>=1){
           ratcls = rz.CropRating*10;
           crnum = rz.CropRating; 
        }else{
           crnum = '?'; 
        }
        ratinx = '<div class="rag_'+ratcls+' ragdiv" style="font-size:1em">'+crnum+'</div>'; 

    
		$("#cd_crrate").html(ratinx);//	
		$("#CropRating").val(rz.CropRating).change();
		$("#the_crop_rating").val(rz.CropRating).change();
		$("#the_store_rating").val(rz.StoreRating).change();

		$("#cd_GrowerFarm").html(rz.Grower);//
		$("#cd_Var").html(ch1+' <span style="color:#915826;">'+rz.CropNo+'</span>');
        $("#cd_Frm").html(rz.FarmName+' <span style="color:#7A7756">'+rz.field_name+'</span>');
	
		$("#cd_plantd").html('N/A');
		$("#cd_burnd").html('N/A');	
        $("#cd_herbd").html('N/A');
		$("#cd_harvestd").html('N/A');
		$("#pdd").html('');$("#bdd").html('');$("#hdd").html('');$("#brd").html('');
    
    
    
        crop_words = rz.CropNo+"^"+rz.Variety+"^"+rz.FarmName+"^"+rz.field_id+"^"+rz.FID+"^"+rz.Quantity;

    
        /*
        if(rz.LatLong.length<10 && rz.geo_temp!='' && rz.geo_temp!= undefined && rz.geo_temp.length>10){
            //use basic chords...
            
            rz.geo_temp = rz.geo_temp.replace(/\s/g,'');
            
            rz.LatLong = '('+rz.geo_temp+')';
            
            geotemp = rz.geo_temp.split(",");
            //consol e.log('rz.geo_temp', rz.geo_temp, geotemp);
            p_lat = geotemp[0].trim();
            p_long = geotemp[1].trim(); 
        
        }*/
    
    
    
        if(rz.LatLong && rz.LatLong.length>10){
            myll = rz.LatLong;
            myll = myll.replace(/\((.+?)\)/g, "[$1]");            
            triangleCoords = JSON.parse("[" + myll + "]");
        }else{ 
            triangleCoords = [];    
        }
    
        //consol e.log('triangleCoords', triangleCoords);
        $('#save_poly_map').closest('.ui-btn').hide(); 
        $('#map_area_val').html('');
        $('#vertices').val(rz.LatLong);
    
    
        ///are we conencted?
        iamcon = 0;
        if(navigator.onLine){
            iamcon = 1;
        }
        load_map(triangleCoords, crop_words, iamcon);
		
		if(rz.DatePlanted!='' && rz.DatePlanted){			
			if(rz.DatePlanted.length==10){
                $("#the_plant_date").val(rz.DatePlanted);
				fd = new Date(rz.DatePlanted);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_plantd").html(fds);//fd.toDateString()
				$("#pdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
			}		
		}else{$("#the_plant_date").val('');}

		if(rz.BurnDate!='' && rz.BurnDate){			
			if(rz.BurnDate.length==10){
				$("#the_burn_date").val(rz.BurnDate);
				fd = new Date(rz.BurnDate);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_burnd").html(fds);
				$("#bdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
			}
		}else{$("#the_burn_date").val('');}
    
    
        if(rz.DateHerb!='' && rz.DateHerb){			
			if(rz.DateHerb.length==10){
				$("#the_herb_date").val(rz.DateHerb);
				fd = new Date(rz.DateHerb);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_herbd").html(fds);
				$("#brd").html(': <span class="peagreen">'+dd(fd)+'</span>');
			}
		}else{$("#the_herb_date").val('');}

		//aler_t(rz.Harvest Date);
		$("#harv_date_now").text('Not Set!');
		
        $("#fieldtopo_field_div").hide();
        //
        //
		if(rz.HarvestDate!='' && rz.HarvestDate){
			if(rz.HarvestDate.length==10){
				$("#the_harvest_date").val(rz.HarvestDate);
                
				fd = new Date(rz.HarvestDate);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_harvestd").html(fds);
				$("#hdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
                $(".foot_icon.testdig").hide();
                $("#harv_date_now").text(dd(fd));
                $("#ins_field_div").hide();
                //$("#samp_def_div").show();
                $("#growstage_field_div").hide();
			}
            
		}else{
            $("#the_harvest_date").val('');
            //$("#ins_field_div").show();
            //$("#samp_def_div").hide();
            //$("#growstage_field_div").show();
        }
		

	

        console.log('dump crop',rz);
        if(rz.length){
            $.each(rz, function(idx, itm) {
                if(idx!='DatePlanted' && idx!='BurnDate' && idx!='HarvestDate' && idx!='DateHerb'){
                $('#cd_'+idx).html(itm);
                }
            });
        }
    
        avail = 0;wvail = 0;
        avail = parseFloat(rz.e3555-rz.allocated_quant_s);
        if(avail!=0){
            avail = avail.toFixed(1);
        }
        wvail = parseFloat(rz.eWare-rz.allocated_quant_w);
        if(wvail!=0){
            wvail = wvail.toFixed(1);
        }
    
        $('#ca_seed').html(avail);
        $('#ca_ware').html(wvail);
    
        allocated_quant_s = Number(rz.allocated_quant_s);allocated_quant_s = allocated_quant_s.toFixed(1);
        allocated_quant_w = Number(rz.allocated_quant_w);allocated_quant_w = allocated_quant_w.toFixed(1);
        dispatched_quant_s = Number(rz.dispatched_quant_s);dispatched_quant_s = dispatched_quant_s.toFixed(1);
        dispatched_quant_w = Number(rz.dispatched_quant_w);dispatched_quant_w = dispatched_quant_w.toFixed(1);
    
        $('#ca_allo').html(allocated_quant_s.toString()+' / '+allocated_quant_w.toString());
        $('#ca_disp').html(dispatched_quant_s.toString()+' / '+dispatched_quant_w.toString());
    
    
    
	
	
		///also need to check see if there is a misc update yet!
		get_row_by_val('podat_misc_saves', 'gid', igid, 'fill_crop_misc', 'misc_type', 'CDATES');
		//aler_t(JSON.stringify(misc_row));
	
	       
		///try and get the latest inspection
		if(navigator.onLine){
			$('#no_live_data').hide();
            //consol e.log('db_get_last_inspection', userkey, igid);
			$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":igid, "x": "_1%&$*$£632hs6881"}, url: mobSysURL+"dig_mobxxx/db_get_last_inspection.php", success: function(data){

				if(data=='404'){
					alert('Sorry, no match found, please try again. [7]');
				}else{
					var rz = data.rez[0];
					//consol e.log('last_inspection:',rz);
                    
                   
                    
					
					if(!rz){
						$('#crop_inspections_table').append("<tr class='itm'><td>No inspection data just now...</td></tr>").enhanceWithin();
                        $('#crop_photos_table').append("<tr class='itm'><td>No photos just now...</td></tr>").enhanceWithin();
                        $('#ltd_table').append("<tr class='itm'><td>No test dig data just now...</td></tr>").enhanceWithin();
                        $("#isp_by_name").html('N/A');
                        $("#ltd_by_name").html('N/A');
                        $("#pbtd_date").html('N/A');
                        $("#last_td_title").html('Last Test Dig');
                        
					}else{
							
                        ///////////////////////////////////////////////////
                        cropphoto_html = "";                  
                        if(rz.CropPhotos.length>0){

                                
                        
                                /*
                                "id": "380",
                                "pttype": "2",
                                "photo_file": "06151024_1215_153_72.jpg",
                                "sdate": "15th Jun 10:24"
                                https://www.smilliepotatoes.co.uk/dig/_assets/_user/images/from_dig/06151024_1215_153_72.jpg<tr class='itm'><td>"+rz.CropPhotos.length+" photos just now...</td></tr>
                                //"https://"+dig url+"/
                                */
                             
                                
                                
                                for(z=0;z<rz.CropPhotos.length;z++){
                                    crppho = rz.CropPhotos[z];
                                    cropphoto_html += "<tr class='itm'><td class='p-2 ac'><img class='rounded2' style='width:100%' src='"+mobSysURL+"_assets/_user/images/from_dig/"+crppho.photo_file+"' /><br>"+ptypes[crppho.pttype]+": "+crppho.sdate+"</td></tr>";   
                                }
                                $('#crop_photos_table').append(cropphoto_html).enhanceWithin();
                            }else{
                                $('#crop_photos_table').append("<tr class='itm'><td>No photos just now...</td></tr>").enhanceWithin();
                            }
                        ///////////////////////////////////////////////////
                        
                            last_inspect_rs = rz;
							incnt = 1;
							inspec_html = '';
                            inspec_html_coms="";
							$.each(rz, function(idx, itm) {
								if(idx=='BD_String'){
									///handle load of BURN
                                    //$('#ltd_table').append("<tr><td colspan='4' class='p-3'>"+itm+"</td></tr>").enhanceWithin();
                                    
                                    td_all_arr = itm.split("^BD^");
                                    td_html = "";
                                    
                                    for(z=0;z<td_all_arr.length-1;z++){
                                        td_names = td_all_arr[z].split("^!^");
                                        $("#last_td_title").html('Last Pre Burn Dig');
                                        if(z==0){
                                            $("#ltd_by_name").html(td_names[0]);
                                            $("#pbtd_date").html(td_names[1]);
                                        }
                                        if(td_names[2]=='0.000x0.000'){
                                            td_names[2]='1x0.925';
                                        }
                                        if(td_names[11]<0){td_names[11] = "N/A";}
                                                      
                                        pbarea = td_names[2].split("x");
                                        y0 = parseFloat(10000/(pbarea[0]*pbarea[1]));//(10000 DIVIDED BY DIG LENGTH X DIG WIDTH)
                                        
                                        y1 = parseFloat((td_names[10]*(y0))/1000,2).toFixed(2);//
                                        y2 = parseFloat((td_names[8]*(y0))/1000,2).toFixed(2);
                                        y3 = parseFloat((td_names[6]*(y0))/1000,2).toFixed(2);
                                        y4 = parseFloat((td_names[4]*(y0))/1000,2).toFixed(2);
                                        
                                        
                                        tot_t = parseInt(td_names[9])+parseInt(td_names[7])+parseInt(td_names[5])+parseInt(td_names[3]);
                                        tot_kg = (parseFloat(td_names[10])+parseFloat(td_names[8])+parseFloat(td_names[6])+parseFloat(td_names[4])).toFixed(2);
                                        y5 = parseFloat((tot_kg*(y0))/1000,2).toFixed(2);
                                        
                                        
                                        if(td_names[12]!=''){td_html += "<tr><td colspan='4'><h4 class='mt-1 mb-1'>"+td_names[12]+"</h4></td></tr>";}
                                        td_html += "<tr><td colspan='4'><table>";
                                        td_html += "<tr><td class='td_dark'>Size</td><td class='td_dark ac'>Tubs</td><td class='td_dark ac'>Kg</td><td class='td_dark ac'>T/PH</td><td class='td_dark ac'>Area</td><td class='td_dark ac'>Stems</td></tr>";
                                        td_html += "<tr><td class='td_dark'><35</td><td class='p-3 ac'>"+td_names[9]+"</td><td class='p-3 ac'>"+td_names[10]+"</td><td class='p-3 ac'>"+y1+"</td><td class='p-3 ac'>"+td_names[2]+"</td><td class='p-3 ac'>"+td_names[11]+"</td></tr>";
                                        td_html += "<tr><td class='td_dark'>35x50</td><td class='p-3 ac'>"+td_names[7]+"</td><td class='p-3 ac'>"+td_names[8]+"</td><td class='p-3 ac'>"+y2+"</td><td class='p-3 ac' colspan='2'></td></tr>";
                                        td_html += "<tr><td class='td_dark'>50x55</td><td class='p-3 ac'>"+td_names[5]+"</td><td class='p-3 ac'>"+td_names[6]+"</td><td class='p-3 ac'>"+y3+"</td><td class='p-3 ac' colspan='2'></td></tr>";
                                        td_html += "<tr><td class='td_dark'>55+</td><td class='p-3 ac'>"+td_names[3]+"</td><td class='p-3 ac'>"+td_names[4]+"</td><td class='p-3 ac'>"+y4+"</td><td class='p-3 ac' colspan='2'></td></tr>";
                                        td_html += "<tr><td>Total</td><td class='td_red ac'>"+tot_t+"</td><td class='td_red ac'>"+tot_kg+"</td><td class='td_red ac'>"+y5+"</td><td class='p-3 ac' colspan='2'></td></tr>";
                                        td_html += "</table></td></tr>";
                                        /**/
                                        
                                        
                                    }
                                    
                                    $('#ltd_table').append(td_html).enhanceWithin();
                                    /*
                                    fraser^!^0
                                    5th Aug^!^1
                                    0.000x0.000^!^2
                                    2^!^3
                                    0.35^!^4
                                    5^!^5
                                    0.60^!^6
                                    85^!^7
                                    5.50^!^8
                                    10^!^9
                                    0.25^!^10
                                   -1^!^11 - stems
                                    Clean, export no problem 12
                                    ^BD^
                                    */
                                    
                                    
                                    
                                    
                                    
								}else if(idx=='TD_String' && itm!=''){                                    
									///handle load of TEST DIG
                                    td_all_arr = itm.split("*!*");
                                    td_names = td_all_arr[0].split("^!^");
                                    td_tubers = td_all_arr[1].split("|");
                                    td_s_tems = td_all_arr[2];
                     
               
                                    $("#last_td_title").html('Last Test Dig');
                                    $("#ltd_by_name").html(td_names[0]);
                                    $("#pbtd_date").html(td_names[1]);
                                    ratio1 = Math.round(10000/td_names[5]);
                                    
                                    td_html = "<tr><td class='td_dark'>Crop Area</td><td class='p-3'>"+td_names[2]+"</td><td class='td_dark'>Waste</td><td class='p-3'>"+td_names[3]+"</td></tr>";
                                    td_html += "<tr><td class='td_dark'>L x W</td><td class='p-3'>"+td_names[4]+"</td><td class='td_dark'>Dig Area</td><td class='p-3'>"+td_names[5]+"</td></tr>";
                                    td_html += "<tr><td class='td_dark'>TD Rate</td><td class='p-3'>"+td_names[6]+"</td><td class='td_dark'>Ratio</td><td class='p-3'>"+ratio1+"</td></tr>";
                                    if(td_s_tems!=''){
                                        td_html += "<tr><td class='td_dark'>Stems</td><td class='p-3' colspan='3'>"+td_s_tems+"</td></tr>";
                                    }
                                    if(td_names[7].length>1){td_html += "<tr><td class='td_dark'>Disease</td><td class='p-3' colspan='3'>"+td_names[7]+"</td></tr>";}
                                    if(td_names[8].length>1){td_html += "<tr><td class='td_dark'>Pest</td><td class='p-3' colspan='3'>"+td_names[8]+"</td></tr>";}
                                    if(td_names[9].length>1){td_html += "<tr><td class='td_dark'>Comments</td><td class='p-3' colspan='3'>"+td_names[9]+"</td></tr>";}
                                    ///begin table
                                    td_SYH = td_names[12].split("|");
                                    td_SPT = td_names[11].split("|");
                                    td_TUX = td_names[10].split("|");
                                    y0 =(td_SYH[0]*td_names[2]).toFixed(2);
                                    y1 =(td_SYH[1]*td_names[2]).toFixed(2);
                                    y2 =(td_SYH[2]*td_names[2]).toFixed(2);
                                    y3 =(td_SYH[3]*td_names[2]).toFixed(2);
                                    y4 =(td_SYH[4]*td_names[2]).toFixed(2);
                                    y5 =(td_SYH[5]*td_names[2]).toFixed(2);
                                    y6 =(td_SYH[6]*td_names[2]).toFixed(2);
                                    y7 =(td_SYH[7]*td_names[2]).toFixed(2);
                                    y8 =(td_SYH[8]*td_names[2]).toFixed(2);
                                    
                                    //td_SYH35 = 0;
                                    
                                    gro_targ = td_names[17];
                                    gro_six = td_names[18];//25x45|1-5
                                    gro_six_arr = gro_six.split("|");
                                    
                                    gro_six_size = gro_six_arr[0].split("x");
                                    gro_six_sizeidx = gro_six_arr[1].split("-");
                                    
                                    //consol e.log('XXXGjh',gro_six_size,gro_six_sizeidx);
                                    
                                    if(isNaN(gro_targ)){
                                        gro_targ = 0;
                                    }
                                    
                                    siz1 = 25;
                                    siz2 = 30;
                                    if(gro_targ==1){
                                        siz1 = 20;
                                        siz2 = 25;
                                    }else if(gro_targ==2){
                                        siz1 = 45;
                                        siz2 = 50;
                                    }else{
                                    
                                    }
                                    
                                    sidx1 = parseInt(gro_six_sizeidx[0]);
                                    sidx2 = parseInt(gro_six_sizeidx[1]);
                                    
                                    td_SYH35 = 0;
                                    td_SYHtot = 0;
                                    td_SPT35 = 0;
                                    td_Ytot = 0;
                                    //"+td_names[14]+""+td_Ytot+"
                                    //td_SYH35 = (parseFloat(td_SYH[2])+parseFloat(td_SYH[3])+parseFloat(td_SYH[4])+parseFloat(td_SYH[5])).toFixed(2);
                                    //td_SPT35 = parseInt(td_SPT[2])+parseInt(td_SPT[3])+parseInt(td_SPT[4])+parseInt(td_SPT[5]);
                                    
                                    
                                    for(x=sidx1;x<sidx2;x++){
                                        td_SYH35 += parseFloat(td_SYH[x]);
                                        td_SPT35 += parseFloat(td_SPT[x]);
                                        td_Ytot += parseFloat(eval('y'+x));
                                    }
                                    td_SYH35 = td_SYH35.toFixed(2);
                                    td_SPT35 = td_SPT35.toFixed(2);
                                    td_Ytot = td_Ytot.toFixed(2);
                                    
                                    
                                    td_SYHtot = (parseFloat(y0)+parseFloat(y1)+parseFloat(y2)+parseFloat(y3)+parseFloat(y4)+parseFloat(y5)+parseFloat(y6)+parseFloat(y7)).toFixed(2);
                                    
                                    
                             
                                    td_BX =(parseFloat(td_SYHtot)+(td_SYHtot*(td_names[3]/100))).toFixed(2);
                                    
                                    
                                    //consol e.log(td_tubers);
                                    
                                    td_html += "<tr><td colspan='4'><h2 class='mt-1 mb-1'>Dig Breakdown</h2></td></tr>";
                                    td_html += "<tr><td colspan='4'><table>";
                                    td_html += "<tr><td class='td_dark'>Size</td><td class='td_dark ac'>SY/H</td><td class='td_dark ac'>S%</td><td class='td_dark ac'>T/50</td><td class='td_dark ac'>Y</td><td class='td_dark ac'>Avg # , kg</td></tr>";
                                    
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[0]+"</td><td class='p-3 ac'>"+td_SPT[0]+"</td><td class='p-3 ac'>"+td_TUX[0]+"</td><td class='p-3 ac'>"+y0+"</td><td class='p-3 ac'>"+td_tubers[0]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[1]+"</td><td class='p-3 ac'>"+td_SPT[1]+"</td><td class='p-3 ac'>"+td_TUX[1]+"</td><td class='p-3 ac'>"+y1+"</td><td class='p-3 ac'>"+td_tubers[1]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[2]+"</td><td class='p-3 ac'>"+td_SPT[2]+"</td><td class='p-3 ac'>"+td_TUX[2]+"</td><td class='p-3 ac'>"+y2+"</td><td class='p-3 ac'>"+td_tubers[2]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[3]+"</td><td class='p-3 ac'>"+td_SPT[3]+"</td><td class='p-3 ac'>"+td_TUX[3]+"</td><td class='p-3 ac'>"+y3+"</td><td class='p-3 ac'>"+td_tubers[3]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[4]+"</td><td class='p-3 ac'>"+td_SPT[4]+"</td><td class='p-3 ac'>"+td_TUX[4]+"</td><td class='p-3 ac'>"+y4+"</td><td class='p-3 ac'>"+td_tubers[4]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[5]+"</td><td class='p-3 ac'>"+td_SPT[5]+"</td><td class='p-3 ac'>"+td_TUX[5]+"</td><td class='p-3 ac'>"+y5+"</td><td class='p-3 ac'>"+td_tubers[5]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[6]+"</td><td class='p-3 ac'>"+td_SPT[6]+"</td><td class='p-3 ac'>"+td_TUX[6]+"</td><td class='p-3 ac'>"+y6+"</td><td class='p-3 ac'>"+td_tubers[6]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[7]+"</td><td class='p-3 ac'>"+td_SPT[7]+"</td><td class='p-3 ac'>"+td_TUX[7]+"</td><td class='p-3 ac'>"+y7+"</td><td class='p-3 ac'>"+td_tubers[7]+"</td></tr>";
                                    siz1 += 5;siz2 += 5;
                                    td_html += "<tr><td class='td_dark'>"+siz1+"x"+siz2+"</td><td class='p-3 ac'>"+td_SYH[8]+"</td><td class='p-3 ac'>"+td_SPT[8]+"</td><td class='p-3 ac'>"+td_TUX[8]+"</td><td class='p-3 ac'>"+y8+"</td><td class='p-3 ac'>"+td_tubers[8]+"</td></tr>";
                                    
                                    td_html += "<tr><td class='td_red'>["+gro_six_arr[0]+"]</td><td class='td_dark ac'>"+td_SYH35+"</td><td class='td_dark ac'>"+td_SPT35+"</td><td class='td_dark ac'>"+td_TUX[9]+"</td><td class='td_dark ac'>"+td_Ytot+"</td><td class='p-3 ac'></td></tr>";
                                    td_html += "<tr><td class='td_red'>Est Yield</td><td class='td_red ac'>"+td_SYHtot+"</td></tr>";
                                    td_html += "<tr><td class='td_red'>Boxes est.</td><td class='td_red ac'>"+td_BX+"</td></tr>";
                                    td_html += "</table></td></tr>";
                                    
                                    $('#ltd_table').append(td_html).enhanceWithin();
                                    
								}else if(idx=='isp_comments'){									
									inspec_html_coms="</tr><tr><td colspan='4' class='p-3'><h4 class='mt-1 mb-0'>Comments</h4><span style='font-size:1.2em'><strong>"+itm+"</strong></span></td></tr>";   
								}else if(idx=='Inspector'){
                                    $("#isp_by_name").html(itm);
                                }else if(ins_ignore.includes(idx)){
                                    ///ignore
                                }else{
                                    idx_orig = idx;
                                    /**/
                                    
                                    idx_clean = idx.replace("isp_", "");
                                    idxindex = defectlist_all.indexOf(idx_clean);
                                    
                                    enditm = itm;
                              
                                    if(normalidx.includes(idx_clean)){
                                        enditm = itm;
                                        //consol e.log('idx_clean',idx_clean);
                                    }else if(idx_clean=='soil'){
                                        enditm = arr_soil[itm];
                                    }else if(idx_clean=='endrigs'){
                                        enditm = arr_endrigs[itm];
                                    }else if(idx_clean=='ftypo'){
                                        enditm = arr_ftypo[itm];
                                    }else if(idx_clean=='hollows'){
                                        enditm = arr_hollows[itm];
                                    }else if(idx_clean=='stones'){
                                        enditm = arr_stones[itm];
                                    }else if(idx_clean=='pylons'){
                                        enditm = arr_pylons[itm];
                                    }else if(idx_clean=='freedrain'){
                                        enditm = arr_freedrain[itm];
                                    }else if(idx_clean=='trees'){
                                        enditm = arr_trees[itm];
                                    }else if(idx_clean=='blight'){
                                        enditm = arr_blight[itm];
                                    }else if(idx_clean=='storetype'){
                                        enditm = arr_instnces_store[itm];
                                    }else if(idx_clean=='market'){
                                       enditm = arr_instnces_market[itm]; 
                                    }else if(idx_clean=='storability'){
                                       enditm = arr_instnces_storeability[itm]; 
                                    }else if(idx_clean=='GrowStage2' || idx_clean=='GrowStage1'){
                                       enditm = arr_gro_min_state[itm]; 
                                    }else{
                                        enditm = arr_instnces[itm];
                                    }
                                    
                                    
                                    wetrack =1;//default is show item
                                    //isp_netting//isp_brightness
                                    if(idxindex>=0){
                                        idx=defectnames_all_mini[idxindex];
                                        //if it is in main list, and we also track this!
                                        wetrack = insp_list_track_items.indexOf(idx_clean);//insp_list
                                        //consol e.log(idxindex, defectnames_all_mini[idxindex]);
                                    }
                                    
                                    
									if(idx=='isp_score'){idx='C/Rate';}
									if(idx=='isp_freedrain'){idx='F/Drain';}
									if(idx=='isp_vari'){idx='Vari\'s';}
									if(idx=='Inspector'){idx='By';}
									if(idx=='isp_blackleg'){idx='B\'leg';}
                                    if(idx=='GrowStage1'){idx='Grow S1';}
                                    if(idx=='GrowStage2'){idx='Grow S2';}
                                    if(idx=='StemCount'){idx='Stem #';}
                    
                                        
									if(incnt==1 || incnt % 2 == 1){
										if(incnt>2){inspec_html+="</tr>";}
										inspec_html+="<tr>";
									}
                                    if(wetrack>=0){
									   inspec_html+="<td class='td_dark' title='"+idx_orig+"'>"+idx+"</td><td class='pl-1 bold flowhide'>"+enditm+"</td>";
                                        incnt++; 
                                    }
									
								}
                                
                                
                                
							});
						      inspec_html+=inspec_html_coms; 
                        
                            //consol e.log('core: insp_list: ',insp_list);
                        
							
							$('#crop_inspections_table').append(inspec_html).enhanceWithin();
							

					}
					

				}

			},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Mmmmm crop did not load fully....');}
			});
		}else{
			$('#no_live_data').show();
		}
		/////////////////////////////////////////
	
	
	

	
	
		$("#footer").show();
		$("#crop_edit_foot").delay(500).fadeIn(500);
	
	
		if($('#dress_id').val()>0){
			load_dress();   
		}else{
            
			$.mobile.changePage( "#page_crop_details", { transition: "flip"});
            gotop('page_crop_details');
		}
		
		//$("#page_crop_details .dump").html(dataItems);//

}



function get_inspection_notes_from_server(xgid){

    
    ///delete all!
	//delcurrddats_ = delete_from_store_where('podat_inspection_ notes', 'myuid', '0');///only kill the ones that have not been added or updated
        $.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":xgid, "x": "_1%&$*$£632hs6881", "gn": "getnotes"}, url: mobSysURL+"dig_mobxxx/db_get_last_inspection.php", success: function(data){

			//consol e.log('get_inspection_notes_from_server',data);
			if(data=='404'){				

				//aler t('Sorry, no connection to tha t merchant [i]');///this means we connected, but the user is not authenticated any more...I think!!!
				$.mobile.changePage( "#page_index");
				$('#status_bot').html('No connection to merchant [i]');
				$('#auth_form').show();	

			}else{
                
                /*
                create_db = evt.currentTarget.result.createObjectStore('podat_inspection_ notes', { keyPath: 'id', autoIncrement: true });
		          colarr = ["merc_id", "myuid", "gid", "id", "note_date", "note_ desc", "note_state", "add_by_user", "synckey"]; 
                */
                
                //
				rz = data.rez;

				if(rz && rz.length>0 && rz[0]!='0'){
					for(var z=0; z<rz.length; z++){	
						thiscrid = rz[z];
						if(thiscrid['note_date']!=undefined){
                           
                            ///okay, do not insert if it ex ists!
                            //get_row_by_val(s_name, the_obj, the_val, gotofun='', the_obj2=0, the_val2=0, actionarray=''){
                            there_yes = get_row_by_val('podat_inspection_notes', 'innid', thiscrid['id'], 'podat_inspection_there', 0, 0, thiscrid);//

						}
					}	
				}
                
                setTimeout(fill_inspection_notes, 1000);
                
                
			}
				
		},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Plan Notes Error');}
		});   
    
    
}

function podat_inspection_there(rz, thiscrid=''){
   
    if(rz==-1 && thiscrid!=''){
        
        //consol e.log('do note insert!', thiscrid);
        
      
        note_date = clean_quotes(thiscrid['note_date']);
        note_desc = clean_quotes(thiscrid['note_desc']);
        note_state = clean_quotes(thiscrid['note_state']);
        add_by_user = clean_quotes(thiscrid['add_by_user']);
        var obj = {merc_id: merch_id, innid: thiscrid['id'], myuid:'NEW', gid: thiscrid['crop_id'], note_date: note_date, note_desc: note_desc, note_state: note_state, add_by_user: add_by_user, synckey: userkey};
        docall = go_insert_('podat_inspection_notes', obj);
       
        
        
    }
    
 
    
    
}

function fill_inspection_notes(){    
    //get_row_by_val('podat_inspection_ notes', 'gid', igid, 'build_inspection_notes_table');
    
    $('#crop_inspection_notes_table tr').remove();
    
    //consol e. log("addCrop Row Args:", arguments);
	var retval = [];//assume success
	var req;
	var store = getObjectStore('podat_inspection_notes', 'readonly');	
	var c_len = 0;	
	req = store.count();
	
	req.onsuccess = function(evt) {
		c_len = evt.target.result;
			
			if(c_len>0){	
				store.openCursor().onsuccess = function(e) {
				var cursor = e.target.result;		
				if (cursor) {
					trow = cursor.value;
					if(trow.merc_id==merch_id && trow.gid==igid){						
						retval.push(trow);
					}
					cursor.continue();									
				}else{
					//aler_t(JSON.stringify(retval));
					build_inspection_notes_table(retval);
				}
			}
			}else{
				//$("#welcome x").show();
			}	
	};
  
}


var pnstatearray  = ['Suggested','Confirmed','Actioned','Cancelled'];

function build_inspection_notes_table(noterows){
    
    $("#notexdate").val('');
    $("#notepdesc").val('');
    $("#notestate").val(0);
    $("#note_innid").val(0);
    $("#note_myuid").val('');
    
    /**/
   // consol e.log('fill_ inspection_notes all rows', noterows);
    ///clear the table

    if(noterows.length==0){
        $('#crop_inspection_notes_table').append('<tr><td colspan="4" class="p-1">No Notes Yet....</td></tr>');    
    }else{
        
        $('#crop_inspection_notes_table').append('<tr><td class="td_dark">User</td><td class="td_dark">Date</td><td class="td_dark">State</td><td class="td_dark ac">Edit</td></tr>');     
        for(z=0;z<noterows.length;z++){
            pnr = noterows[z];
            
            fd = new Date(pnr.note_date);
            fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
            
            
            $('#crop_inspection_notes_table').append('<tr><td class="td_grey dark">'+pnr.add_by_user+'</td><td class="td_grey dark">'+fds+'</td><td class="td_grey dark">'+pnstatearray[pnr.note_state]+'</td><td class="td_grey ac"><span class="ui-btn-icon-notext ui-icon-edit" style="position:relative;" onClick="edit_in_note('+pnr.innid+',\''+pnr.myuid+'\');" style="margin: 0 auto;" /></td></tr>'); 
            $('#crop_inspection_notes_table').append('<tr><td colspan="4" class="p-1">'+pnr.note_desc+'</td></tr>');
        }

    }

  
}


function edit_in_note(innd, myuid){
    
    
    if(innd>0){// && myuid=='EXISTS'
        //load existing for edit!
        get_row_by_val('podat_inspection_notes', 'innid', innd, 'load_edit_in_note');//    
    }else{
        //load new one for edit!
        get_row_by_val('podat_inspection_notes', 'myuid', myuid, 'load_edit_in_note');//  
    }
       
    
    
}

function load_edit_in_note(rz){
    
    //consol e.log('load_edit_in_note', rz.note_date, rz.note_desc,rz);
    
   
        note_date = clean_quotes(rz.note_date);
        note_desc = clean_quotes(rz.note_desc);
    
        $("#notexdatex").text(note_date);
        $("#notexdate").val(note_date);
        $("#notepdesc").val(note_desc);

        $("#notestate").val(rz.note_state).change();
        $("#note_innid").val(rz.innid);
        $("#note_myuid").val(rz.myuid);
    
   


    load_inspect_crop();
}

function save_and_complete_inspect_notes(){

		

		if($("#notexdate").val()=='' || $("#notexdate").val().length!=10){
			alert('Check your date value. Try resetting it.');	   
		}else if(isNaN($("#notestate").val())){
			alert('Check your Status value. Try resetting it.');	   
		}else if($("#notepdesc").val()=='' || $("#notepdesc").val().length<2){
			alert('Check your Plan Note value.');	   
		}else{
		
		
            //$("#myuid").val(randstr);
            //colarr = ["merc_id", "myuid", "gid", "id", "note_date", "note_desc", "note_state", "add_by_user", "synckey"]; 
            ///INSERT NEW
            randstr = rand_str(24);			
            note_date = clean_quotes($("#notexdate").val());
            note_desc = clean_quotes($("#notepdesc").val());
            note_state = clean_quotes($("#notestate").val());
            note_innid = $("#note_innid").val();
            note_myuid = $("#note_myuid").val();
            
            if(note_state==4){
                //delete
                if(note_innid==0 && note_myuid.length>8){
                    delcurrddats_ = delete_from_store_where('podat_inspection_notes', 'myuid', note_myuid); 
                }else if(note_innid>0){
                    ///update the vaue to DELETE!
                    //set_val_by_(s_name, the_gid, the_item=0, the_val=0, the_item2=0, the_val2=0)
                    set_val_by_('podat_inspection_notes', igid, 'note_desc', 'DELETE!', 'innid', note_innid);
                    set_val_by_('podat_inspection_notes', igid, 'myuid', 'UPDATEME', 'innid', note_innid);
                }
                alert('Inspection Plan Note deleted');
            }else if(note_innid>0){
                //update!
                set_val_by_('podat_inspection_notes', igid, 'note_date', note_date, 'innid', note_innid);
                set_val_by_('podat_inspection_notes', igid, 'note_desc', note_desc, 'innid', note_innid);
                set_val_by_('podat_inspection_notes', igid, 'note_state', note_state, 'innid', note_innid);
                set_val_by_('podat_inspection_notes', igid, 'myuid', 'UPDATEME', 'innid', note_innid);
                alert('Inspection Plan Note updated');
            }else{
                var obj = {merc_id: merch_id, myuid:randstr, gid:igid, innid:0, note_date:note_date, note_desc:note_desc, note_state:note_state, add_by_user:username, synckey:userkey};	
                docall = go_insert_('podat_inspection_notes', obj);

                alert('Inspection Plan Note added');
            }
            
            
            


            fill_inspection_notes();
            
		}
		
		

}











function fill_crop_misc(rz){
		
	if(rz==-1){
		//var cival = 0;	 
	}else{
			
	
	
		rzval = rz.save_value;
		sv_arr = rzval.split("|");
		//ale rt(JSON.stringify(sv_arr));
		
		crprat = sv_arr[4];		
		if(crprat=='0.0'){crprat=0;}
		strrat = sv_arr[5];		
		if(strrat=='0.0'){strrat=0;}

		$("#cd_crrate").html(crprat);//	
		$("#CropRating").val(crprat).change();
		$("#the_crop_rating").val(crprat).change();
		$("#cd_StoreRating").html(strrat);//	
		$("#the_store_rating").val(strrat).change();
	
		
        bd = sv_arr[1];
		$("#cd_burnd").html('N/A');	
		if(bd!='' && bd){			
			if(bd.length==10){
				$("#the_plant_date").val(bd);
				fd = new Date(bd);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_plantd").html(fds);
				$("#pdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
			}
		}else{
			$("#the_plant_date").val('');
		}
        
        
		bd = sv_arr[1];
		$("#cd_burnd").html('N/A');	
		if(bd!='' && bd){			
			if(bd.length==10){
				$("#the_burn_date").val(bd);
				fd = new Date(bd);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_burnd").html(fds);
				$("#bdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
			}
		}else{
			$("#the_burn_date").val('');
		}
	
	
	
		hd = sv_arr[2];
		$("#cd_harvestd").html('N/A');
		if(hd!='' && hd){
			if(hd.length==10){
				$("#the_harvest_date").val(hd);
				fd = new Date(hd);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_harvestd").html(fds);//hd.toDateString()
				$("#hdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
			}
		}else{$("#the_harvest_date").val('');}
        
        
        
        
        xd = sv_arr[3];
		$("#cd_herbd").html('N/A');
		if(xd!='' && xd){
			if(xd.length==10){
				$("#the_herb_date").val(xd);
				fd = new Date(xd);
				fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
				$("#cd_herbd").html(fds);//xd.toDateString()
				$("#brd").html(': <span class="peagreen">'+dd(fd)+'</span>');
			}
		}else{$("#the_herb_date").val('');}
        
        
        
	}

}




function save_the_dates(){	
	$('.dts_saved_div').hide();	
	if (confirm('Are you sure you want to save this crop?')) {
		//podat_misc_saves "merc_id", "misc_type", "gid", "save_value", "synckey"
		///clear out ex isting
		delcurrddats_ = delete_from_store_where('podat_misc_saves', 'gid', igid, 'misc_type', 'CDATES');///delete all where the merc_id is the current active merc_id
		///add record
		send_var = 'CDATES|'+$("#the_plant_date").val()+'|'+$("#the_burn_date").val()+'|'+$("#the_harvest_date").val()+'|'+$("#the_herb_date").val()+'|'+$("#the_crop_rating").val()+'|'+$("#the_store_rating").val()+'|'+$("#vertices").val();  //include the vertices
		//consol e.log('save_the_dates: ',send_var);		
		var obj = {merc_id: merch_id, misc_type: 'CDATES', gid: igid, save_value: send_var, synckey: userkey};	
		docall = go_insert_('podat_misc_saves', obj);
        
        
        //set the new date values to the html bits
        
        xd = $("#the_plant_date").val();
        if(xd.length==10){
            fd = new Date(xd);
            fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
            $("#cd_plantd").html(fds);
            $("#pdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
        }
        
        xd = $("#the_burn_date").val();
        if(xd.length==10){
            fd = new Date(xd);
            fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
            $("#cd_burnd").html(fds);
            $("#bdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
        }
        
        
        xd = $("#the_harvest_date").val();
        if(xd.length==10){
            fd = new Date(xd);
            fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
            $("#cd_harvestd").html(fds);
            $("#hdd").html(': <span class="peagreen">'+dd(fd)+'</span>');
        }
        xd = $("#the_herb_date").val();
        if(xd.length==10){
            fd = new Date(xd);
            fds = fd.toLocaleString('en-En',{weekday: "narrow", month: "short", day: "numeric"});
            $("#cd_herbd").html(fds);
            $("#brd").html(': <span class="peagreen">'+dd(fd)+'</span>');
        }
        /////////////////////////////////////////////
        
        set_val_by_('podat_crops', igid, 'LatLong', $("#vertices").val());
		
		set_active_crop_(igid, 1, -1);
		$('.dts_saved_div').show();	
	}
}

























function load_crop_map(){
	//db.transaction(function(tx){tx.executeSql("DELETE FROM podat_ inspections WHERE myuid='NEW'",[],successCallBack, errorHandler);},errorHandler,successCallBack);
	if(!isNaN(igid) && igid>0){
		$.mobile.changePage( "#page_cmap", { transition: "flip"});
		gotop('page_cmap');
	}else{
		alert('No Crop Selected'); 
		$.mobile.changePage( "#page_cmap", { transition: "flip"});
	}
}




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///INSPECT CROP
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function load_inspect_crop(){
	//db.transaction(function(tx){tx.executeSql("DELETE FROM podat_ inspections WHERE myuid='NEW'",[],successCallBack, errorHandler);},errorHandler,successCallBack);
	if(!isNaN(igid) && igid>0){
		$("#allowflysave").val('0');
		$.mobile.changePage( "#page_crop_inspection", { transition: "flip"});
		gotop('page_crop_inspection');
		clear_inspect_form();			
		///cool, check and see if there are any active inspections for this crop
		//db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_ inspections WHERE gid="+$("#igid").val()+" AND synckey='"+userkey+"'",[],fill_with_ inspection,errorHandler);},errorHandler,successCallBack);
	}else{
		alert('No Crop Selected for Inspection'); 
		$.mobile.changePage( "#page_crops", { transition: "flip"});
	}
}

$('#div_ins_notes_selector').hide();

function get_inspect_notes_selector(rz){	
    
    insp_common_html_list = [];
	issqlstr = '';	
    $('#div_ins_notes_selector').hide();
    //consol e.log('inspec selector REZ: ', rz);
	if(rz==-1){
        
        
        $('#common_notes_table').html('');
        if(rz.insp_common_list !=null){
            inspcommon_list = JSON.parse(rz.insp_common_list);
            if(inspcommon_list.length>=1){
                $.each(inspcommon_list, function(idx, itm) { 
                    if(itm.note_is_common==1){
                        
                    }else{
                        insp_common_html_list.push(itm);
                    }
                });
            }
            build_inspect_notes_selector();
        }    
  
	}

}

function build_inspect_notes_selector(){	
    if(insp_common_html_list.length>1){
        //$('#div_ins_notes_selector').html('');
        //consol e.log('build_inspect SEL REZ:', insp_common_html_list);
        $('#div_ins_notes_items').html();
        div_ins_notes_items = '';
        //<div class="ins_notes_item rounded" id="cdiv_1" data-innrow="1">
        incnt = 1;
        $.each(insp_common_html_list, function(idx, itm) { 
            div_ins_notes_items+='<div class="ins_notes_item rounded" id="cdiv_'+incnt+'" data-innrow="'+incnt+'">'+itm.note_desc+' <a class="ins_changeme_go btn btn-danger float-right ml-3 mr-0">GO</a></div>';
            incnt++;
        });
        //consol e.log('div_ins_notes_items HTML:', div_ins_notes_items);
        $('#div_ins_notes_items').html(div_ins_notes_items);
        $('#div_ins_notes_selector').show();
    }
}



function clear_inspect_form(){
	//aler_t('cif');
	$("#inspect_form select").each(function() {		
		idx = $(this).attr("id");
        $(this).val(-1).change();
	});
    
    $("#GrowStage1").val(0).change();
    $("#GrowStage2").val(0).change();
    

	$('#inspect_form input[type="number"]').each(function() {
		$(this).val(0);
		//aler_t($(this).attr('id'));
	});

	$('#isp_comments').val('');
	//$('#isp_date').val('');//***
    $('#isp_date').val(todayDate).change();
    $('#isp_score').val(2.5).change();
    $('#isp_waste').val(5).change();
    
    $('#notexdate').val(todayDate).change();
	set_button_high();
	
	//build the listy thing insp_ common_ html _list
    if(insp_common_html_list.length<2){
        get_row_by_val('podat_user', 'aid', aid, 'get_inspect_notes_selector');
    }else{
        //consol e.log('insp_common_html_list REZ: ', insp_common_html_list);
        build_inspect_notes_selector();
    }
	
	get_row_by_val('podat_inspections', 'gid', igid, 'fill_with_inspection');
	

}

$('body').on('click', '#ins_field_tog', function() {
    $("#ins_field_div").toggle(); 
});
$('body').on('click', '#fieldtopo_field_tog', function() {
    $("#fieldtopo_field_div").toggle(); 
});
$('body').on('click', '#growstage_field_tog', function() {
    $("#growstage_field_div").toggle(); 
});
$('body').on('click', '#samp_def_tog', function() {
    $("#samp_def_div").toggle(); 
});

 


var use_isp_data = {};

function fill_with_inspection(rz){	

	issqlstr = '';
	$('#inspect_warn').hide();

    
                 
    
    v_isp_data = {};
    use_isp_data = {};
    //consol e.log('fill_with_inspection', rz);//, last_inspect_rs
	if(rz==-1){
		///create and prefil the inspection with existing!
        //
		if(last_inspect_rs!='' && last_inspect_rs.Inspector!=undefined){
			///pre set the values to the ones from existing inspection
			//consol e.log('last_inspect_rs', last_inspect_rs);
            last_inspect_rs['isp_date'] = todayDate;            
            
            v_isp_data = last_inspect_rs;
            
            $('#isp_date').val(todayDate).change();
            
		}else{
            $('#isp_date').val(todayDate).change();
        }
        
  
        v_isp_data.myuid = 'NEW';
        v_isp_data.gid = igid;
        v_isp_data.merc_id = merch_id;
        v_isp_data.synckey = userkey;

        //colarr = ["merc_id", "myuid", "gid", "isp_date", "isp_data", "synckey"];
        var obj = {merc_id: merch_id, myuid:'NEW', gid:igid, isp_date:todayDate, isp_data: v_isp_data, synckey:userkey};
        docall = go_insert_('podat_inspections', obj);///inserts a blank, or a copy of previous for editing and eventual saving
        //$('#isp_soil').val(v_isp_soil).change();
        //consol e.log('v_isp_data', 'v_isp_data:', v_isp_data, 'rz:',rz);
        use_isp_data = v_isp_data;
        
        $("#myuid").val('NEW');
        $("#igid").val(igid);
        
	}else{
        //save data so user can prefill!
        use_isp_data = rz.isp_data;
        $("#myuid").val(rz.myuid);
        $("#igid").val(igid);
        //
    }
    
    //$('#isp_score').val(last_inspect_rs['isp_score']).change();
    //$('#isp_waste').val(last_inspect_rs['isp_waste']).change();

    
    
    if($("#the_harvest_date").val().length==10){
        $("#ins_field_div").hide(); 
    }
    

    $("#load_prev_insp_vals_div").show();
	
	$("#allowflysave").val('1');
}


$(document).on('click','#load_prev_insp_vals',function(){ 
    $("#allowflysave").val('0');
     fill_the_inspection_record();
});


function fill_the_inspection_record(){	
    
    //consol e.log('load use_isp_data', use_isp_data);
    
    $.each(use_isp_data, function(idx, itm) {

        newval = $('#'+idx+' > option:contains("'+itm+'")').val();
        //consol e.log('SET INS Field  ',idx, itm, newval);
        if(newval && (idx!='GrowStage1' && idx!='GrowStage2')){
            itm = newval;  
        }	

        $('#'+idx).val(itm).change();   

        if(idx=='myuid' && itm!='NEW' && itm!='ACTIVE'){
           $('#inspect_warn').show();
        }
    }); 
    $("#allowflysave").val('1');
    $("#load_prev_insp_vals_div").hide();
}



$(document).on('change','#inspect_form select, #inspect_form input, #inspect_form textarea',function(){ 


    //["merc_id", "myuid", "gid", "isp_date", "isp_ data", "synckey"];

	if($("#allowflysave").val()=='1' && igid>0){
		this_field = $(this).attr('id');
		this_val = $(this).val();
        has_cls = $(this).hasClass("inote_input_cls");
        
        
		if(has_cls || this_field=='notexdate' || this_field=='notepdesc' || this_field=='notestate' || this_field=='myuid'){
			//exclude the plan fields!! ffs
            //consol e.log('fly 2',this_field);
		}else{
            //aler_t('this_field '+this_field+' / this_val '+this_val);

            if(this_field=='isp_comments' || this_field=='isp_date' || this_field=='rec_cust_list'){
                //consol e.log('cc1: ',this_val);
                this_val = clean_quotes(this_val);
                //consol e.log('cc2: ',this_val);
                //this_val = "'"+this_val+"'";			
            }else{
                this_val = parseFloat(this_val);
            }
            
            
            if(this_field=='isp_date'){
                set_val_by_('podat_inspections', igid, this_field, this_val);  
            }
            
            
            use_isp_data[this_field] = this_val;
            //set the new value
            
            console.log('podat_inspection save:', igid, 'isp_data', use_isp_data);
            
            
            set_val_by_('podat_inspections', igid, 'isp_data', use_isp_data);
            
            
            
            

            
            //set crop to active
            set_active_crop_(igid, -1, 1);
        }

	}




});


var theINitem = '';
/*
$(document).on('keydown', function(e){
    //consol e.log(e.which);//metaKey
    consol e.log(e);//metaKey
    $('#keyxxx').val(e.key); 
    <input type="text" value="X" style="color: #ff0000; width: 40px;" id="keyxxx">
});*/

$(document).on('keydown','.inote_input_clsxxx',function(e){
    //53 is the number next buttn... maybe!
    // || e.which == 53
    if(e.which == 13 || e.which == 9) {
        theINitem = $(this);
        ins_changeme_go_action();
    }else{
        theINitem = '';
    }    
}); 

$(document).on('blur','.inote_gosavexxx',function(e){

        theINitem = $(this);
        ins_changeme_go_action();
        
}); 
var touchnow = false;
$(document).on('click','.ins_changeme_go',function(){ 
    if(!touchnow){
        touchnow = true;
        theINitem = $(this);
        ins_changeme_go_action();
    }
}); 

function ins_changeme_go_action(){
    parent_targ = theINitem.parent().data('innrow');
    
    form_val = $('#cnx_'+parent_targ).val();
    p1 = $('#cnx_'+parent_targ).data('p1');
    p2 = $('#cnx_'+parent_targ).data('p2');
    if(p1=='Tuber size:'){
        form_val += ' > '+$('#cnx_6b').val();   
    }
    
    
    
    if(form_val.trim()!=''){
        isp_comments = $('#isp_comments').val();
        newrow = p1+' '+form_val+''+p2;
        if(isp_comments!=''){
            endsetval = isp_comments+" | "+newrow;   
        }else{
            endsetval = newrow; 
        }
        $('#cdiv_'+parent_targ).fadeOut();
        $('#isp_comments').val(endsetval).change();
        //consol e.log(parent_targ, form_val, p1, p2);   
    }
    //consol e.log('isp coms now: ', $('#isp_comments').val());
    touchnow = false;
}









function save_and_complete_inspection(){
	if (confirm('Are you sure you want to save and complete? This will end this inspection, and sync with DIG when possible.')) {
		
		

        //, , , , 
		if($("#isp_date").val()=='' || $("#isp_date").val().length!=10){
			alert('Check your date value. Try resetting it.');	   
		}else if(isNaN($("#isp_score").val())){
			alert('Check your CROP RATING value. Try resetting it.');	   
		}else if(isNaN($("#isp_waste").val()) || $("#isp_waste").val()<0 || $("#isp_waste").val()>80){
			alert('Check your Grade Waste value. Try resetting it.');	   
		}else{
		
		
		
			randstr = rand_str(24);
			$("#myuid").val(randstr);
			//db.transaction(function(tx){tx.executeSql("UPDATE podat_ inspections SET myuid='"+randstr+"' WHERE gid="+igid+" AND myuid='ACTIVE' AND synckey='"+userkey+"'",[],sac_inspection_done,errorHandler);},errorHandler,successCallBack);
			set_val_by_('podat_inspections', igid, 'myuid', randstr);
			
			window.history.back();

		}
		
		
		
	} else {
		alert('Okay... Continuing Inspection');
	}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///END
















/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///PRE BURN!!
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function save_and_complete_preburn(){
	delcurrddats_ = delete_from_store_where('podat_pre_burn', 'gid', igid);///pre delete matching crop
	
	if (confirm('Are you sure you want to save and complete? This will end this Pre Burn Dig, and sync with DIG when possible.')) {
			randstr = rand_str(24);
			//podat_pre_burn (burn_myuid TEXT, gid INTEGER NOT NULL, size_results TEXT, pre_burn_comments TEXT, synckey TEXT)
			pb_sizes_tmp = $("#preb_t1").val()+','+$("#preb_w1").val()+'|'+$("#preb_t2").val()+','+$("#preb_w2").val()+'|'+$("#preb_t3").val()+','+$("#preb_w3").val()+'|'+$("#preb_t4").val()+','+$("#preb_w4").val()+'|'+$("#preb_l").val()+','+$("#preb_w").val()+','+$("#preb_stems").val();
			pb_sizes = clean_quotes(pb_sizes_tmp);
			pb_comms = clean_quotes($("#preb_note").val());
			pb_date = clean_quotes($("#preb_date").val());
			var obj = {merc_id: merch_id, burn_myuid:randstr, gid:igid, preb_date:pb_date, size_results:pb_sizes, pre_burn_comments:pb_comms, synckey:userkey};	
			docall = go_insert_('podat_pre_burn', obj);
			
			sac_preburndig_done();
			

	} else {
		//aler_t('Continuing Inspection');
	}
}

function clear_preburn_form(){
	///clear pre burn
	$("#preb_t1").val('');
	$("#preb_w1").val('');
	$("#preb_t2").val('');
	$("#preb_w2").val('');
	$("#preb_t3").val('');
	$("#preb_w3").val('');
	$("#preb_t4").val('');
	$("#preb_w4").val('');
	$("#preb_note").val('');
    $("#preb_date").val('');
    $("#preb_stems").val('');
    
}

function fill_preburn_form(rz){
	if(rz==-1){	
		$('#preburn_warn').hide();			
	}else{
		$('#preburn_warn').show();	
		//we have an existing PB, fill it... 
		
		$('#preb_note').val(rz.pre_burn_comments).change();
		sr = rz.size_results.split('|');
        
        $('#preb_date').val(rz.preb_date).change();
		
		sx = sr[0].split(',');
		$('#preb_t1').val(sx[0]);
		$('#preb_w1').val(sx[1]);
		
		sx = sr[1].split(',');
		$('#preb_t2').val(sx[0]);
		$('#preb_w2').val(sx[1]);
		
		sx = sr[2].split(',');
		$('#preb_t3').val(sx[0]);
		$('#preb_w3').val(sx[1]);
		
		sx = sr[3].split(',');
		$('#preb_t4').val(sx[0]);
		$('#preb_w4').val(sx[1]);
	
	}	
}

function sac_preburndig_done(){
	clear_preburn_form();
	window.history.back();		
}








/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///TEST DIG
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function load_test_dig(){
	$("#dig_allowflysave").val('0');
	clear_dig_form();
	clear_preburn_form();
	
	
	
	if(!isNaN(igid) && igid>0){// && remote_ type==1		
		
		$.mobile.changePage( "#page_test_dig", { transition: "flip"});		
		set_button_high();
		get_row_by_val('podat_testdigs', 'gid', igid, 'fill_test_dig_form');
		get_row_by_val('podat_pre_burn', 'gid', igid, 'fill_preburn_form');	
	}else{
		alert('No Crop Selected for TD');   
	}
}



function clear_dig_form(){	

	$("#td_score").val(2.5);
	$("#td_disease").val('');
	$("#td_pest").val('');
	$("#td_coments").val('');

	$("#td_date").val('');

	for(dg=1; dg<5; dg++){
		dr = 1;
		for(d=0; d<8; d++){
			fld = 'dx_d'+dg+'_'+dr;
			//tuber#						
			$('#'+fld+'_n').val('');
			//tuber kg
			$('#'+fld+'_w').val('');
			dr++;
		}	
	}
	
}



function fill_test_dig_form(rz){	
	
	$('#testdig_warn').hide();
	//merc_id dig_myuid TEXT, gid INTEGER NOT NULL, td_date TEXT NOT NULL, td_area NUMERIC NOT NULL, td_area2 NUMERIC NOT NULL, td_wastage_ratio INTEGER NOT NULL, CropRating NUMERIC NOT NULL, td_score NUMERIC NOT NULL, td_disease TEXT, td_pest TEXT, td_coments TEXT, dig_1 TEXT, dig_2 TEXT, dig_3 TEXT, dig_4 TEXT

	$('#td_stems1').val(0).change();
    $('#td_stems2').val(0).change();
    $('#td_stems3').val(0).change();
    $('#td_stems4').val(0).change();
    
    $('#td_plants1').val(0).change();
    $('#td_plants2').val(0).change();
    $('#td_plants3').val(0).change();
    $('#td_plants4').val(0).change();
    
    
	if(rz==-1){

		
		//db.transaction(function(tx){tx.executeSql("INSERT INTO podat_testdigs (
		//di g_myuid, gid, td_date, td_area, td_area2, td_wastage_ratio, CropRating, td_score, td_disease, td_pest, td_coments, dig_1, dig_2, dig_3, dig_4, synckey
		//'NEW', "+igid+", '', 2, 0.925, 5, "+$("#CropRating").val()+", 0, '', '', '', '', '', '', '', '"+userkey
		
		var obj = {merc_id: merch_id, dig_myuid:'NEW', gid:igid, td_date:'', td_area:2, td_area2:0.925, td_stems:'', td_plants:'', td_wastage_ratio:5, CropRating:$("#CropRating").val(), td_score:0, td_disease:'', td_pest:'', td_coments:'', dig_1:'', dig_2:'', dig_3:'', dig_4:'', synckey:userkey};	
		docall = go_insert_('podat_testdigs', obj);
		
	

		$('#dig_myuid').val('NEW').change();
		
		$('#td_area').val(1).change();
		$('#td_area2').val(0.925).change();
        
		$('#td_score').val(0).change();
		
		
		
		
	}else{
		$('#td_stems1').val(0);	
		//we have an existing TD, fill it... 
		$.each(rz, function(idx, itm) {

			if(idx!='dig_1' && idx!='dig_2' && idx!='dig_3' && idx!='dig_4' && idx!='td_stems' && idx!='td_plants'){
				///normal fields
				$('#'+idx).val(itm).change();
				if(idx=='dig_myuid' && itm!='NEW' && itm!='ACTIVE'){
				   $('#testdig_warn').show();
				}
			}else{
                
                if(idx=='td_stems'){
                    darr = itm.split(',');
                    dr = 1;
                    for(d=0; d<4; d++){
                        $('#td_stems'+dr).val(darr[d]).change();
                        dr++;
                    }
                }else if(idx=='td_plants'){
                    darr = itm.split(',');
                    dr = 1;
                    for(d=0; d<4; d++){
                        $('#td_plants'+dr).val(darr[d]).change();
                        dr++;
                    }
                }
                else{
                
                
                            ///break up the value into array and assign				
                            if(idx=='dig_1'){dg=1;}else if(idx=='dig_2'){dg=2;}else if(idx=='dig_3'){dg=3;}else{dg=4;}
                            darr = itm.split(',');
                            //aler_t(darr.length);
                            if(darr.length>5){
                                ///okay,. do the loop here
                               //	aler_t('DO dig '+dg+'::'+itm);

                                dr = 1;
                                dib = 0;
                                for(d=0; d<8; d++){
                                    fld = 'dx_d'+dg+'_'+dr;
                                    //tuber#						
                                    $('#'+fld+'_n').val(darr[dib]);
                                    //tuber kg
                                    $('#'+fld+'_w').val(darr[(dib+1)]);
                                    dr++;
                                    dib+=2;
                                }



                            }else{
                                //aler_t('dig '+dg+' skipped');
                            } 
                }
				/**/
			}
			
		});

	}
	
	
	
	

	
	$("#dig_allowflysave").val('1');
}




///update every change in TD FORM
$(document).on('change','#test_dig_form input, #test_dig_form textarea, #test_dig_form select',function(){ 


	if($("#dig_allowflysave").val()=='1'){
		this_field = $(this).attr('id');
		this_val = $(this).val();		
		
			//if(this_field!='confirm_ crop'){
                    
					if(this_field=='td_disease' || this_field=='td_pest' || this_field=='td_coments' || this_field=='td_date'){
						this_val = clean_quotes(this_val);		
					}else if(this_field=='td_stems1' || this_field=='td_stems2' || this_field=='td_stems3' || this_field=='td_stems4'){
						this_field = 'td_stems';
                        this_val = $("#td_stems1").val();
                        if($("#td_stems2").val()!='' && $("#td_stems2").val()>0){this_val +=','+$("#td_stems2").val();}
                        if($("#td_stems3").val()!='' && $("#td_stems3").val()>0){this_val +=','+$("#td_stems3").val();}
                        if($("#td_stems4").val()!='' && $("#td_stems4").val()>0){this_val +=','+$("#td_stems4").val();}
                        
					}else if(this_field=='td_plants1' || this_field=='td_plants2' || this_field=='td_plants3' || this_field=='td_plants4'){
						this_field = 'td_plants';
                        this_val = $("#td_plants1").val();
                        if($("#td_plants2").val()!='' && $("#td_plants2").val()>0){this_val +=','+$("#td_plants2").val();}
                        if($("#td_plants3").val()!='' && $("#td_plants3").val()>0){this_val +=','+$("#td_plants3").val();}
                        if($("#td_plants4").val()!='' && $("#td_plants4").val()>0){this_val +=','+$("#td_plants4").val();}
                        
					}else if(this_field.includes('dx_')){			
						///loop and get all vals abd add to list
						darr = this_field.split('_');
						dignum = darr[1][1];//e.g:d4///we need the number
						this_field = 'dig_'+dignum;
						dig_list = '';		
						this_val = '';

						darr_list = [];
						for(d=1; d<9; d++){
							//tuber#
							fld = 'dx_d'+dignum+'_'+d+'_n';
							vvv = $('#'+fld).val();
							//if(isNaN(vvv) || vvv<-1){vvv = '';}
							darr_list.push(vvv);

							//tuber kg
							fld = 'dx_d'+dignum+'_'+d+'_w';
							vvv = $('#'+fld).val();
							//if(isNaN(vvv) || v<-1){vvv = '';}
							darr_list.push(vvv);

						}
						this_val = darr_list.join();

					}else{
						this_val = parseFloat(this_val);
						$("#"+this_field).val(this_val);//reset in case its a bad number
					}
					//aler_t('this_field '+this_field+' / this_val '+this_val);
					//set the new value
					set_val_by_('podat_testdigs', igid, this_field, this_val);
					//set active
					set_val_by_('podat_testdigs', igid, 'dig_myuid', 'ACTIVE');
					//set crop to active
					set_active_crop_(igid, -1, 1);



			//}///exclude confirm_ crop
	}
});










function save_and_complete_testdig(){
	if (confirm('Are you sure you want to save and complete? This will end this Test Dig, and sync with DIG when possible.')) {
        randstr = rand_str(24);
        set_val_by_('podat_testdigs', igid, 'dig_myuid', randstr);
        window.history.back();
        /*
        if($("#confirm_ crop").val()==$("#dig_cropshouldbe").val()){		
			
			//aler_t(randstr);
			//$("#dig_myuid").val(randstr);
			//db.transaction(function(tx){tx.executeSql("UPDATE podat_testdigs SET dig_myuid='"+randstr+"' WHERE gid="+this_  gid+" AND dig_myuid='ACTIVE' AND synckey='"+userkey+"'",[],sac_testdig_done,errorHandler);},errorHandler,successCallBack);
		}else{
			alert('Please confirm the correct Crop Number. This looks incorrect.');
		}*/
        
	}else{
		//aler_t('Continuing Test DIg');
	}
}

















/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///BOX COUNT
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function load_box_count(){
	
	active_page = $.mobile.pageContainer.pagecontainer( 'getActivePage' ).attr( 'id' );
	
	if(active_page!='page_box_count'){///only load again if need be
			$('#bc_date').val('');
			$('#bc_new').val('');
			$('#bc_wastage_ratio').val('5');
            $('#bx_size_new').val('');
            $('#bx_size_newb').val('');
            $('#bx_note_new').val('');
            $('#bx_note_newb').val('');
            $('#bx_tubs_new').val('0');
            $('#bx_tubs_newb').val('0');
        
            $('#bx_type_new').val('0').change();
            $('#bx_type_newb').val('0').change();
        
        
			if(!isNaN(igid) && igid>0){
				$("#box_allowflysave").val('0');
				$.mobile.changePage( "#page_box_count", { transition: "flip"});					
				set_button_high();
				get_row_by_val('podat_boxcounts', 'gid', igid, 'fill_boxcount_form');

			}else{
				alert('No Crop Selected For BX Cnt');   
			}
	}
}


function fill_boxcount_form(rz){	
	
	$('#boxcount_warn').hide();
	
	if(rz==-1){
		//var cival = 0;
		//create blank cBC RECORD
		$('#box_myuid').val('NEW').change();
		var obj = {merc_id: merch_id, box_myuid:'NEW', gid:igid, bc_date:'', bc_new:0, bc_wastage_ratio:5, synckey:userkey};	
		docall = go_insert_('podat_boxcounts', obj);
		
		
	}else{

		//we have an existing inspection 
		$.each(rz, function(idx, itm) {

			$('#'+idx).val(itm).change();
			if(idx=='box_myuid' && itm!='NEW' && itm!='ACTIVE'){
			   $('#boxcount_warn').show();
			}
			
		});

	}


	$("#submit_splits").hide();
	$("#box_allowflysave").val('1');
	///okay, swing by and get the current live box spreads
	if(navigator.onLine){//remote_ type==1 && 
		//only for admin app
		get_box_count_splits();
	}
	
	
	
}




function get_box_count_splits(){
    
	$('#split_table tr').remove();
    

    
    
	$("#bx_size_0_safe").val(0);		
    //

    
    //consol e.log('db_get_bx_splits gid:',$("#igid").val(), igid);
    if($("#igid").val()=='' && igid!='' && igid>0){$("#igid").val(igid);}
    
    
		$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "cc":$("#igid").val(), "x": "_33s&$*$%ND673nsn%"}, url: mobSysURL+"dig_mobxxx/db_get_bx_splits.php", success: function(data){
			rz = data.rez;
			$("#submit_splits").show();
			console.log('db_get_ bx_splits',rz);

		
			if(rz.length>0 && rz[0]!='0'){

                    if(rz[0]['OBX']!='' && rz[0]['OBX']>0){
                        $("#Harvest_Box_Count").hide();
                        $(".gradeinventbits").show();    
                    }else{
                        $("#Harvest_Box_Count").show();
                        $(".gradeinventbits").hide();
                        console.log('hide invent!');
                    }
                
					maxn = $("#current_bc").html();
					$("#bx_size_0_safe").val(maxn);
                
                    if(rz[0]['NEWBX']!=''){
                        //do we have a new NEWBX - update the crop record
                        $("#current_bc").html(rz[0]['NEWBX']);//
                        $("#bx_txt").html(rz[0]['NEWBX']);
                        $("#cd_BoxCount").html(rz[0]['NEWBX']);
                        //ale rt(rz[0]['NEWBX']);
                        set_val_by_('podat_crops', $("#igid").val(), 'BoxCount', rz[0]['NEWBX']);
                    }
                
                
					
					for(var z=0; z<rz.length; z++){	
						this_bsp = rz[z];
						//alerxt(this_bsp['bx_size_1']);
						s1 = this_bsp['bx_size_1'];
						s2 = this_bsp['bx_size_2'];
						stt = this_bsp['bx_total'];
                        stub = this_bsp['tp50kg'];
                        bxbrk_type = this_bsp['bx_brk_type'];
                        bx_note = this_bsp['bx_note'];
                        
                        zx = z+'x';
                        
                        
						
						split_tit = '';
						if(s1==0){
							boxnote_var = 'boxnote_0';
							split_var = 'bx_size_0';
                            split_type_var = '';
                            split_bits = '0';
                            tubs_var = 'bx_tub_0';
							split_tit = 'As Dug';
						}else{
                            
                            split_tit = s1+'x'+s2;
                            split_var = 'bxsizeup_'+s1+'_'+s2;
                            split_type_var = 'bxsizetype_'+s1+'_'+s2;
                            tubs_var = 'bxtubsup_'+s1+'_'+s2;
                            boxnote_var = 'boxnote_'+s1+'_'+s2; 
                            split_bits = s1+'_'+s2;
                            
                            if(bxbrk_type==1){
                                split_tit=split_tit+' <span class="white">[Plant-back]</span>';
                            }else if(bxbrk_type==2){
                                 split_tit=split_tit+' <span class="white">[Stock Feed]</span>';    
                            }else if(bxbrk_type==3){
                                 split_tit=split_tit+' <span class="white">[Dumped]</span>';    
                            }
						}
                        
                        
                        
                        if(split_var=='bx_size_0'){
                            //hide from AsDug
                            thistr ="<tr><td class='pt-0'><h2 class='mb-0 pt-2 pb-0 peagreen'>"+split_tit+" Tns</h2></td><td class='pt-0'></td></tr>";
                        }else{
                            thistr ="<tr><td class='pt-0'><h2 class='mb-0 pt-2 pb-0 peagreen'>"+split_tit+": Tns</h2></td><td class='pt-0'><h2 class='mb-0 pt-2 pb-0 peagreen'>Tubs/50kg</h2></td></tr>";  
                        }    
						
                        
                        if(split_var=='bx_size_0'){
                            //hide from AsDug
                            thistr +="<tr><td class='pt-0'><input type='number' min='0' max='"+maxn+"' step='0.005' name='"+split_var+"' id='"+split_var+"' value='"+stt+"' autocomplete='dasdz423423'></td>";
                            thistr +="<td class='pt-0'><input type='hidden' name='"+tubs_var+"' id='"+tubs_var+"' value='"+stub+"'></td>";
                        }else{
                            thistr +="<tr><td class='pt-0'><input type='number' min='0' max='"+maxn+"' step='0.005' name='"+split_var+"' id='"+split_var+"_"+zx+"' data-bits='"+split_bits+"_"+zx+"' data-killbits='_"+zx+"' value='"+stt+"' autocomplete='dasdz423423'></td>";
                            thistr +="<td class='pt-0'><input type='number' min='0' max='5000' step='1' name='"+tubs_var+"' id='"+tubs_var+"_"+zx+"' value='"+stub+"' autocomplete='dasdz423423'></td>";   
                        }
                        thistr +="</tr>";
                        if(s1>0){
                            thistr +="<tr><td class='pt-0 pl-0' colspan='2'><select name='"+split_type_var+"' id='"+split_type_var+"_"+zx+"'><option value='0'"+(bxbrk_type==0?' selected':'')+">Split</option><option value='1'"+(bxbrk_type==1?' selected':'')+">P/back</option><option value='2'"+(bxbrk_type==2?' selected':'')+">S/Feed</option><option value='3'"+(bxbrk_type==3?' selected':'')+">Dump</option></select></td></tr>";
                        }
                        
                        if(split_var=='bx_size_0'){
                            //AD!
                            thistr +="<tr><td class='pt-0 pl-0' colspan='2'><input type='text' name='"+boxnote_var+"' id='"+boxnote_var+"' value='"+bx_note+"' placeholder='Comments' autocomplete='dasdz423423' style='width: 100%; background:#bbbb99; color:#5a5a4f;'></td></tr>";
                        }else{
                            thistr +="<tr><td class='pt-0 pl-0' colspan='2'><input type='text' name='"+boxnote_var+"' id='"+boxnote_var+"_"+zx+"' value='"+bx_note+"' placeholder='Comments' autocomplete='dasdz423423' style='width: 100%; background:#bbbb99; color:#5a5a4f;'></td></tr>";   
                        }
                        
                        
                        thistr +="<tr><td class='pt-0 pl-0' colspan='2'><br></td></tr>";
                        
                        $('#split_table').append(thistr);
						//process_dress_row_now(thiscrid, z, rz.length);						
					}	
					 $('#split_table').trigger('create');

			}else{			

                    $("#Harvest_Box_Count").show();
                    $(".gradeinventbits").hide();
                    console.log('hide invent!');
                   
			}

		},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Splits Error');}
		});

}







	///update every change in inspect form
	$(document).on('change','#box_count_form input',function(){ 
		this_field = $(this).attr('id');					
		if($("#box_allowflysave").val()=='1'){
			this_field = $(this).attr('id');
			this_val = $(this).val();
			if(this_field=='bc_date'){
				this_val = clean_quotes(this_val);
				this_val = this_val;			
			}else{
				this_val = parseFloat(this_val);
				$("#"+this_field).val(this_val);//reset in case its a bad number
			}
			
			//ale rt(igid+' / '+this_field+' / '+this_val);
			
			//sqlstr = "UPDATE podat_boxcounts SET box_myuid='ACTIVE', "+this_field+"="+this_val+" WHERE gid="+igid+" AND synckey='"+userkey+"'";
			//db.transaction(function(tx){tx.executeSql(sqlstr,[],successCallBack,errorHandler);},errorHandler,successCallBack);
			
			set_val_by_('podat_boxcounts', igid, this_field, this_val);
			
			
			
			//set active
			set_val_by_('podat_boxcounts', igid, 'box_myuid', 'ACTIVE');
			//set crop to active
			set_active_crop_(igid, -1, 1);
			if($("#box_myuid").val()!='NEW' && $("#box_myuid").val()!='ACTIVE'){
			alert('You have changed a submitted boxcount, before it has been synced. Please Complete and Submit again when ready.');
			}
			
		}
	});


////////////////////////////////////////////////////////////////////////////////////









function save_and_complete_box_splits(){
	
	

		nex_bx_tot = 0;
		//podat_misc_saves (misc_type TEXT, gid INTEGER NOT NULL, save_value TEXT, synckey TEXT)
		///clear out existing
		delcurrddats_ = delete_from_store_where('podat_misc_saves', 'gid', igid, 'misc_type', 'BSPLIT');
		
        //NEW:25x30:2:Split note|bxsizeup_0:0.000:Aaaaaa|bxsizeup_35_55:0.000:Bbbbbbb|bxsizeup_pb_35_55:-25:Plant-back|end
		///add record		
		send_var = '';

        if(!isNaN($("#bx_size_new").val()) && $("#new_siz_1").val()<$("#new_siz_2").val() && $("#bx_size_new").val()!=0){
            send_var = 'NEW:'+$("#new_siz_1").val()+'x'+$("#new_siz_2").val()+':'+$("#bx_size_new").val()+':'+$("#bx_note_new").val()+':'+$("#bx_tubs_new").val()+':'+$("#bx_type_new").val()+'|';
            nex_bx_tot += parseFloat($("#bx_size_new").val());
        }
        if(!isNaN($("#bx_size_newb").val()) && $("#new_siz_1b").val()<$("#new_siz_2b").val() && $("#bx_size_newb").val()!=0){
            send_var += 'NEW:'+$("#new_siz_1b").val()+'x'+$("#new_siz_2b").val()+':'+$("#bx_size_newb").val()+':'+$("#bx_note_newb").val()+':'+$("#bx_tubs_newb").val()+':'+$("#bx_type_newb").val()+'|';
            nex_bx_tot += parseFloat($("#bx_size_newb").val());
        }

        ///add the AS DUG
    
        send_var += 'bxsizeup_0:'+$("#bx_size_0").val()+':'+$("#boxnote_0").val()+':'+$("#bx_tub_0").val()+'|';
        nex_bx_tot += parseFloat($("#bx_size_0").val());

		$("#split_table input").each(function() {
            //only do the bxsizeup_ [and _pb]
            fnom = $(this).attr("id");
			fval = $(this).val();
            
            
            
			if(fnom.includes('bxsizeup_')){
                idbits = $(this).data("bits");
                kill_bit = $(this).data("killbits");
                //remove fnom //killbits
                fnom = fnom.replace(kill_bit, "");
                ///////////////
                tbval = 0;

                if($('#bxtubsup_'+idbits)){
                    tbval = $('#bxtubsup_'+idbits).val();
                }
               
                /////////////
                nttval = '';                
                if($('#boxnote_'+idbits)){
                    nttval = $('#boxnote_'+idbits).val();
                }
                
                bttype = 0;
                //split_type_var = 'bxsizetype_'+s1+'_'+s2;
                if($('#bxsizetype_'+idbits)){
                    bttype = $('#bxsizetype_'+idbits).val();
                }
                
           
                send_var += fnom+':'+fval+':'+nttval+':'+tbval+':'+bttype+'|';
                
                ///get the note!
                console.log('split_table row', fnom, fval, 'bits: ',idbits);
                //console.log('send_var: ', send_var);
                
                
                if(fval>0){nex_bx_tot += parseFloat(fval);}
            }
			 				
		});
		send_var += 'end'; 
    
    
        console.log('SEND VAR: ',send_var);
    
    
        /**/
        $("#current_bc").html(nex_bx_tot);//
        $("#bx_txt").html(nex_bx_tot);
        $("#cd_BoxCount").html(nex_bx_tot);
        set_val_by_('podat_crops', igid, 'BoxCount', nex_bx_tot);
    

		//callfunk("INSERT INTO podat_misc_saves (misc_type, gid, save_value, synckey) VALUES ('BSPLIT',"+$("#igid").val()+",'"+send_var+"','"+userkey+"')",'');		
		var obj = {merc_id: merch_id, misc_type: 'BSPLIT', gid: igid, save_value: send_var, synckey: userkey};	
		docall = go_insert_('podat_misc_saves', obj);
		set_active_crop_(igid, -1, 1);
		
		if(navigator.onLine){
			alert('Box splits saved successfully. Remember to sync later.');

		}else{
			alert('Saved, but no connection. Remember to sync later.');
		}
	   
		
		
	//}
}




function save_and_complete_boxcount(){
	if (confirm('Are you sure you want to save and complete? This will end this Box Count, and sync with DIG when possible.')) {
			
			randstr = rand_str(24);
			$("#box_myuid").val(randstr);
			set_val_by_('podat_boxcounts', igid, 'box_myuid', randstr);
			window.history.back();	

	} else {
		//alerxt('Continuing Inspection');
	}
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///END








/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///DRESSING RETURN
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function load_dress(drsid=0){
	$("#dress_allowflysave").val('0');
	//aler_t($('#dress_id').val());
	if((!isNaN(igid) && igid>0) || drsid>0){
        if(drsid>0){$(".page_crop_head_h1").html("Gradings: <span class='green'>Trade</span>");}
        // drsid>0 - this is a trade, with no matchin crop...
        di_row = get_row_by_val('podat_dressings', 'id', $('#dress_id').val(), 'fill_dress_form', 'gid', igid);

	}else{
		alert('No Crop Selected for Grading');   
	}
}


function fill_dress_form(rz){	

	
	$('#dress_warn').hide();
    

	if(rz==-1){
		alert('No waiting grading requests found');		
		
	}else{

		//we have an existing inspection 
		$.each(rz, function(idx, itm) {

			$('#'+idx).val(itm).change();
			if(idx=='box_myuid' && itm!='NEW' && itm!='ACTIVE'){
			   $('#boxcount_warn').show();
			}
			
		});
		
		//consol e.log('fill_dress_form',rz); 
		//we have an existing dress 
		
		if((rz.dress_myuid!='NEW' && rz.dress_myuid!='ACTIVE')){
			///switch off  && rz.farmer_ready==0
			//$('#submit_dress').hide();
			//$('#dress_warn').show();
		}
		
		$('#dress_id').val(rz.id);
		$('#dress_gid').val(rz.gid);
		$('#dress_myuid').val(rz.dress_myuid);
        
        $('#boxes_used').val(rz.boxes_used);
        $('#boxes_waste').val(rz.boxes_waste);
		
		$('#dress_form #var_type_grade_country').html(rz.var_type_grade_country+' <span class="red">['+rz.CropNo+']</span>');
		$('#dress_form #amt').html(rz.amt+'t');
		$('#amt_req_num').val(rz.amt);///used for final compare
		
		
		$('#dress_form #size_name').html(rz.size_name);
        
		//$('#chem_at').val(rz.chem_at).change();
		//$('#store_at').val(rz.store_at).change();
        
		$('#inspection_date').val(rz.inspection_date);
        
        $('#ton1').val(0);$('#ton2').val(0);$('#ton3').val(0);$('#ton4').val(0);
        $('#tub1').val(0);$('#tub2').val(0);$('#tub3').val(0);$('#tub4').val(0);
        
        dix = 1;
        $.each(rz.tons_and_tubs, function(idx, itm) {
            //consol e.log('tons_and_tubs', idx, itm);
            $('#ton'+dix).val(itm.tons);
            $('#tub'+dix).val(itm.tubs);
            dix++;
        });


        
		$('#diff_chemical').val(rz.diff_chemical);

		
		$('#farmer_ready').val(rz.farmer_ready).change();
		$('#notes_after_dress').val(rz.notes_after_dress);
		$('#got_labels').val(rz.got_labels).change();
        $('#Despatch_Ref').val(rz.Despatch_Ref);
        $('#Vehicle_Reg').val(rz.Vehicle_Reg);
        $('#part_grade_tns').val(rz.part_grade_tns);

        if(rz.di_status>3){
            $('#di_h1').text('Despatch');
            $('#dress_2').show();
            $('#dress_1').hide();
            $('#dress_form #drs_by_date').html('<strong class="red">Despatch:</strong> '+rz.pickup_date);   
        }else{
            $('#di_h1').text('Grading Instruction');
            $('#dress_1').show();
            $('#dress_2').hide();
            $('#dress_form #drs_by_date').html('<span class="white">Dress By:</span> <strong>'+rz.drs_by_date+'</strong>'); 
        }
        
        if(rz.OID==0){
            //open dressing
            $('#dress_open').show();
            $('#dress_open_labels').hide();
        }else{
            $('#dress_open').hide();
            $('#dress_open_labels').show();
        }
        
		
		siz_arr = rz.size_name.split("x");
		
        if(rz.size_name=='UG'){
            $('#size_1 .table_head h4').html('Ungraded');   
        }else{
            $('#size_1 .table_head h4').html(siz_arr[0]+'x'+siz_arr[1]);   
        }
		
		
		if(siz_arr.length>=3){
			$('#size_2 .table_head h4').html(siz_arr[1]+'x'+siz_arr[2]);
			$('#size_2').show();
		}else{
			$('#size_2').hide();
			$('#ton2').val(0);
		}
		
		if(siz_arr.length>=4){
			$('#size_3 .table_head h4').html(siz_arr[2]+'x'+siz_arr[3]);
			$('#size_3').show();
		}else{
			$('#size_3').hide();
			$('#ton3').val(0);
		}
        
        if(siz_arr.length>=5){
			$('#size_4 .table_head h4').html(siz_arr[3]+'x'+siz_arr[4]);
			$('#size_4').show();
		}else{
			$('#size_4').hide();
			$('#ton4').val(0);
		}
        
        

		$("#dress_allowflysave").val('1');
		
		$.mobile.changePage( "#page_dress", { transition: "flip"});
		set_button_high();
		
		

	}


	
	
	

	
	
}



///update every change in inspect form
$(document).on('change','#dress_form input, #dress_form select, #dress_form textarea',function(){ 

	if($("#dress_allowflysave").val()=='1'){
		this_field = $(this).attr('id');
		this_val = $(this).val();
        
        tonsandtubs = [{tons: 0, tubs: 0}, {tons: 0, tubs: 0}, {tons: 0, tubs: 0}, {tons: 0, tubs: 0}];

		if(this_field=='inspection_date' || this_field=='notes_after_dress' || this_field=='diff_chemical' || this_field=='Despatch_Ref' || this_field=='Vehicle_Reg'){
			this_val = clean_quotes(this_val);			
		}else if(this_field=='ton1' || this_field=='ton2' || this_field=='ton3' || this_field=='ton4' || this_field=='tub1' || this_field=='tub2' || this_field=='tub3' || this_field=='tub4'){
            
			this_val = parseFloat($("#ton1").val());
            if(isNaN(this_val)){this_val=0;}
            $("#ton1").val(this_val);
			tonsandtubs[0].tons = this_val;
            
            this_val = parseFloat($("#ton2").val());if(isNaN(this_val)){this_val=0;}
            $("#ton2").val(this_val);
			tonsandtubs[1].tons = this_val;
            
            this_val = parseFloat($("#ton3").val());if(isNaN(this_val)){this_val=0;}
            $("#ton3").val(this_val);
			tonsandtubs[2].tons = this_val;
            
            this_val = parseFloat($("#ton4").val());if(isNaN(this_val)){this_val=0;}
            $("#ton4").val(this_val);
			tonsandtubs[3].tons = this_val;
            
            this_val = parseFloat($("#tub1").val());if(isNaN(this_val)){this_val=0;}
            $("#tub1").val(this_val);
			tonsandtubs[0].tubs = this_val;
            
            this_val = parseFloat($("#tub2").val());if(isNaN(this_val)){this_val=0;}
            $("#tub2").val(this_val);
			tonsandtubs[1].tubs = this_val;
            
            this_val = parseFloat($("#tub3").val());if(isNaN(this_val)){this_val=0;}
            $("#tub3").val(this_val);
			tonsandtubs[2].tubs = this_val;
            
            this_val = parseFloat($("#tub4").val());if(isNaN(this_val)){this_val=0;}
            $("#tub4").val(this_val);
			tonsandtubs[3].tubs = this_val;

            
            //consol e.log('tonsandtubs',tonsandtubs);
            
            this_field = 'tons_and_tubs';
            this_val = tonsandtubs;
            //tons_and_tubs = [{tons: thiscrid['dr_tonnage_1'], tubs: thiscrid['dr_tubc_1']}, {tons: thiscrid['dr_tonnage_2'], tubs: thiscrid['dr_tubc_2']}, {tons: thiscrid['dr_tonnage_3'], tubs: thiscrid['dr_tubc_3']}, {tons: thiscrid['dr_tonnage_4'], tubs: thiscrid['dr_tubc_4']}];
            
		}else{
			this_val = parseFloat(this_val);
			$("#"+this_field).val(this_val);//reset in case its a bad number
		}

		
		set_val_by_('podat_dressings', igid, this_field, this_val, 'id', $('#dress_id').val());
		//set active
		set_val_by_('podat_dressings', igid, 'dress_myuid', 'ACTIVE', 'id', $('#dress_id').val());

		//sqlstr = "UPDATE podat_ dressings SET dress_myuid='ACTIVE', "+this_field+"="+this_val+" WHERE id="+this_gid+" AND synckey='"+userkey+"'";
		//db.transaction(function(tx){tx.executeSql(sqlstr,[],successCallBack,errorHandler);},errorHandler,successCallBack);

	}
});



function save_and_complete_dressing(){
	//if (confirm('Are you sure you want to save and complete this dressing? This will end this Dressing, and sync with DIG when possible.')) {
			
            partgradetns = $("#part_grade_tns").val();    
            reqtns = $("#amt_req_num").val();
    
            if(partgradetns>0){reqtns = partgradetns;}
    
			tontote = parseFloat($("#ton1").val())+parseFloat($("#ton2").val())+parseFloat($("#ton3").val())+parseFloat($("#ton4").val());
			amt_req_num = parseFloat((reqtns*0.8));
			//aler_t(tontote+' / '+amt_req_num);
		
			totalbu = 0; //$("#boxes_ used").val()+$("#boxes_ usedg").val()$("#inspection_date").val()=='' || 
		
			if($("#ton1").val()==0 || tontote<amt_req_num){
                // || $("#boxes_remain").val()=='' || totalbu==0 || totalbu==''
                if(tontote<amt_req_num){
				    alert('Check your entries. If your Tonnage ['+tontote+'t] is 80% lower than expected ['+reqtns+'t], contact the merchant to confirm and adjust the requirment to complete the Grading.');
                }else{
                    alert('Check your entries. We need Inspection Date, Spread Tonnage(s). If your Tonnage is low, contact the merchant to adjust the Grading requirment.');
                }
			}else{
				randstr = rand_str(24);
				$("#dress_myuid").val(randstr);
				//aler_t($('#dress_id').val());
				alert('Grading/Despatch Saved. Remember to Sync when ready.');
				set_val_by_('podat_dressings', igid, 'dress_myuid', randstr, 'id', $('#dress_id').val());
				window.history.back();	
			}
	
	//} else {
		//alerxt('Continuing Inspection');
	//}
}














/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///PHOTO PISH
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	const player = document.getElementById('player');
	const canvas = document.getElementById('canvas');
	const context = canvas.getContext('2d');
	const captureButton = document.getElementById('captureButton');
    const captureClose = document.getElementById('captureClose');
	const constraints = {video: {facingMode: 'environment'}, audio: false};
	//was video:true{ deviceId: { exact: value.deviceId } }
	var cam_list = [];
	var cam_list_now = 0;
	var cam_list_cnt = 0;
	const setcam = document.getElementById('setcam');
	//const camlist = document.getElementById('camlist');
	let currentStream;



	

	player.style.width = document.width + 'px';
	player.style.height = document.height + 'px';
	player.setAttribute('autoplay', '');
	player.setAttribute('muted', '');
	player.setAttribute('playsinline', '');


	var p_pttype = 0;
	var p_x_id = 0;
    $("#cam_preview_img").hide();
    $("#cam_preview").hide();

    var savedimage = '';

	function capturePhoto(pxtype, px_id=0) {
		p_pttype = pxtype;
        
        /*
        1 - Doc Photo
        2 - Crop Photo
        3 - Dig Photo
        4 - DI Photo
        5 - PP Photo
        */
        $("#cam_canvas").show();
        $("#player").show();
		getLocation();
		//aler_t($("#dress_id").val());

		if(px_id==99){//dressing
			p_x_id = $("#dress_id").val();  
		}else if(px_id==22){//Photo Document from Passport
            p_x_id = view_trade_pid;
            igid = view_trade_id;
        }else{
			p_x_id = 0; 
		}

		
		context.clearRect(0, 0, canvas.width, canvas.height);
		//player.pause();
		//player.removeAttribute('src'); // empty source
		//player.load();
		$("#cam_preview_img").hide();
        $("#cam_preview").hide();
        $("#cam_controls_div").show();
		$("#cameraview").show();
	}


	
	
	
	captureButton.addEventListener('click', () => {
		

		if(player.videoHeight<660){
			h = player.videoHeight*1.4;
			w = player.videoWidth*1.4;  
		}else{
			h = player.videoHeight;
			w = player.videoWidth;
		}
		
		//aler_t(w+'/'+h);
		canvas.height = h;
		canvas.width = w; 
		
		
		// Draw the video frame to the can vas.
		context.drawImage(player, 0, 0, w, h); 
		var dataURL = canvas.toDataURL('image/jpeg');
        
        if(dataURL.length<200){
           alert('Mmmm... not sure that photo worked. Try again.');
        }else{
            idkey = rand_str(14);
            var obj = {merc_id: merch_id, ptid: igid, pttype: p_pttype, photo_uri: 'x', photo_file: dataURL, longlat: locovar, gid: igid, x_id:p_x_id, synckey:userkey, idkey:idkey};
            
            savedimage = idkey;
            docall = go_insert_('podat_photos', obj);
            if(docall!=1){
                alert('Mmmm... that photo did not save. Try again. ER:'+docall); 
                $("#cameraview").hide();
            }else{
            
            }
        }

		

		/*player.srcObject.getVideoTracks().forEach(track => track.stop());*/
        
        //load the photo for confirm!
        
        $("#cam_preview_img").attr("src",dataURL);
        $("#cam_controls_div").hide();
        $("#cam_canvas").hide();
        $("#player").hide();
        
        setTimeout(function() {
            $("#cam_preview_img").show();
            $("#cam_preview").show();
        }, 500);
        
        
        
        
        
		//$("#cameraview").hide();
		//alert('Photo saved. Remember to sync later.');

        if(p_x_id==22){//Photo Document from Passport
            igid = 0;///reset
        }
		
	});

    captureClose.addEventListener('click', () => {
		$("#cameraview").hide();
        savedimage = '';
    });
	
    keepPhotoClose.addEventListener('click', () => {
		$("#cameraview").hide();
        savedimage = '';
    });

    killClose.addEventListener('click', () => {        
		//alert('kill:'+savedimage);
        //delete_from_store_where(s_name, z_column=0, z_val=0, x_column=0, x_val=0);
        delete_from_store_where('podat_photos', 'idkey', savedimage);
        savedimage = '';
        $("#cameraview").hide();
        
    });

	function stopMediaTracks(stream) {
		stream.getTracks().forEach(track => {track.stop();});
		//aler_t('d');
		//player.srcObject.getVideoTracks().forEach(track => track.stop());
	}

	function gotDevices(mediaDevices) {
		//camlist.innerHTML = '';
		//camlist.appendChild(document.createElement('option'));
		let count = 1;
		mediaDevices.forEach(mediaDevice => {
			if (mediaDevice.kind === 'videoinput') {
				//const option = document.createElement('option');
				//option.value = mediaDevice.deviceId;
				//const label = mediaDevice.label || `Camera ${count++}`;
				//const textNode = document.createTextNode(label);
				//option.appendChild(textNode);
				//camlist.appendChild(option);
				cam_list.push(mediaDevice.deviceId);
				cam_list_cnt++;
			}
		});
	}
	
setcam.addEventListener('click', event => {
	//player.srcObject.getVideoTracks().forEach(track => track.play());
	cam_list_now++;
	if(cam_list_now>cam_list_cnt){cam_list_now=0;}
	if (typeof currentStream !== 'undefined') {stopMediaTracks(currentStream);}
	const videoConstraints = {};
	videoConstraints.deviceId = { exact: cam_list[cam_list_now] };
	const constraints = {video: videoConstraints,audio: false};	
	navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	navigator.mediaDevices.getUserMedia(constraints).then(stream => {currentStream = stream;player.srcObject = stream;return navigator.mediaDevices.enumerateDevices();}).then(gotDevices).catch(error => {console.error(error);});
});
	

navigator.mediaDevices.enumerateDevices().then(gotDevices);
	
// Attach the video stream to the video element and autoplay.
//https://developers.google.com/web/fundamentals/media/capturing-images
//https://stackoverflow.com/questions/13198131/how-to-save-an-html5-canv as-as-an-image-on-a-server
//http://j-query.blogspot.com/2011/02/save-base64-encoded-canv as-image-to-png.html
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
navigator.mediaDevices.getUserMedia(constraints).then((stream) => {player.srcObject = stream;});












/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///SYNC
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




var all_SYNC = [];
var syxtype=0;
var syxphotocnt=0;


function do_the_sync(){	
    
    
    
	if(navigator.onLine){
        syxtype=0;
        syxphotocnt=0;
		show_loading();
		//photoSync('0');
		do_the_data_sync();
		$('#constate').html('Online');
		$('#conbad').hide();
	}else{
		$('#constate').html('Offline');
		$('#conbad').show();
	}

}



function do_the_data_sync(){
	
		all_SYNC = [];//clear just in case
    
    
    if(syxtype==1){
            
            
            ///do these 1 at a time!	
		
            var store = getObjectStore('podat_photos', 'readwrite');	
            store.openCursor().onsuccess = function(e) {
                var cursor = e.target.result;
                if(cursor){
                    if (cursor.value.merc_id==merch_id && cursor.value.synckey==userkey) {
                        row = {};
                        row.stype = "PHOTO";
                        row.suser = aid;					
                        row.sgid = cursor.value.gid;
                        row.longlat = cursor.value.longlat;
                        row.pfile = cursor.value.photo_file;
                        row.pttype = cursor.value.pttype;
                        row.x_id = cursor.value.x_id;
                        
                        
                        syxphotocnt++;	
                         $("#loaderh3").html('Syncing Photo '+syxphotocnt);    
                        all_SYNC.push({row});
                        delete_from_store_where('podat_photos', 'idkey', cursor.value.idkey);///remove this photo from consideration
                        setTimeout(go_sync_go_check, 1000);
                        //consol e.log('podat_photos SNC:', all_SYNC);
                        //break;
                    }
		
                }else{
                    
                        //sync is finished!
                        $("#loaderh3").html('Sync Complete');
                        setTimeout(get_live_dressings, 1000);
                        setTimeout(hide_loading, 1000);
                        
                }		
            };

           
           
    }else{
    
	
		////////////////////
		//db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_ inspections WHERE myuid!='NEW' AND myuid!='ACTIVE' AND synckey='"+userkey+"'",[],build_sync_inspect, errorHandler);},errorHandler,successCallBack);
		var store = getObjectStore('podat_inspections', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.merc_id==merch_id && cursor.value.myuid!='NEW' && cursor.value.myuid!='ACTIVE' && cursor.value.synckey==userkey) {
					row = {};
					row.stype = "INSPECT";
					row.suser = aid;
					row.sgid = cursor.value.gid;
					row.sdate = cursor.value.isp_date;
					row.r_id = 0;
                    
                    cursor.value.isp_data.myuid = cursor.value.myuid;
                    cursor.value.isp_data.gid = cursor.value.gid;
                    cursor.value.isp_data.id = cursor.value.id;
                    cursor.value.isp_data.merc_id = cursor.value.merc_id;
                    cursor.value.isp_data.synckey = cursor.value.synckey;
                    
					row.slist = cursor.value.isp_data;
                    
                    //consol e.log('INS ITM: ',row);
                    /*
					$.each(cursor.value, function(idx, itm) {
						//row.slist.push({[idx]:itm});
						row.slist[idx]=itm;
                        consol e.log('INS ITM: ',idx,itm);
					});*/	
					all_SYNC.push({row});
					
				}
				cursor.continue();
			
			}		
		};
	
	    //db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_ inspections WHERE myuid!='NEW' AND myuid!='ACTIVE' AND synckey='"+userkey+"'",[],build_sync_inspect, errorHandler);},errorHandler,successCallBack);
		var store = getObjectStore('podat_inspection_notes', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.merc_id==merch_id && cursor.value.myuid!='NEW' && cursor.value.synckey==userkey) {
					row = {};
					row.stype = "INSPCNOTE";
					row.suser = aid;
					row.sgid = cursor.value.gid;
					row.sdate = cursor.value.note_date;
					row.r_id = 0;
					row.slist = {};

					$.each(cursor.value, function(idx, itm) {
						row.slist[idx]=itm;
					});	
					all_SYNC.push({row});
					
				}
				cursor.continue();
			
			}		
		};   
	
		//podat_misc_saves (misc_type TEXT, gid INTEGER NOT NULL, save_value TEXT, synckey TEXT)
		//db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_misc_saves WHERE synckey='"+userkey+"'",[],build_sync_misc, errorHandler);},errorHandler,successCallBack);
		////////////////////
		var store = getObjectStore('podat_misc_saves', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.merc_id==merch_id && cursor.value.synckey==userkey) {
					row = {};
					row.stype = cursor.value.misc_type;
					row.suser = aid;
					row.sgid = cursor.value.gid;
					row.sdate = '';
					row.r_id = 0;
					row.slist = cursor.value.save_value;
					//aler_t(JSON.stringify({row}));
					all_SYNC.push({row});
				}
				cursor.continue();			
			}		
		};
	
	
		//podat_pre_burn ( burn_myuid TEXT, gid INTEGER NOT NULL, size_results TEXT, pre_burn_comments TEXT, synckey TEXT)	
		//db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_pre_burn WHERE burn_myuid!='NEW' AND synckey='"+userkey+"'",[], build_sync_preburn, errorHandler);},errorHandler,successCallBack);
		var store = getObjectStore('podat_pre_burn', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.merc_id==merch_id && cursor.value.burn_myuid!='NEW' && cursor.value.synckey==userkey) {
					row = {};
					row.stype = "PREBURN";
					row.suser = aid;
					row.sgid = cursor.value.gid;
                    row.sdate = cursor.value.preb_date;
					row.r_id = 0;
					row.slist = {};
					$.each(cursor.value, function(idx, itm) {
						row.slist[idx]=itm;
					});						
					all_SYNC.push({row});						
					
				}
				cursor.continue();			
			}		
		};
	
	
		//di g_myuid, gid, td_date, td_area, td_area2, td_wastage_ratio, CropRating, td_score, td_disease, td_pest, td_coments, dig_1, dig_2, dig_3, dig_4
		//db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_testdigs WHERE dig_myuid!='NEW' AND dig_myuid!='ACTIVE' AND synckey='"+userkey+"'",[],build_sync_testdigs, errorHandler);},errorHandler,successCallBack);
		var store = getObjectStore('podat_testdigs', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.merc_id==merch_id && cursor.value.dig_myuid!='NEW' && cursor.value.dig_myuid!='ACTIVE' && cursor.value.synckey==userkey) {
					row = {};
					row.stype = "TESTDIG";
					row.suser = aid;
					row.sgid = cursor.value.gid;
					row.sdate = cursor.value.td_date;
					row.r_id = 0;
					row.slist = {};

					$.each(cursor.value, function(idx, itm) {
						row.slist[idx]=itm;
					});	


					all_SYNC.push({row});
				}
				cursor.continue();
			
			}		
		};
	
	
		//box_myuid, gid, bc_date, bc_new, bc_wastage_ratio	
		//db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_boxcounts WHERE box_myuid!='NEW' AND box_myuid!='ACTIVE' AND synckey='"+userkey+"'",[],build_sync_boxcounts, errorHandler);},errorHandler,successCallBack);
		var store = getObjectStore('podat_boxcounts', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if(cursor){
				if (cursor.value.merc_id==merch_id && cursor.value.box_myuid!='NEW' && cursor.value.box_myuid!='ACTIVE' && cursor.value.synckey==userkey) {
					row = {};
					row.stype = "BOXCOUNT";
					row.suser = aid;
					row.sgid = cursor.value.gid;
					row.sdate = cursor.value.bc_date;
					row.r_id = 0;
					row.slist = {};
					$.each(cursor.value, function(idx, itm) {
						row.slist[idx]=itm;
					});	
					
					//ale rt(JSON.stringify(row));

					all_SYNC.push({row});
				}
				cursor.continue();			
			}		
		};
		

	
	
	
	
	
		//podat_ dressings (id, dress_myuid, gid, CropNo, CropGrower, var_type_grade_country, drs_by_date, amt, chem_at, store_at, inspection_date, size_name, to n1, to n2, to n3, diff_chemical, boxes_used, boxes_ remain, farmer_ready, notes_after_dress)	
		//db.transaction(function(tx){tx.executeSql("SELECT * FROM podat_ dressings WHERE dress_myuid!='NEW' AND synckey='"+userkey+"'",[],build_sync_dressings, errorHandler);},errorHandler,successCallBack);
		var store = getObjectStore('podat_dressings', 'readwrite');	
		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			//aler_t('drs');
			if(cursor){
				if (cursor.value.merc_id==merch_id && cursor.value.dress_myuid!='NEW' && cursor.value.synckey==userkey) {
					row = {};
					row.stype = "DRESSING";
					row.suser = aid;
					row.sgid = cursor.value.gid;
					row.sdate = cursor.value.drs_by_date;
					row.r_id = cursor.value.id;
					row.slist = {};

					$.each(cursor.value, function(idx, itm) {
						row.slist[idx]=itm;
					});	

					//aler_t(JSON.stringify({row}));
					all_SYNC.push({row});
				}
				cursor.continue();			
			}else{

				setTimeout(go_sync_go_check, 1000);
				
			
			}
            
            
            
            
		};
	
    }
		
	
		
	
		
		
	
	
	
	
}




function go_sync_go_check(){
    //consol e.log('go_sync_go_check', all_SYNC, all_SYNC.length, syxtype);
    
	if(all_SYNC.length>0){
		go_syncgo();
		//setTimeout(go_sync go, 1000);
	}else{
        ///there are no syncs, do the photos!
        if(syxtype==0){
            syxtype=1;///toggle to photos
            setTimeout(do_the_data_sync, 500); // do it again for the photos   
        }

        
	}
}












function go_syncgo(){	
		
		mysync_list = JSON.stringify(all_SYNC);

		
		
	
		$("#error_text").val();
	
	   
	
		var goterror = 0;
		
	
		
	
		$.ajax({type: "POST", dataType: "json", crossDomain: true, cache: false, data:{"pod":userkey, "lst":mysync_list, "x": "_99%&$*$^%$29dksadF"}, url: mobSysURL+"dig_mobxxx/db_save_sync.php", success: function(data){
			
			var rzall = data.rez;
			
			
			
			
			//aler_t(JSON.stringify(rzall))
			
			for (var i=0; i<rzall.length; i++){

				rz = rzall[i];
				lastkey = '';
				item_idx = 0;
				$.each(rz, function(idx, itm) {	
					
					//FROM DB CALL::: array("type" => $j_item['row']['stype'](INSPECT), "myuid" => $j_item['row']['slist']['myuid'], "full" => $j_item['row']);
					
					if(idx=='err'){
						//aler_t(lastkey+' ERROR: Please report this to support: '+itm);
						///dom something better here!
						goterror = 1;
						currer = $("#error_text").val();
						newerr = currer+'ERROR: LK: '+lastkey+' / ER:'+itm+'||end||'
						$("#error_text").val(newerr);
						
					}else if(idx=='myuid'){
						///do the other stuff!						
						dbt='';
						
						if(lastkey=='INSPECT'){
							dbt='podat_inspections';
							muidname='myuid';
						}else if(lastkey=='INSPCNOTE'){
                            //is this used?
							dbt='podat_inspection_notes';
							muidname='myuid';
						}else if(lastkey=='TESTDIG'){
							dbt='podat_testdigs';
							muidname='dig_myuid';
						}else if(lastkey=='BOXCOUNT'){
							dbt='podat_boxcounts';
							muidname='box_myuid';
						}else if(lastkey=='DRESSING'){
							dbt='podat_dressings';
							muidname='dress_myuid';
						}else if(lastkey=='PREBURN'){
							dbt='podat_pre_burn';
							muidname='burn_myuid';
						}
						
						if(dbt!=''){
							if(lastkey=='DRESSING' && itm=='ACTIVE'){
								///skip -  keep the active ones  
							}else{
                                //clear the synced ones
								delcurrddats_ = delete_from_store_where(dbt, muidname, itm, 'synckey', userkey);
							}
							
							/*
							lastkey:BOXCOUNT
							dbt:podat_boxcounts
							muidname:box_myuid=EX5YPW8LR0VOEC9EC40CT72B
							synckey=F3uSgvLXspBmgafX2ADL5s9j15
							*/
							
							
							
							
						}
						//ale rt('lastkey:'+lastkey+' dbt:'+dbt+' muidname:'+muidname+'='+itm+' synckey='+userkey);
						//ale rt('RZ:'+idx+') itm:'+itm+' / '+lastkey+' muidname:'+muidname);
						
					}
					if(idx=='type'){
						lastkey = itm;
					}
					
					
				});
				//alxert('RZa:'+rz);
				
				
			}
            
            
            
            
			
			
			
		},error: function(XMLHttpRequest, textStatus, errorThrown) {ajaxerror('Sync Error');}//XMLHttpRequest.status,XMLHttpRequest.statusText,textStatus,errorThrown,
		});
		

		
	
    
    if(syxtype==0){
        syxtype=1;///toggle to photos
        ///clear out the stragglers
        purg1 = delete_from_store_where('podat_misc_saves', 'synckey', userkey);
        purg2 = delete_from_store_not_where('podat_inspections', 'myuid', 'NEW');       
        purg2b = delete_all_from_store_('podat_inspection_notes');
        purg3 = delete_from_store_where('podat_testdigs', 'dig_myuid', 'NEW');
        purg4 = delete_from_store_where('podat_boxcounts', 'box_myuid', 'NEW');
        

        $("#loaderh3").html('Syncing Photos');

        
    }else{
        
        

        
        //purg5 = delete_from_store_where('podat_photos', 'synckey', userkey);///previous process should do this
        
        
        //

      

    }
	

	//do this will there are no sync photos left
    setTimeout(do_the_data_sync, 1000);

	
}







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
                
                
                /*
              g oogle.m aps.e vent.add Listener(drawingManager, "overlaycomplete", function(event) {
                newShape = event.overlay;
                newShape.type = event.type;
              });*/

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


            

            function load_map(poly_str, cropwords, iamcon=0) {
                //consol e.log('load_map', p_lat,p_long);
                //56.4610883,-3.0520755|56.4611879,-3.0520827|56.4612381,-3.0515727|56.4624951,-3.052249|56.4625707,-3.0523546|56.4625587,-3.0521796|56.4623756 - first mob test
                ///init on page load (second page) use current L&L if we dont have a field poly
                if(iamcon==1){
                    $('#map-canvas-all').show();                    
                    google.maps.event.addListener(window, 'load', initialize(p_lat, p_long, poly_str, cropwords));//was addDomListener
                                
                    
                }else{
                    ///hide the map
                    $('#map-canvas-all').hide();
                }    
            } 







    if(window.matchMedia('(display-mode: standalone)').matches) { 
        ///ignore
        //ale rt('check HS 1');
        $('#status_bot').html('Welcome');
        openDb();
    }else{
        $('#status_bot').html('Welcome');
        openDb();
    } 
    
    sigfile = $("#signature").jSignature({'UndoButton' : true, 'height':'180', 'width':'350'});// 
    //sigfile.find(".jSignature").css("width", "100%");
    sigfile_d = $("#signature_driver").jSignature({'UndoButton' : true, 'height':'180', 'width':'350'});// 
    //sigfile_d.find(".jSignature").css("width", "100%");



