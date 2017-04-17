/*This file contains the definition for the Busy Indicator class
 * It is used to display and remove the 'busy indicator' icon
 * 
 * Public members (non-function properties):
 *  (none)
 *  
 * Public methods (function properties):
 *   BusyIndicator() - Constructor
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
* @param $paramGraphDOM (jquery object) - jQuery object representing the DOM where the busy indicator should go
*/
function BusyIndicator($paramGraphDOM) {
	this._$indicatorDOM = $paramGraphDOM;
}

/**
 * Displays the busy indicator in the background of the given element
 */
BusyIndicator.prototype.start = function() {
	this._$indicatorDOM.css("background", "url(" + g_baseURI + "/images/ajax-loader.gif) no-repeat center center");
};

/**
 * Removes the busy indicator from the given element
 */
BusyIndicator.prototype.stop = function() {
	this._$indicatorDOM.css("background", "");
};
