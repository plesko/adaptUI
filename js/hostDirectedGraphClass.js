/* This file contains the definition for the Host Directed Graph class
 * See constructor for public and private members
 *
 * Public methods (function properties):
 *   HostDirectedGraph() - constructor
 *   execute()
 *   (STATIC) color()
 *
 * Private methods (function properties):
 * _createGraph
 * _setupThreatLevelTable
 * _getThreatScaled
 * _createBGImage
 * _setNodeLinkOpacity
 *
 */

/*
* Constructor
* @param paramObj (object) - Object that should contain the following properties (required unless stated otherwise)
* 	graphDOMID (string) - DOM ID of the element to put the graph (No leading #)
*   hostData (mixed) - The host data
*   scaledThreatDivDOMID (optional) (string) - DOM ID of the div to create the scaled values selection table
*   										(if null/undefined, then this table will not be created)
*
*/
function HostDirectedGraph(paramObj) {
	if ((paramObj.graphDOMID == null) || (paramObj.hostData == null)) { //Not using === because we want to check against null AND undefined
		alert("graphDOMID and/or hostData parameter null or undefined");
		return;
	}
	//The DOM ID of the element to use
	this._graphDOMID = paramObj.graphDOMID;

	//The jQuery DOM element to put the graph
	this._$graphDOM = $("#" + paramObj.graphDOMID);

	// console.log(this._$graphDOM);

	//Array containing host data (See model/gui/mHostDirectedGraph.php for returned hostData array structure)
	this._hostData = paramObj.hostData;

	//DOM ID of the scaled threat score values selection table
	this._scaledThreatDivDOMID = paramObj.scaledThreatDivDOMID || null;

	//jQuery DOM element of the scaled scaled threat score values selection table
	this._$scaledThreatDivDOM = (this._scaledThreatDivDOMID != null)?$("#" + this._scaledThreatDivDOMID):null;

	//Host node prefix to use for a node id
	this._idHostNodePrefix = "id_hostnode__";

	//Array of threat levels to graph (configurable)
	this._threatLevelsToGraph = [];

	//Maximum and mininum scaled threat levels
	this._maxScaledLevel = 5;
	this._minScaledLevel = 0;

	//Threat table, attached to _$scaledThreatDivDOM
	this._$threatLevelTable = null;

	//Host data per scaled threat value
	this._hostsPerScaledThreat = {};

	//Name of SVG DOM ID
	this._svgDomID = "id_hostsvg";
}

/***************************
 * 'Static' methods
****************************/
/**
 * Returns the appropriate svg circle fill color for a given hop level.
 * Used in the force directed graph
 * @param hopLevel (integer) - Hop level to use
 * @returns string - Color to use
 */
HostDirectedGraph.color = function(hopLevel) {
//In case we want to use d3 20 color categories
//var color = d3.scale.category20();
//return color(hopLevel);
	var colors = ["black", "blue", "red", "green", "gold", "purple"];

	if( typeof colors[hopLevel] !== "undefined" ) { //Hop level exists in the array, so use it
		return colors[hopLevel];
	} else { //Hop level doesn't exist in the colors array, so just return a constant color
		return "silver";
	} //End of else of (if( typeof colors[hopLevel] != "undefined" ) )
}; //End of function color


/***************************
* Public Non-Static/Instance methods
****************************/
/*
* The instance methods of a class are defined as function-valued properties
* of the prototype object. The methods defined here are inherited by all
* instances and provide the shared behavior of the class. Note that JavaScript
* instance methods must use the this keyword to access the instance fields.
*/

/*
 * Creates the force directed graph and handles the behavior/events
 */
HostDirectedGraph.prototype.execute = function() {
  var hostObj = this; //Reference to this host object instance

	//Create initial set of threat levels to display - all of them
  hostObj._threatLevelsToGraph = function() {
		var ar = [];
		for (var iCount = hostObj._minScaledLevel; iCount <= hostObj._maxScaledLevel; ++iCount) {
			ar.push(iCount);
		}
		return ar;
	}();

	//Now compute threat scale of each node, store data also in _hostsPerScaledThreat
	$.each(hostObj._hostData.data.nodes, function(index, node) {
		node.scaledThreat = hostObj._getThreatScaled(node.threatInfo.threatScore);
		node.fixed = false;
		if (hostObj._hostsPerScaledThreat.hasOwnProperty(node.scaledThreat)) {
			hostObj._hostsPerScaledThreat[node.scaledThreat].push(node);
		} else {
			hostObj._hostsPerScaledThreat[node.scaledThreat] = [node];
		}
	});

	hostObj._createGraph();
}; //End of HostDirectedGraph.prototype.execute function

/**
 * Adds or removes the 'associated row' highlight from the node that's associated with the hostIdx
 * @param hostIdx (integer) - Host Idx to identify which node to use
 * @param bState (bool) - true, highlight node; false, remove highlight
 */
HostDirectedGraph.prototype.highlight = function(hostIdx, bState) {
	var hostObj = this;

	 bState = bState || false; //If bState is not set, default to false (remove highlight)
	 if (!isNaN(hostIdx) && (hostIdx >= 0)) { //Make sure hostIdx is a valid number >= 0
		 var nodeId = hostObj._idHostNodePrefix + hostIdx;
		 var svgNode = d3.select("#" + nodeId);
		 if (svgNode !== undefined) { //Node exists
			 svgNode.classed("highlighted", bState);
		 }
	} //End of (if (!isNaN(hostIdx) && (hostIdx >= 0)))
}; //End of HostDirectedGraph.prototype.highlight function

/***************************
* Private Non-Static/Instance methods
****************************/
/**
 * Function that actually creates the graph
 */
HostDirectedGraph.prototype._createGraph = function() {
    //Make reference to this, nodes, links, and hops
    var hostObj = this;
    var origNodes = hostObj._hostData.data.nodes;
    var origLinks = hostObj._hostData.data.links;
    var hopData = hostObj._hostData.data.hops;
    // var tooltip = new adAPTToolTip("fdg_tooltip");

    //Create graph nodes and links from the origNodes and links
    var graphNodes = [];
    var graphLinks = [];
    var iIndex = 0;

	if (hostObj._scaledThreatDivDOMID != null) { //We're including a Scaled Threat DIV
		//Fade and disable Scaled Threat checkboxes
		hostObj._$scaledThreatDivDOM.fadeTo(500, 0.2);
		if (hostObj._$threatLevelTable != null) { //Scaled threat table has already been created
			hostObj._$threatLevelTable.find("input").attr("disabled", "disabled"); //Disable all checkboxes
		}
	}

    //Create graphNodes
    $.each(origNodes, function(hostIdx, node) {
      //Add iIndex to each node
  	node.iIndex = iIndex++;
    	//Add node to graphNodes array
		graphNodes.push(node);
    });

    //Create graphLinks array from origLinks
    //Each index of the array corresponds to a source host
		$.each(origLinks, function(sourceHostIdx, linkArray) {
			//Now loop through the source link array. Each index corresponds to a target host
			$.each(linkArray, function(index, targetHostIdx) {
				var sourceIndex = origNodes[sourceHostIdx].iIndex;
				var targetIndex = origNodes[targetHostIdx].iIndex;
				//Add source/target object to graphLinks array
				graphLinks.push({
					"source": sourceIndex,
					"target": targetIndex
				});
			}); //End of inner .each
		}); //End of outer .each

    hostObj._$graphDOM.empty(); //Erase any previous graph

		var iMaxThreatScaled = hostObj._getThreatScaled(g_maxPossibleThreatScore); //Max scaled value
		var width = hostObj._$graphDOM.width(); //Wdith of host directed graph div
    var	height = hostObj._$graphDOM.height(); //Height of host directed graph div
		var iSmallestRadius = 10; //Radius of smallest circle
    var iRadiusMultiplier = 7; //Size difference between nodes of different threat levels
    var iLargestRadius = iSmallestRadius + (iMaxThreatScaled * iRadiusMultiplier); //Radius of largest circle
    var bDoTicks = false; //Initialize to false so that we only see the end result - No updates on ticks
    // var graphBusyIndicator = new BusyIndicator(hostObj._$graphDOM);
    var DELAY = 700, clicks = 0, timer = null; //For double click/single click separation

	//Determines the radius size, based on given threat scale
    var radiusSize = (function(threatScaled) {
        return iSmallestRadius + (threatScaled * iRadiusMultiplier)
    });

	//Start the busy indicator
	// graphBusyIndicator.start();

	var force = d3.layout.force()
		.gravity(0.9)
		.charge(-35000)
		.linkDistance(function(d) {
			// console.log(d);
			var radiusScale = d3.scale.sqrt().range([0, iLargestRadius]);
			var iSource = radiusSize(d.source.scaledThreat) / 4;
			var iTarget = radiusSize(d.target.scaledThreat) / 4;
			var retValue = radiusScale(iSource) + radiusScale(iTarget) + 20;

			if (d.target.hopLevel == 1 ) {
				retValue = retValue + 10;
			}
			if (d.target.hopLevel == 2 ) {
				retValue = retValue - 5;
			}
			return retValue;
			// return 12;
		})
		.linkStrength(0.9)
		.friction(0.1)
	    .size([width, height]);

    //Function (called by variable drag) on dragging a node.
    //Applies the 'fixed' attribute
	var drag = force.drag()
		.on("dragstart", function(d) {
			bDoTicks = true; //We now allow ticks so that the user can drag nodes
		})
		.on("drag", function(d) {
			var curNode = d3.select(this);
			curNode.classed("fixed", d.fixed = true);
			curNode.style("cursor", "grabbing");
		})
		.on("dragend", function(d) {
			d3.select(this).style("cursor", "pointer");
		});

    //Create svg object
	var svg = d3.select("#" + hostObj._graphDOMID).append("svg:svg")
		.attr("id", hostObj._svgDomID)
		.classed("fdg_svg", true)
	    .attr("width", width)
	    .attr("height", height)
	    .style("display", "none")

  	force
      .nodes(graphNodes)
      .links(graphLinks)
      .start();

	//Append 'defs' tag to svg
	var defs = svg.append("defs:defs").attr("id", "id_svgdefs");

  	//Create svg background images for question mark and the threat scales
  	hostObj._createBGImage(defs, "id_img_question", "question-mark.png", {x:"-3%"}); //Leave y as default
  	for (var iCount = hostObj._minScaledLevel; iCount <= hostObj._maxScaledLevel; ++iCount) {
  		var xyObj = null; //Initialize
  		switch (iCount) { //Change feImage x/y based on iCount png
  			case 0: xyObj = {x:"0%"}; break;
				case 1: xyObj = {x:"0%"}; break;
  			case 4: xyObj = {x:"1%"}; break;
  			default: break;
  		};
  		hostObj._createBGImage(defs, "id_img_no_" + iCount, "no_" + iCount + ".png", xyObj);
  	}

    //Create links
  	var link = svg.selectAll("line.link")
      .data(graphLinks)
      .enter().append("svg:line")
      .attr("class", "link")
      .attr("stroke", function(d) {return HostDirectedGraph.color(d.source.hopLevel); })
      .attr("x1", function(d) { //These rSize/Math functions ensure that the nodes do not go out of the boundary box
				var rSize = radiusSize(d.source.scaledThreat);
				return Math.max(rSize, Math.min(width - rSize, d.source.x));
	      })
      .attr("y1", function(d) {
				var rSize = radiusSize(d.source.scaledThreat);
				return Math.max(rSize, Math.min(height - rSize, d.source.y));
	      })
      .attr("x2", function(d) {
				var rSize = radiusSize(d.target.scaledThreat);
				return Math.max(rSize, Math.min(width - rSize, d.target.x));
	      })
      .attr("y2", function(d) {
				var rSize = radiusSize(d.target.scaledThreat);
				return Math.max(rSize, Math.min(height - rSize, d.target.y));
	      })
	  .attr("opacity", .4);

  	//Create nodes
  	var node = svg.selectAll("circle.node")
			.data(graphNodes)
			.enter().append("svg:circle")
			.attr("class", "node")
			//boudaries for 'cx' and 'cy' based on: http://stackoverflow.com/questions/9573178/d3-force-directed-layout-with-bounding-box
			//User 'Limin's sub-answer
			.attr("cx", function(d) {  //These rSize/Math functions ensure that the nodes do not go out of the boundary box
				var rSize = radiusSize(d.scaledThreat);
				return Math.max(rSize, Math.min(width - rSize, d.x));
			})
			.attr("cy", function(d) {
				var rSize = radiusSize(d.scaledThreat);
				return Math.max(rSize, Math.min(height - rSize, d.y)); })
			.attr("opacity", function(d) {
				return (hostObj._threatLevelsToGraph.indexOf(d.scaledThreat) >= 0)?"1.0":"0.4";
			})
			.attr("r", function(d) { //Radius
				return radiusSize(d.scaledThreat);
	   	})
	   	.attr("id", function(d) {
	   		return hostObj._idHostNodePrefix + d.hostIdx;
	   	})
	   	.attr('filter', function (d) { //Add background image
	   		var retVal = ""; //Initialize to empty string
	   		if (d.hostIdx < g_monitoredStartIdx) { //This is an unmonitored bucket
	   			//Use ? mark
	   			retVal = "url(#id_img_question)";
	   		} else { //Use img associated with threat scale
	   			retVal = "url(#id_img_no_" + d.scaledThreat + ")";
	   		}
				return retVal;
	   	})
	   	.style("fill", function(d) { return HostDirectedGraph.color(d.hopLevel); })
			.on("click", function (d) {
				var defaultPrevented = d3.event.defaultPrevented;
				var selectedNode = d3.select(this);
				clicks++;  //count clicks
		    if (clicks === 1) {
		    	timer = setTimeout(function() { //Wait for timeout. If we timeout, then it was a single click or drag-stop event
		    		clicks = 0;             //after action performed, reset counter
		    	}, DELAY);

		    	if (!defaultPrevented) { //A real click and not a mouse-up due to a drag
		    		selectedNode.classed("fixed", d.fixed?false:true);
		    		d.fixed = !d.fixed;
		    	}
		    } else { //Double click. Load host details page
					if (d.hostIdx < g_monitoredStartIdx) { //Unmonitored, Broadcast, or Multicast address
						if (typeof hostObj._hostData.data.unmonIPs[d.hostIdx] !== undefined) {
							//Create new geoLocationIP object and call its execute function
							var geoLocationIPObj = new GeoLocationIP(hostObj._hostData.data.unmonIPs[d.hostIdx], hostObj._$graphDOM);
							geoLocationIPObj.execute();
						} else { //We shouldn't get here because there should have been at least one IP
							alert("No IPs found");
						} //End of else of (if (typeof data.data.commData.unmonIPs[idx] !== undefined))
					} else {
						//Load host details page
				    	var url = g_vHostDetailsPage() + "?idx=" + d.hostIdx;
				    	clearTimeout(timer);    //prevent single-click action
			        clicks = 0;             //after action performed, reset counter
			        // window.location = url; //Load host details page
							// var url = '<?= $_SESSION["baseURI"] ?>/view/vHostDetails.php?idx='+$(this).attr('id');
						ajaxLoader(url, ajaxContainer);
					}
		    } //End of else of (if (clicks === 1) )
			}) //End of .on click
			.on("mouseover", function(d) {
				var id_table = "id_hostCircle_popupTable";
				// tooltip.show();
				// tooltip.d3Tooltip.append("table").attr("id", id_table).style("width", "100%");
				// tooltip.d3Tooltip.style("width", "250px");
				var columns = {
         	"columnNames":["Host", "Threat Score", "Highest Severity", "Asset Criticality", "Number of Alarms"],
         	"columnMaps":["host", "threatScore", "severity", "assetCrit", "alarmCount"]
	     	};
				var data = {
					"host": d.hostName,
					"threatScore": d.threatInfo.threatScore,
					"severity": d.threatInfo.alarmInfo.highestSeverity,
					"assetCrit": d.threatInfo.assetCrit,
					"alarmCount": d.threatInfo.alarmInfo.alarmCount
				};

				g_createInfoTable(id_table, data, columns);

				if ($(this).attr("cx") >= width / 2) { //Circle is on the right half of the graph
					//Put tooltip to the left of node
					// tooltip.center(this, "left", -18, true);
				} else { //Circle is on left half of the graph
					//Put tooltip to the right of the node
					// tooltip.center(this, "right", 18, true);
				}
    	})
    	.on("mouseout", function(d) {
    		// tooltip.hide();
			})
			.call(drag);

		force.on("tick", function() {
			if (bDoTicks) { //We want to update on ticks now
				runUpdate();
			}
		});

		//Once the graph is finished moving, run the update and unset display
  	force.on("end", function() {
  		runUpdate();
  		if (bDoTicks == false) { //Indicates this is the initial creation of the graph
  			// graphBusyIndicator.stop(); //Remove 'busy' indicator
  			d3.select("#" + hostObj._svgDomID).style("display", null); //remove display CSS to unhide the SVG graph
  			bDoTicks = true; //We now allow ticks so that the user can drag a node

  			if (hostObj._scaledThreatDivDOMID != null) { //We're including a Scaled Threat DIV
  				hostObj._$scaledThreatDivDOM.fadeTo(500, 1); //Fade in
  				hostObj._setupThreatLevelTable();
  			} //End of (if (hostObj._scaledThreatDivDOMID != null))
  		} //End of (if (bDoTicks == false))
  	});

  	var runUpdate = function() {
	  	//Keep first node in the middle
  		// graphNodes[0].x = width / 2;
  		// graphNodes[0].y = height / 2;

	    link.attr("x1", function(d) {
				var rSize = radiusSize(d.source.scaledThreat);
				return Math.max(rSize, Math.min(width - rSize, d.source.x));
		    })
	        .attr("y1", function(d) {
				var rSize = radiusSize(d.source.scaledThreat);
				return Math.max(rSize, Math.min(height - rSize, d.source.y));
		    })
	        .attr("x2", function(d) {
				var rSize = radiusSize(d.target.scaledThreat);
				return Math.max(rSize, Math.min(width - rSize, d.target.x));
		    })
	        .attr("y2", function(d) {
				var rSize = radiusSize(d.target.scaledThreat);
				return Math.max(rSize, Math.min(height - rSize, d.target.y));
		    });


	    node.attr("cx", function(d) {
				var rSize = radiusSize(d.scaledThreat);
				return Math.max(rSize, Math.min(width - rSize, d.x));
			})
			.attr("cy", function(d) {
				var rSize = radiusSize(d.scaledThreat);
				return Math.max(rSize, Math.min(height - rSize, d.y));
			});
	 }; //End of runUpdate function variable
}; //End of HostDirectedGraph.prototype.createGraph function

/**
 * Sets up the Scaled Threat Level selection table
 */
HostDirectedGraph.prototype._setupThreatLevelTable = function() {
	var hostObj = this;

	// $("#id_threatLevelTable").DataTable().destroy();

	//See if threat table exists. If it doesn't, add it and the enclosing div.
	if ($("#id_threatLevelTable").length == 0) {
		//Add
		hostObj._$scaledThreatDivDOM.append(
			"<table class='datatable display cell-border' id='id_threatLevelTable' style='border: 1px solid black;'></table>"
		);
	}

	hostObj._$threatLevelTable = $("#id_threatLevelTable");
	hostObj._$threatLevelTable.find("input").removeAttr("disabled"); //Enable all checkboxes

	//Create the dataset - Array of available threat scale levels (_minScaledLevel-_maxScaledLevel)
	var dataSet = function() {
		var ar = [];
		for (var iScaleCount = hostObj._minScaledLevel; iScaleCount <= hostObj._maxScaledLevel; ++iScaleCount) {
			iHostCount = (hostObj._hostsPerScaledThreat[iScaleCount])?hostObj._hostsPerScaledThreat[iScaleCount].length:0;
			ar.push(['', iScaleCount, iHostCount]);
		}
		return ar;
	}();

// 	hostObj._$threatLevelTable.dataTable( {
// 		"data": dataSet,
// 		"scrollCollapse": true,
// 		"paginate": false,
// 		"searching": false,
// 		"order":[], //Prevent order icon from appearing on first column
// 		"info": false, //No info at bottom
// 		"headerCallback": function( thead, data, start, end, display ) {
// 			//Create 'check all/none' checkbox
// 			$h0 = $(thead).find('th').eq(0);
// 			$('<input />', {
// 				type: 'checkbox',
// 				id: 'id_chk_header',
// 				checked: (hostObj._threatLevelsToGraph.length	== (hostObj._maxScaledLevel - hostObj._minScaledLevel) + 1)?true:false,
// 				value: ''
// 			}).appendTo($h0);
// 		},
// 		"createdRow": function( row, data, dataIndex ) {
// 			var chk = $(row).find("input[id^='id_chk_']");
// 			if (chk == null) { //Checkbox not found. Shouldn't happen
// 				return;
// 			}
// 			if (!chk.prop("checked")) { //If the row isn't intially selected, then fade the row
// 				$(row).find("td:nth-child(2)").fadeTo(100, 0.3);
// 				$(row).find("td:nth-child(3)").fadeTo(100, 0.3);
// //				$(row).fadeTo(100, 0.4);
// 			}
// 		 },
// 		"columns": [ //See model/gui/mHostDirectedGraph for data/hops array structure
// 			{
// 				"orderable": false,
// 				"title": "",
// 				"data": null,
//                	"defaultContent": "",
// 				"name": "check",
// 				"createdCell": function (td, cellData, rowData, row, col) {
// 					//Create checkbox
// 					$('<input />', {
// 						type: 'checkbox',
// 						id: 'id_chk__' + rowData[1], //Add scale threat value to input ID
// 						checked: (hostObj._threatLevelsToGraph.indexOf(rowData[1]) > -1)?true:false,
// 						value: ''
// 					}).appendTo(td);
// 				} //End of createdCell property function
// 			},
// 			{
// 				"orderable": false,
// 				"title": "Scaled Threat Level",
// 				"name": "scaledThreat"
// 			},
// 			{
// 				"orderable": false,
//                	"defaultContent": "",
// 				"title": "Host Count",
// 				"name": "hostCount"
// 			}

// 		] //End of 'columns' array
// 	}); //End of dataTable

	/**
	 * on click event for non-header checkboxes of Scaled Threat Level Table
	 * Sets checked state of header checkbox, depending of states of other checkboxes
	 */
	hostObj._$threatLevelTable.on("click", "input[id^='id_chk__']", function() {
		var scale = Number($(this).attr("id").split('__')[1]); //Scale represented by checkbox

		if ($(this).prop("checked") == false) { //At least one checkbox is now unchecked
			var iIndex = hostObj._threatLevelsToGraph.indexOf(scale);
			hostObj._threatLevelsToGraph.splice(iIndex, 1);
			hostObj._setNodeLinkOpacity(scale, false);

			//Set checked state of header to false
			$("#id_chk_header").prop("checked", false);
		} else { //It's checked see if all other non-header checkboxes are checked, too
			hostObj._threatLevelsToGraph.push(scale); //Add threat scale
			hostObj._setNodeLinkOpacity(scale, true);

			var bAllChecked = true; //Initialize
			$("#id_threatLevelTable input[id^='id_chk__']").each(function() {
				if ($(this).prop("checked") == false) {
					bAllChecked = false;
					return false; //Return false breaks out of .each
				}
			}); //End of .each

			if (bAllChecked) { //All other key rows are checked
				//Set checked state of header to true
				$("#id_chk_header").prop("checked", true);
			}
		} //End of else of (if ($(this).prop("checked") == false))
	}); //End of (hostObj._$threatLevelTable.on("click"...)

	/**
	 * on click event for header checkbox of Scaled Threat Level Table
	 * Check or uncheck all other Scaled Threat Level checkboxes
	 */
	hostObj._$threatLevelTable.on("click", "input[id='id_chk_header']", function() {
		var bChecked = $(this).is(':checked');

		hostObj._threatLevelsToGraph = []; //Initialize

		//Now check/uncheck the other Threat Level checkboxes
		$("#id_threatLevelTable input[id^='id_chk__']").each(function() {
			var scale = Number($(this).attr("id").split('__')[1]);

			if (scale >= 0) { //Individual check box
				$(this).prop("checked", bChecked);
				if (bChecked) { //Add threat scale represented by checkbox back into  hostObj._threatLevelsToGraph
					hostObj._threatLevelsToGraph.push(scale);
				}
			} //End of (if (chkBoxIterId >= 0))
		}); //End of $("#id_threatLevelTable input[id^='id_chk__']") function

		hostObj._setNodeLinkOpacity(-1, bChecked);
	});

	//Highlight all nodes that have this threat level
	hostObj._$threatLevelTable.on( 'mouseover', 'tbody tr', function (event) { //User moused over a row
		handleMouseOverOut($(this), true); //Hightlight all nodes with row's scaled threat value
	});
	hostObj._$threatLevelTable.on( 'mouseout', 'tbody tr', function (event) { //User clicked on a row
		handleMouseOverOut($(this), false); //Remove highlight from all nodes with row's scaled threat value
	});

	/***
	 * This function handles the mousing over and out of a row in the Threat Scale table
	 * Highlights or de-highlights a row
	 * @param $tr (jQuery DOM) - Row object that was moused over/out
	 * @param bSet (bool) - true, highlight row; false, remove highlight
	 */
	var handleMouseOverOut = function($tr, bSet) {
		//Threat Level is in the 2nd column (column # = 1)
		var wantedScaledThreat = hostObj._$threatLevelTable.DataTable().cell($tr, 1).data();

		if (isNaN(wantedScaledThreat)) { //Cell value is not a number, which shouldn't ever happen
			//Just return
			return;
		}

		//Make sure _hostsPerScaledThreat has a 'wantedScaledThreat' proptery
		if (!hostObj._hostsPerScaledThreat.hasOwnProperty(wantedScaledThreat)) {
			return;
		}

		$.each(hostObj._hostsPerScaledThreat[wantedScaledThreat], function(index, hostNode) {
			hostObj.highlight(hostNode.hostIdx, bSet);
		});
	}; //End of var handleMouseOverOut function
}; //End of function HostDirectedGraph.prototype._setupThreatLevelTable

/**
 * Returns scaled value (0-5) of threat to determine radius multiplier
 * @param threat (integer) - Threat value to scale'
 * @returns integer - Scaled threat value
 */
HostDirectedGraph.prototype._getThreatScaled = function(threat) {
	var hostObj = this;

	if (threat == 0) { //Return 0 for no threat
		return hostObj._minScaledLevel;
	}

	var range = [hostObj._minScaledLevel + 1, hostObj._maxScaledLevel];
	var f_scale = d3.scale.ordinal().domain(g_threatDomainSet).rangePoints(range); //Scale function
	var scaled = Math.floor(f_scale(threat)); //f_scale returns floating point - We want to drop the decimal
	return scaled;
};

/**
 * Creates svg filter/feImage/feComposite tags for a background image
 * @param defs (D3 DOM element) - D3 svg defs element to use
 * @param idToCreate (string) - Dom ID to create
 * @param iconFileName (string) - Image filename (must be located the baseURL/images/icons folder
 * @param xyObj (optional/obj) - Object containing x/y property values to set on feImage x/y property. If undefined or null, will use default values (see below)
 */
HostDirectedGraph.prototype._createBGImage = function(defs, idToCreate, iconFileName, xyObj) {
	var xDefault = "4%";
	var yDefault = "7%";

	if ((typeof xyObj == "undefined") || (xyObj == null)) { //No xyObj defined (also catches null, hence == and not ===)
		//Add properties to xyObj and set default values
		xyObj = {x: xDefault, y: yDefault};
	} else {
		//Assign default values to x/y properties if they don't exist
		xyObj.x = xyObj.x || xDefault;
		xyObj.y = xyObj.y || yDefault;
	}

	defs.append("filter:filter")
		.attr("id", idToCreate)
		.attr("primitiveUnits", "objectBoundingBox")
		.attr("x", "0%")
		.attr("y", "0%")
		.attr("width", "125%")
		.attr("height", "125%");

	defs.select("#" + idToCreate).append("feImage:feImage")
		.attr("result", "sourceTwo")
		.attr("preserveAspectRatio", "xMaxYMin meet")
		.attr("width", "80%")
		.attr("height", "80%")
		.attr("x", xyObj.x)
		.attr("y", xyObj.y)
		.attr("xlink:href", g_baseURI + "/images/icons/" + iconFileName);

	defs.select("#" + idToCreate).append("feComposite:feComposite")
		.attr("in", "sourceTwo")
		.attr("in2", "SourceGraphic")
		.attr("operator", "atop");
	return;
};

/**
 * Sets the SVG circle node and link opacities, based on whether their scaled threat scores
 * are in the selected list
 * @param scaleLevel (integer) >=0 - Scale threat level to look for/change, < 0: change nodes for all threat levels
 * @param bOpqaque (bool) - true, no transparence; false, set node/link semi-transparent
 */
HostDirectedGraph.prototype._setNodeLinkOpacity = function(scaleLevel, bOpaque) {
	var hostObj = this;
	var d3_svg = d3.select("#" + hostObj._svgDomID);
	var iOpaqLevel = bOpaque?1.0:0.4;

	//Set opacity for certain nodes
	d3_svg.selectAll("circle.node")
		.filter(function(d) {
			if (scaleLevel < 0) { //We want to include all
				return true;
			}
			return d.scaledThreat == scaleLevel;
		})
		.transition()
		.attr("opacity", iOpaqLevel) //Set opacity here
		.duration(500) //500ms - Animate fade
		.delay(0);

	//Set opacity for certain links
	d3_svg.selectAll("line.link")
	.filter(function(d) {
		if (scaleLevel < 0) { //We want to include all
			return true;
		}
		return d.source.scaledThreat == scaleLevel;
	})
	.transition()
	.attr("opacity", iOpaqLevel) //Set opacity here
	.duration(500) //500ms - Animate fade
	.delay(0);

	return;
}
