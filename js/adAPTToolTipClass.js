/**
 * This file contains the definition for the adAPT Tooltip class
 * See constructor for public and private members
 *
 * Public methods (function properties):
 *   adAPTToolTip - constructor
 *   center
 *   empty
 *   show
 *   hide
 *   getDomID
 *
 * Private methods (function properties):
 *   _fadeTo
 */

/**
 * Constructor
 * @param szID (string)(optional) - ID to use (default: null)
 * @param szParent (string)(optional) - Parent element ID name to attach tooltip (null = use body)
 *
 */
function adAPTToolTip(szID, szParent) {
	if (typeof szParent == "undefined") {
		szParent = "body";
	} else {
		szParent = "#" + szParent;
	}
	
	//Assign tooltipID to given szID or create a new one
    var tooltipID = (szID == null)?("id_tooltip" + adAPTToolTip._TOOLTIPID++):szID;

    if ($("#" + tooltipID).length == 0) { //Tooltip div doesn't exist. Create it
	    //Create tooltip with new id - Store d3 element in class's d3Tooltip public member
		this.d3Tooltip = d3.select(szParent).append("div")
	        .attr("id", tooltipID)
	        .attr("class", "tooltip-popup")
	        .style("opacity", 0.0);
    } else {
    	this.d3Tooltip = d3.select("#" + tooltipID);
    } 
}

/***************************
 * Private 'Static' members
 ****************************/
adAPTToolTip._TOOLTIPID = 0; //Initialize


/***************************
 * Public Non-Static/Instance methods
 ****************************/
/**
 * Centers the tooltip in relation to the given d3 node/element
 * @param nodeEl (DOM) - Node element to use as the center
 * @param side (string) - Side to use: currently supports "left" or "top"
 * @param offset (integer) - Amount to offset the tooltip from the side to use
 * @param bUseArrow (bool) - Whether to display the arrow div (default is true)
 */
adAPTToolTip.prototype.center = function(nodeEL, side, offset, bUseArrow) {
	var toolTipObj = this;
	var rect = nodeEL.getBoundingClientRect();
	var top, left;
	var bOpp = false; //Whether we're aligning right or down
	var szArrow;
	
	side = side.toLowerCase();
	bUseArrow = (bUseArrow == null)?true:bUseArrow;

/*WIP: Using offset == null to indicate offset should be in the center of the element
	if (offset == null) {
		offset = (rect.width / 2) * ((side == "right") || (side == "bottom")?-1:1);
	}
*/	
	
	
	switch (side) {
		case "right":
			bOpp = true;
		case "left":
			var middleEl = $(nodeEL).offset().top + (rect.height / 2); //Middle offset of node height
			var heightToolTip = $(toolTipObj.d3Tooltip[0]).height() / 2; //Height of the tooltip / 2
			
			top = middleEl - heightToolTip; //We are centering the middle height of the tooltip with the middle height of the node element
			if (!bOpp) { //Align left side
				szArrow = "right";
				left =  $(nodeEL).offset().left - $(toolTipObj.d3Tooltip[0]).width() + offset; //Tooltip appears to the left of the element, +/- some offset*/
			} else { //Align right side
				szArrow = "left";
				left =  $(nodeEL).offset().left + rect.width + offset; //Tooltip appears to the right of the element, +/- some offset*/
			}
			break;
		case "bottom":
			bOpp = true;
		case "top":
			var middleEl = $(nodeEL).offset().left + (rect.width / 2)  //Middle offset of node width
			var leftToolTip = $(toolTipObj.d3Tooltip[0]).width() / 2; //Width of the tooltip / 2

			left = middleEl - leftToolTip; //We are centering the middle width of the tooltip with the middle width of the node element
			if (!bOpp) { //Align top side
				szArrow = "bottom";
				top = $(nodeEL).offset().top - $(toolTipObj.d3Tooltip[0]).height() + offset; //Tooltip appears above the element, +/- some offset
			} else { //Align bottom
				szArrow = "top";
				top = $(nodeEL).offset().top + rect.height + offset; //Tooltip appears below the element, +/- some offset
			}
			break;
		default: //Set top and left to some default
			top = d3.event.pageY;
			left = d3.event.pageX;
			break;
	}
	
	if (bUseArrow) {
		this.d3Tooltip.classed("arrow_box_" + szArrow, true);
	}
	
	$(toolTipObj.d3Tooltip[0]).css({
		"top":top + "px",
		"left":left + "px"
	});
	return;	
} //End of adAPTToolTip.prototype.center function

/**
 * Returns the domID of the tooltip
 */
adAPTToolTip.prototype.getDomID = function() {
	return this.d3Tooltip.attr("id");
}

/**
 * Clear out tooltip HTML and remove 'arrow' class
 */
adAPTToolTip.prototype.empty = function() {
	$(this.d3Tooltip[0]).empty(); //Clear out HTML
	//Remove any arrows
	this.d3Tooltip.classed("arrow_box_right", false);
	this.d3Tooltip.classed("arrow_box_left", false);
	this.d3Tooltip.classed("arrow_box_top", false);
	this.d3Tooltip.classed("arrow_box_bottom", false);
} //End of adAPTToolTip.prototype.empty function

/**
 * Unhides the tooltip
 * @param dur (integer) - Duration (Default 200)
 * @param opac (float) - Opacity (Default 0.95)
 */
adAPTToolTip.prototype.show = function(dur, opac) {
	this.empty();
	
	dur = dur | 200;
	if (opac == null) { //'opac = opac | 0.9' sets opac to 0 if opac if null/undefined. Not sure why
		opac = 0.95;
	}
	this._fadeTo(dur, opac);
};

/**
 * Hides the tooltip
 * @param dur (integer) - Duration (Default 200)
 * @param opac (float) - Opacity (Default 0.0)
 */
adAPTToolTip.prototype.hide = function(dur, opac) {
	dur = dur | 200;
	if (opac == null) {
		opac = 0.0;
	}
	this._fadeTo(dur, opac);
};

/***************************
 * Private Non-Static/Instance methods
 ****************************/

/**
 * Transitions to a given opacity
 * @param dur (integer) - Duration
 * @param opac (float) - Opacity
 */
adAPTToolTip.prototype._fadeTo = function(dur, opac) {
	this.d3Tooltip.transition()
	.duration(dur)
	.style("opacity", opac);
}



