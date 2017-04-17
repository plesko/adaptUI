/* This file contains the definition for the Geo Location IP class
 * See constructor for public and private members
 *
 * Public methods (function properties):
 *   GeoLocationIP() - constructor
 *   execute()
 *
 * Private methods (function properties):
 *   _callback
 *   _setupMarkerEvents
 */

/*
* Constructor
* @param ipsArray (array) - Array of IP addresses (strings)
*
*/
function GeoLocationIP(paramIpsArray, $paramDomToUse) {
	var geoObj = this;

	if (paramIpsArray == null) { //Not using === because we want to check against null AND undefined
		alert("ipsArray parameter null or undefined");
		return;
	}

	//The array of IP addresses - Make copy of them
	geoObj._ipsArray = $.extend(true, [], paramIpsArray);

	geoObj.$domToUse = $paramDomToUse;
	
	geoObj._ipsByCountry = {};

	//Max width of map
	geoObj._maxWidth = geoObj.$domToUse.width() * .75;

	if ($("#geoloc_popup").length != 0) { //Geolocation div exists. Remove it
		$("#geoloc_popup").remove();
	}
	
	var popUpEle = 
		"<div class='modal fade' tabindex='-1' role='dialog' id='geoloc_popup' aria-hidden='true'>" +
  		"<div class='modal-dialog' id='geoloc_modalDialog'>" +
  			"<div class='modal-content'>" +
  				"<div class='modal-header'>" +
        		"<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" +
        		"<h4 class='modal-title'>Geolocations of Unmonitored Hosts</h4>" +
        	"</div>" +
        	"<div class='modal-body' id='geoloc_map'>" +
        	"</div>" +
  			"</div>" +
  		"</div>" +
  	"</div>";
		
	//Append div
	$("body").append(popUpEle);

	//Create busy indicator and attach it to geloc_popup
	geoObj._graphBusyIndicator = new BusyIndicator($("#geoloc_popup"));
} //End of GeoLocationIP function (constructor)

/***************************
* Public Non-Static/Instance methods
****************************/
/*
 * Wrapper to get the geolocation data from the IPs and map them
 */
GeoLocationIP.prototype.execute = function() {
	var geoObj = this;
	//Initial width and height of map
	var mapW = $('#ajax-content').width() * 0.75;
	var mapH = $(window).height() * 0.70;

	if (!g_isBackendConnectedToInternet()) {
		alert("Sorry, but the server must have access to the internet for GeoLocation to work.");
		$("#geoloc_popup").remove();
		return;
	}

	//Set width/height of elements
	$('#geoloc_modalDialog').css("width", mapW);
	$('#geoloc_modalDialog').css("height", mapH);
	$('#geoloc_map').css("height", mapH - $("modal-header").height());
	
	//On geoloc popup close, remove the geoloc_popup element
	$('#geoloc_popup').on('hide.bs.modal', function (e) {
		$('#geoloc_popup').remove();
	})	
	
	geoObj._graphBusyIndicator.start();

	$.cachedScript('https://www.google.com/jsapi').done(function( script, textStatus ) {
//		var otherParams = "sensor=false";
		var otherParams = "";
		if ((g_googleAPIKey != null) && (g_googleAPIKey != "")) { //User has a Google API key to use
			if (otherParams != "") { 
					otherParams += "&";
			}
			otherParams += "api=" + g_googleAPIKey;
		}

		//Call maps api asyncronously
		google.load('maps', '3', { other_params: otherParams, callback: function() {
			//Load infobox js (for map infoboxes)
			$.cachedScript(g_baseURI + "/js/infobox_packed.js").done(function( script, textStatus ) {
				$.cachedScript(g_baseURI + "/view/assets/plugins/progressbarcontrol.js").done(function( script, textStatus ) {
					//Create map and populate with markers
					geoObj._graphBusyIndicator.stop();
					geoObj._callback();
				});
			});
		}});
	});
} //End of GeoLocationIP.prototype.execute function

/***************************
* Private Non-Static/Instance methods
****************************/
/*
 * Callback function for the Google maps api
 */
GeoLocationIP.prototype._callback = function() {
	var geoObj = this;
	var bAtleastOneNode = false;

	//Show Geo Loc pop up
	$('#geoloc_popup').modal({show:true});
	
	//Now we need to 'resize' the map once the popup has been shown, otherwise we can get 'gray' box
	$("#geoloc_popup").on("shown.bs.modal", function() {
		var mapOptions = {
				center: { lat: 30, lng: 0},
		    zoom: 2,
		    minZoom: 1
		};

		var ipMap = new google.maps.Map(document.getElementById('geoloc_map'), mapOptions);
		var progressBar = new ProgressbarControl(ipMap);
		
		//Start progress bar
		progressBar.start(geoObj._ipsArray.length);
		
		//Prevent map zoom when mouse is over an IP list infobox
		$("body").on({
	    mouseenter: function () {
	  		if (ipMap) {
	  			ipMap.setOptions({ scrollwheel: false });
	  		}
	    },
	    mouseleave: function () {
	  		if (ipMap) {
	  			ipMap.setOptions({ scrollwheel: true });
	  		}
	    }
		}, ".infoBox");	
	
		//For each IP, get geolocation information and, if applicable, set up map markers
		geoObj._ipsArray.forEach(function(ip, index) {
			$.ajax({  
		    type: "GET", 
		    dataType: 'json', 
		    url: g_getURLHeader() + '/controller/cAjax.php', 
		    data: {
		    	"action":"geoLocateIPs",
		    	"data": {"ips":[ip]}
		    },
		    success: function(res) { 
		      switch (res.result) {
		        case AJAX_RESULT_OK:
		        	processResult(res.data, index);
		      		if (index == geoObj._ipsArray.length - 1) {
		      			progressBar.setCurrent(geoObj._ipsArray.length);
		      			setTimeout(function() { progressBar.remove(); } , 750);
		      		} else {
		      			progressBar.updateLoader(1);
		      		}
		    			break;
		        case AJAX_RESULT_ERROR: //We don't get this back, but handle just in case 
		          console.log("Geo IP Result error");
		        	break;
		        case AJAX_RESULT_EXCEPTION: //Exception error
		          console.log("Exception error: " + res.thrown);
		          return;
		      } //End of switch
		    },
		    error: function (res, error, thrown) { //Unanticipated error
		        console.log("Unknown server error: " + thrown);
		    }
		  }); //End of ajax call			
		}); //End of this._ipsArray forEach anon function
		
		google.maps.event.addListener(ipMap,"zoom_changed", function() {
			var center = ipMap.getCenter();

			google.maps.event.trigger(ipMap, "resize");
			ipMap.setCenter(center);
		});
		
		//Function to process the Geo Location ajax result
		function processResult(data, index) {
			if ((data.length == 0) || (!data[0].hasOwnProperty("lat")) || (!data[0].hasOwnProperty("lng"))) {
				if ((index == geoObj._ipsArray.length - 1) && (!bAtleastOneNode)) { //This is the last IP, and no IP nodes have been geolocated on the map
					alert("Unmonitored hosts from this set cannot be identified");
					$("#geoloc_popup").modal('hide');
					$('#geoloc_popup').remove();
				}
				return;
			} 
			
			var	ipData = data[0];
			bAtleastOneNode = true;
						
			if (!(ipData["country_iso"] in geoObj._ipsByCountry)) { //This is the first IP of this country
				geoObj._ipsByCountry[ipData["country_iso"]] = [ipData.ip];
				//Create map marker and setup marker events
				//map.setCenter(results[0].geometry.location);
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(ipData.lat, ipData.lng),
					map: ipMap,
					//These next two are to ensure that the marker does not take precedence over infobox ip popoups when the mouse is over both
					optimized: false,
		      zIndex:1
				});
				geoObj._setupMarkerEvents(ipData, marker, ipMap);
			} else { //This is NOT the first IP of this country
				//Add IP to country property array
				geoObj._ipsByCountry[ipData["country_iso"]].push(ipData.ip);
				//Replace IPs in the IP column of the current map marker table with new list of IPs, if the table exists
				//(being shown)
				
				var szDomIPRowCol2 = "#id_geoInfoTable_" + ipData["country_iso"] + " tr:nth-child(2) td:nth-child(2) span";			    						
				if ($(szDomIPRowCol2).length > 0) {
					$(szDomIPRowCol2).text(geoObj._ipsByCountry[ipData["country_iso"]].join(", "));
					var szDomIPRowCol1 = "#id_geoInfoTable_" + ipData["country_iso"] + " tr:nth-child(2) td:nth-child(1) span";
					$(szDomIPRowCol1).text(geoObj._ipsByCountry[ipData["country_iso"]].length);
				}
			} //End of else of (if (!(ipData["country_iso"] in geoObj._ipsByCountry)))
			
			return;
		} //End of function processResult
	}); //End of ($("#geoloc_popup").on("shown.bs.modal", function ())
} //End of GeoLocationIP.prototype._callback function

/**
 * Setup map and map marker events (mouseover, mouseout, etc.)
 * @param geoData (object) - Geolocation data for an IP 
 * @param marker (object) - Google map Marker to use (with geoData property)
 * @param ipMap (object) - Google map to use
 */
GeoLocationIP.prototype._setupMarkerEvents = function(geoData, marker, ipMap) {
	var geoObj = this;
	
	//Create and setup info box forthsi marker
	marker.infobox = new InfoBox();
	setupMarkerInfoBox();

	//Set up mouseover - Show popup of IP info if infobox is not already being shown
	google.maps.event.addListener(marker, 'mouseover', function() {
		if (!marker.infobox.sticky) { //Infobox is not sticky, so we show the infobox
    	if (marker.infobox.mouseTiming == true) { //User moused out of the marker, 
    																						//the timing to close the infobox has not not expired, 
    																						//but the mouse is now over the marker again
    		//Clear the marker infobox close timer
    		clearTimeout(marker.infobox.mousedoutTimer);
    		marker.infobox.mouseTiming == false;
    	}
			
    	if ($("#"+marker.infobox.id).length != 0) { //Info box is already opened, so just return
    		return;
    	}
    	
    	//Recreate the infobox content again (in case we have new IPs from the last time)
			marker.infobox.setContent(createInfoBoxContent(marker.infobox.id));
			marker.infobox.open(ipMap, marker);
			marker.setTitle("Click to make sticky");
		}
	});

	//On mouseout, remove the info window if infobox is not sticky
	google.maps.event.addListener(marker, 'mouseout', function() {
		if (!marker.infobox.sticky) { //Infobox is not sticky, so set a timeout to remove the box 
																	//The timeout will be cancelled if user mouses over the infobox within a timelmit
			marker.infobox.mouseTiming = true;
			marker.infobox.mousedoutTimer = setTimeout(function() {
				marker.infobox.mouseTiming = false;
				//Close info window
				marker.infobox.close();
			}
			, 500);
		}
	});

	//On marker click, close infobox if infobox is sticky. Then toggle infobox sticky property
	google.maps.event.addListener(marker, 'click', function() {
		marker.infobox.close();
		if (marker.infobox.sticky) { //We want to remove the infobox, so leave closed
			marker.infobox.setOptions({ //Remove close button from infobox (won't be seen for popup - just if it becomes sticky)
				closeBoxMargin: "",
				closeBoxURL: ""
			});
			marker.setTitle("Click to make sticky");
		} else { //We want to make the infobox sticky
			//Show close button on infobox
			marker.infobox.setOptions({
				closeBoxMargin: "10px 2px 2px 2px",
				closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
			});
			marker.setTitle("Click to unstick");
		}
		//Open infobox again 
		marker.infobox.open(ipMap, marker);
		marker.infobox.sticky = !marker.infobox.sticky;
	});
	
	/*******************************************
	 * _setupMarkerEvents FUNCTIONS
	 *******************************************/
	//Setup info box for marker
	function setupMarkerInfoBox() {
		marker.infobox.sticky = false;
		marker.infobox.mouseTiming = false;
		marker.infobox.myMarker = marker;
		marker.infobox.id = "id_geoInfoTable_" + geoData["country_iso"];

		var myOptions = {
			content: createInfoBoxContent(marker.infobox.id),
			disableAutoPan: false,
			maxWidth: 0,
			pixelOffset: new google.maps.Size(-140, 0),
			zIndex: 9999, //This is so they take precedence over markers when the mouse is over both
			boxStyle: {
			  background: "url('" + g_baseURI + "/images/maptipbox.gif') no-repeat",
			  opacity: 0.85,
			  width: "280px"
			},
			closeBoxMargin: "", //We're not using a close box
			closeBoxURL: "",
			infoBoxClearance: new google.maps.Size(1, 1),
			isHidden: false,
			pane: "floatPane",
			enableEventPropagation: false
		};

		marker.infobox.setOptions(myOptions);
		
		google.maps.event.addListener(marker.infobox, 'domready', function() {
			var thisInfobox = this;
			//Have to put this within the domready or else it can't find the div element (it's null until the InfoBox is opened)
	    $(thisInfobox.div_).hover(
	        function() { 	//MouseentermyOptions
	        	if (thisInfobox.mouseTiming == true) {
	        		clearTimeout(thisInfobox.mousedoutTimer);
	        		thisInfobox.mouseTiming == false;
	        	}
	        },
	        function() { //Mouseout 
	        	if (!thisInfobox.sticky) { //Close the popup if it isn't 'sticky'
	        			thisInfobox.close();
	        	}
	        }
	    );
	    
	    $(thisInfobox.div_).click(function() { //Toggle between sticky and not sticky
	    	//See if we're selecting or clicking
	    	var sel = getSelection().toString(); 
	    	if (sel) { //User is selecting, so don't propagate the click event
	    		return;
	    	};
	      
				if (thisInfobox.sticky) {
					thisInfobox.setOptions({ //Remove close button from infobox (won't be seen for popup - just if it becomes sticky)
						closeBoxMargin: "",
						closeBoxURL: ""
					});
				} else { //We want to make the infobox sticky
					//Show close button on infobox
					thisInfobox.setOptions({
						closeBoxMargin: "10px 2px 2px 2px",
						closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
					}); 
				}  
				
				thisInfobox.close();
				thisInfobox.open(ipMap, thisInfobox.myMarker);
				thisInfobox.sticky = !thisInfobox.sticky;
	    });
		}); //End of 'domready' google.maps.event.addListener
			
		//Event for handling clicking on the infobox close button
		google.maps.event.addListener(marker.infobox, "closeclick", function(){
			//Remove close button from infobox (won't be seen for popup - just if it becomes sticky)
			this.setOptions({
				closeBoxMargin: "",
				closeBoxURL: ""
			});
			marker.infobox.sticky = false;
			marker.setTitle("Click to make sticky");
		});		
		
		return;
	}	//End of function setupMarkerInfoBox
	
	function createInfoBoxContent(idToUse) {
		var htmlToUse = 
			"<table class='geoInfoTable' id='" + idToUse + "'>" +
			"<tr>" +
				"<td colspan='2' class='geoInfoLabel'>" + 
					(geoData.hasOwnProperty("country")?geoData.country:"") + 
				"</td>" +
			"</tr>" +
			"<tr>" + 
				"<td class='geoInfoIPCount'>IPs<br />(<span>" + 
					geoObj._ipsByCountry[geoData["country_iso"]].length + "</span>)</td>" +
				"<td>" +
					"<div class='geoInfoIPList'>" +
						"<span>" +  
							geoObj._ipsByCountry[geoData["country_iso"]].join(", ") +  
						"</span>" + 
					"</div>" + 
				"</td>" +
			"</tr>" +
	/*				"<tr>" +
				"<td>Region</td>" +
				"<td>" + (geoData.hasOwnProperty("region")?geoData.region:"N/A") + "</td>" +
			"</tr>" +
			"<tr>" +
				"<td>City</td>" +
				"<td>" + (geoData.hasOwnProperty("city")?geoData.city:"N/A") + "</td>" +
			"</tr>" +
			"<tr>" +
				"<td>ISP</td>" +
				"<td>" + (geoData.hasOwnProperty("isp")?geoData.isp:"N/A") + "</td>" +
			"</tr>" +
			
			"<tr>" +
				"<td>Lat/Long</td>" +
				"<td>" + geoData.latitude  + "/" + geoData.longitude + "</td>" +
			"</tr>" +
	*/				
		"</table>"; 
		
		var boxText = document.createElement("div");
		boxText.className = "geoLocInfoBox";
	  boxText.innerHTML = htmlToUse;
	  return boxText;
	} //End of function createInfoBoxContent
} //End of GeoLocationIP.prototype._setupMarkerEvents function
