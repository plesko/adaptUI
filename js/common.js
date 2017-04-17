/**********************************************************************
* This javascript file contains common functions/etc.
**********************************************************************/

/**********************************************************************
*Global 'Constants'
**********************************************************************/
/*****
 * These URL functions return the correct URL for certain pages
 */
var g_getURLHeader = function () {		
	if (!window.location.origin) {
		window.location.origin = window.location.protocol+"//"+window.location.host;
	}		
	return window.location.origin + g_baseURI;
};

var g_vAlarmDetailsPage = function () {
	return g_getURLHeader() + "/view/vAlarmDetails.php";
};
var g_vHostDetailsPage = function () {
	return g_getURLHeader() + "/view/vHostDetails.php";
};
var g_vNotifDetailsPage = function () {
	return g_getURLHeader() + "/view/vNotifDetails.php";
};

var g_userTimeZone = null; //To be filled in later at main.js/(window).load(function()

//Function to see if backend can connect to the internet.
//For geo location and other backend internet requirements
var g_isBackendConnectedToInternet = (function() {
  var bValue = null;
  return function() {
  	if (bValue == null) { //The ajax call has not been invoked yet or has returned successfully
  		$.ajax({  
  			type: "GET", 
  			dataType: 'json', 
  			async: false,
  		  url: g_getURLHeader() + '/controller/cAjax.php', 
  		    data: {
  		    	"action":"isBackendConnectedToInternet",
  		    	"data":null
  		    },
  		    success: function(res) { 
  			    // console.log(res);
  			    switch (res.result) {
  			    	case AJAX_RESULT_OK:
  			    		bValue = res.data;
  				    	break;
  			    	case AJAX_RESULT_EXCEPTION: //Exception error
  				    	alert("Exception error: " + res.thrown);
  				    	break;
  			    } //End of switch
  		    },
  	    	error: function (res, error, thrown) { //Unanticipated error
  	        	alert("Couldn't connect to PHP server error: " + thrown);
  	    	}
  	  }); //End of ajax call	  		
  	} 
  	return bValue;
  }
})();

//******

//Get set of possible threat values
//Right now, it's based on the products of all possible severity values x all possible critical asset values
var g_threatDomainSet = function() {
	retArray = [];
	for (var iCritVal = g_minAssetCrit; iCritVal <= g_maxAssetCrit; ++iCritVal) {
		for (var iSeverityVal = g_minSeverity; iSeverityVal <= g_maxSeverity; ++iSeverityVal) {
			var value = iCritVal * iSeverityVal;
			if (retArray.indexOf(value) == -1) { //Value not found
				//Add value to array
				retArray.push(value);
			}
		} //End of inner for
	} //End of outer for
	retArray.sort(function(a, b) {
		return a-b;
	});
	return retArray;
}(); //Run immediately

/*********************************
 * Global functions
 *********************************/
/**
 * Returns unix time (in seconds) for current date minus certain number of days
 * @param days (integer) - Number of days to use (> 0)
 * @returns integer - Calculated unix time
*/
function g_getStartTimeStampForDays(days) {
	if (isNaN(days) || (days <= 0)) {
		days = 1;
	}
	
	//Returns the date with time set to 00:00:00 ( / 1000 to turn ms to seconds)
	var retValue = Math.floor(new Date().setHours(0,0,0,0) / 1000) - (60 * 60 * 24 * days);
	return retValue;
};

/**
 * Creates a two column table with a header column for column 0 and data in column 1
 * @param domID (string) - Dom ID to put the table
 * @param rowData (array of objects) - Array of objects(<mapped column name>:<data>) to use for the second column.  
 * @param columnData (object) - Object which must contain the following two properties:
 * 	columnNames: Array of names to display in fixed column
 *  columnMaps: Array of data property names that correspond to the column names.
 *  See model/gui/mAlarmDetails.php alarmTypeData.data and alarmTypeData.columns for examples to use for rowData and columnData
 *  Sets DOM IDs of the 2nd column to id_<domID>__<data property name>. ex: id_id_alarmInfoTable__ruleDesc
 * @param szTitle (string, optional) - If set, creates a header row using given text 
 */
function g_createInfoTable(domID, rowData, columnData, szTitle) {
	var table = d3.select("#" + domID).attr("class", "detailtablesorter");
	
	if (szTitle != null) { //Add header row
		table.append("tr").append("th")
			.attr("id", "id_header_row")
			.attr("colspan", 2)
			.style("text-align", "center")
			.style("font-size", "14px")
			.style("font-weight", "bold")
			.text(szTitle);
	}
	
	//Create 'emtpy' rows - Skip header row, if we created it above
	var rows = table
		.selectAll("tr :not(#id_header_row)")
	 	.data(columnData.columnNames)
	 	.enter()
	 	.append("tr");
	
	
	//Append 'th' header row to each row
	rows.append("th")
		.attr("width", "35%")
	   	.text(function(d) { 
	      	return d;
	   	});
	
	//Append 'td' column info to each row
	rows.append("td")
		.attr("id", function(d, index) {
			//'index' represents the current row/columnName.
			//columnData.columnMaps[index] contains the data property name that maps to this column name
			//Set id to the property name represented by columnData.columnMaps[index]
	    	return "id_" + domID + "__" + columnData.columnMaps[index];
		})
		.html(function(d, index) { 
			//'index' represents the current row/columnName.
			//columnData.columnMaps[index] contains the data property name that maps to this column name
			//Return the data in the property represented by columnData.columnMaps[index]
	    	return rowData[columnData.columnMaps[index]];
		});
	return;
}

/**
 * Returns date in YYYY/MM/DD HH:MM:SS format
 * @param date (object) - Date object
 * @param bIncludeTime (bool) - true, include time, false, omit time
 * @returns string - 
 * 	bIncludeTime is true: YYYY/MM/DD HH:MM:SS formatted date (ex: '2014-10-23 01:12:43' or '2014-01-02 10:09:01')
 *  bIncludeTime is false: YYYY/MM/DD formatted date (ex: '2014-10-23' or '2014-01-02')
 */
function g_getFormattedDate(date, bIncludeTime) {
	  var year = date.getFullYear();
	  var month = (1 + date.getMonth()).toString();
	  month = month.length > 1 ? month : '0' + month;
	  var day = date.getDate().toString();
	  day = day.length > 1 ? day : '0' + day;
	  
	  var timeString = ""; //Initialize
	  if (bIncludeTime) { 
		  //Get time portion
		  var hours = date.getHours().toString();
		  hours = hours.length > 1 ? hours: '0' + hours;
		  var minutes = date.getMinutes().toString();
		  minutes = minutes.length > 1 ? minutes: '0' + minutes;
		  var seconds = date.getSeconds().toString();
		  seconds = seconds.length > 1 ? seconds: '0' + seconds;
		  timeString =  ' ' + hours + ":" + minutes + ":" + seconds;
	  }
	  return year + '/' + month + '/' + day + timeString;
}

/**
 * Data object plugin
 * Add/Subtract days from current date object and return in NEW object (does NOT change current object)
 * @param iDays (integer) - Number of days to add/subtract (negative value for subtracting; positive for adding)
 * @returns (Date obj) - Date object with updated date
 */
Date.prototype.addDays = function(iDays)
{
	var dat = new Date(this.valueOf());
	dat.setDate(dat.getDate() + iDays);
	return dat;
};


/**
 * jQuery plugin to determine whether an element contains a scrollbar
 * @returns bool - true if element has a scrollbar; false, otherwise
 */
(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0) ? this.get(0).scrollHeight > this.innerHeight() : false;
    }
})(jQuery);

(function(globals) {
	
	globals.subTitle= function(json) {
		var subTitleValue = json.subTitle;
		var $subTitleEl = d3.select("#subtitle");
		$subTitleEl.text(subTitleValue);
		$subTitleEl.style("display", null);
	};
}(window));

/**
	  * Wraps d3 text - Inspired by: http://bl.ocks.org/mbostock/7555321
	  * @param text (string) - Text to wrap
	  * @param width (integer, optional) - Max width of a line (in px? Not sure) (Default: 1, wrap every word)
	  */
function d3TextWrap(text, width) {
	width = width || 1; //If width isn't set, set it to default
	text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(), //'words' is an array of each word in the text
	        word,
	        line = [],
	        lineNumber = 0,
	        lineHeight = 1.1, // ems
	        y = text.attr("y"),
	        dy = 0;
	    	dx = -0.6;
	    	tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em").attr("dx", dx + "em");
	     while (word = words.pop()) { //Get next word
	    	 line.push(word);
	    	 tspan.text(line.join(" ")); //Add word to line
	    	 if (tspan.node().getComputedTextLength() > width) { //We have gone over the width limit
	    		 if (line.length > 1) { //We need to do this in case the first word in a line spans the allowed width
	    			 line.pop();
	    			 tspan.text(line.join(" "));
	    			 line = [word];
	    			 tspan = text.append("tspan").attr("x", 0).attr("y", y)
	    			 	.attr("dy", ++lineNumber * lineHeight + dy + "em").attr("dx", dx + "em").text(word);
	    		 } //End of (if (line.length > 1))
	    	} //End of (if (tspan.node().getComputedTextLength() > width))
	    } //End of while
	}); //End of text.each
}//End of function d3TextWrap	

/**
 * Returns a properly US formatted phone number from a string of numbers
 * @param szPhoneNumber (string) - String of numbers (10 digits)
 * @returns string - properly formatted phone number
 */
function g_formatPhoneNum(szPhoneNumber) {
	return szPhoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

/**
 * Runs validation against an email address
 * @param email (string) Email address to verify
 * @returns bool true if validation passes; false, otherwise
 */
function g_validateEmail(email) { //From http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

/**
 * Allows for caching of a js script from jquery
 */
jQuery.cachedScript = function( url, options ) {
  // Allow user to set any option except for dataType, cache, and url
  options = $.extend( options || {}, {
    dataType: "script",
    cache: true,
    url: url
  });
 
  // Use $.ajax() since it is more flexible than $.getScript
  // Return the jqXHR object so we can chain callbacks
  return jQuery.ajax( options );
};

/**
 * Converts UTC date string to date string in user's set timezone
 * @param szUTCDate Date in YYYY/MM/DD HH:mm:ss format - treated as UTC time
 * @returns YYYY/MM/DD HH:mm:ss formatted date for user timezone
 */
function g_convertFromUTC(szUTCDate) {
	var dateFormat = "YYYY/MM/DD HH:mm:ss";
	return moment.utc(szUTCDate, dateFormat).tz(g_userTimeZone).format(dateFormat);
}
