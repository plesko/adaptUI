/*This file contains the definition for the Full Page Busy Indicator class
 * It is used to display and remove a full-page 'busy indicator' icon - A modal 'dialog box' taking the entire screen
 * It is dependent on busyIndicatorClass.js
 * 
 * Public members (non-function properties):
 *  (none)
 *  
 * Public methods (function properties):
 *   FullPageBusyIndicator() - Constructor
 *   start()
 *   stop()
 * 
 * Private members (non-function properties):
 *	_$indicatorDOM (jquery object) - jQuery object representing the DOM where the busy indicator should go
 * 
 * Private methods (function properties):
 * 	(none)
 * 
 */

/***************************
* Non-Static/Instance methods
****************************/

/*
* Constructor
*/
function FullPageBusyIndicator() {
	this._loadingBusyIndicator = {}; //Object to be filled in later
	this._loadingDivID = "loading_popup";
}

/**
 * Displays the busy indicator in a full page modal dialog box
 */
FullPageBusyIndicator.prototype.start = function() {
	if ($("#"+this._loadingDivID).length != 0) { //Loading popup div exists. Remove it
		$("#"+this._loadingDivID).remove();
	}
	//Create popup div
	var $loadingDiv = $('<div>')
		.attr("id", this._loadingDivID)
		.attr("display","none")
		.attr("text-align", "center")
		.attr("margin", "0")
		.attr("padding", "0");
	//Append div
	$("body").append($loadingDiv);

	//Append a few side-by-side divs to put the loading text and the spinner
	$loadingDiv.append("<div id='id_load1' style='float:left;width:70%;font-size:16px;'></div>" + 
			"<div id='id_load2' style='float:left;width:30%;'>&nbsp;</div>");
	
	//jQuery UI dialog
	$loadingDiv.dialog({
		width: 80,
		height: 50,
		modal: true,
		resizable: false,
		title: "Loading",
		position: { 
			my: "center center", 
			at: "center center"
		},			
		closeOnEscape: false,
		close: function( event, ui ) {
			$("#loading_popup").remove();
		},
		dialogClass: 'noDialogTitle',
	});	
	
	$("#id_load1").html("Loading...");
	//Create and start busy indicators
    this._loadingBusyIndicator = new BusyIndicator($("#id_load2"));
    this._loadingBusyIndicator.start();
	
	
};

/**
 * Removes the busy indicator and modal
 */
FullPageBusyIndicator.prototype.stop = function() {
	this._loadingBusyIndicator.stop();
	$("#"+this._loadingDivID).dialog("close");	
};
