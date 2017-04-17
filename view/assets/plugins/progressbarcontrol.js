/**
 * @name ProgressbarControl
 * @version 1.0
 * @author Bjorn BRala
 * @copyright (c) 2008 SWIS BV - www.geostart.nl
 * @fileoverview Creates a progress bar control for usage in google maps. 
 *   It can be used to show the progress of loading markers, for example.
 *   
 * Modifications by Scott Wells, Cyber@adAPT  
 *   
 */

/********************
 * Public functions
 ********************/
/**
 * Creates a progress bar control on the given map, with the given options.
 *
 * @constructor
 * @param ipMap {object} Map object
 * @param opt_opts {object} options:
 *   @property {Number} [width=176] Specifies, in pixels, the width of the bar.
 *   @property {String} [loadstring=Loading...] Specifies the string displayed 
 */
function ProgressbarControl(ipMap, opt_opts) {
  this.options_ = opt_opts || {};

  this.ipMap_ = ipMap;
  this.width_ = this.options_.width || 100;
  this.loadstring_ = this.options_.loadstring || 'Loading...';
  
  //Create progress bar elements and add the returned outer div to the map
  this.divHTML_ = this.createProgressBarElements_();
  this.ipMap_.getDiv().appendChild(this.divHTML_);
  
  this.operations_ = 0;
  this.current_ = 0;
  
  this.div_ = document.getElementById('geo_progress');
  this.text_ = document.getElementById('geo_progress_text');
  this.container_ = document.getElementById('geo_progress_container');
}

/**
 * @desc Start the progress bar. 
 * @param {Number} operations Total amount of operations that will be executed.
 */
ProgressbarControl.prototype.start = function (operations) {
	var thisObj = this;
	
	this.ipMap_.controls[google.maps.ControlPosition.RIGHT].push(this.divHTML_);
	
	//We want to display the progress bar only when the map is 'idle' - in this case,
	//once (and only once) when the map is done loading. we have 'addListenerOnce' instead of just
	//'addListener' because 'addListener' will make the progress bar pop up after user movement as well
	google.maps.event.addListenerOnce(this.ipMap_, 'idle', function() {
		thisObj.container_.style.display = "block";
	});
	
	this.div_.style.width = '0%'; 
	this.operations_ = operations || 0;
	this.current_ = 0;
	this.text_.style.color = "#111";
	this.text_.innerHTML = this.loadstring_;
};

/**
 * @desc  Update the progress with specified number of operations.
 * @param {Number} step Number of operations to add to bar.
 */
ProgressbarControl.prototype.updateLoader = function (step) {
  this.current_ += step;
  
  this.updateInnerHTML_();
};

/**
 * @desc  Set current operation step
 * @param {Number} Number of operations to set current value to 
 */
ProgressbarControl.prototype.setCurrent = function (val) {
	if (val < 0) { //Do nothing
		return;
	}
	
	this.current_ = (val >= this.operations_)?this.operations_:val;
	this.updateInnerHTML_();
}

/**
 * @desc Remove control.
 */
ProgressbarControl.prototype.remove = function () {
  this.container_.style.display = 'none';
};

/********************
 * Private functions
 ********************/
/**
 * @desc Create progress bar div elements
 * @return outer div container element
 */
ProgressbarControl.prototype.createProgressBarElements_ = function() {
	var container = document.createElement('div');
	
	container.innerHTML = '<div style="position:absolute;width:100%;border:5px;'
	  + 'text-align:center;vertical-align:bottom;" id="geo_progress_text"></div>'
	  + '<div style="background-color:lightblue;height:100%;" id="geo_progress"></div>';
	container.id = "geo_progress_container";
	container.style.display = "none";
	container.style.width = this.width_ + "px";
	container.style.fontSize = "0.8em";
	container.style.height = "1.3em";
	container.style.border = "1px solid #555";
	container.style.backgroundColor = "white";
	container.style.textAlign = "left";

	return container;
}

/**
 * @desc Updates inner html of progress bar with percentage
 */
ProgressbarControl.prototype.updateInnerHTML_ = function () {
  if (this.current_ > 0) {
    var percentage_ = Math.ceil((this.current_ / this.operations_) * 100);
    if (percentage_ > 100) { 
      percentage_ = 100; 
    }
    this.div_.style.width = percentage_ + '%'; 
    this.text_.innerHTML = percentage_ + '%';
  }
}