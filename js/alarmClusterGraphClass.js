/* This file contains the definition for the Alarm Clustre Graph class
 * See constructor for public and private members
 * 
 * Public methods (function properties):
 *  AlarmClusterGraph
 *  execute
 *  
 * Private methods (function properties):
 *  _createGraph
 * 
 */

/*
* Constructor
* @param paramObj (object) - Object that should contain the following properties (required unless stated otherwise)
* 	graphDOMID (string) - DOM ID of the element to put the graph (No leading #)
*   graphData (mixed) - The alarm/notif data (Should contain object structure as follows:
*   	{
*   		"name":<alarm type (string)>,
*   		"info":<alarm info object (from model/gui/mAlarmDetails.php alarmTypeData/Data structure)>,
*   		"type":AlarmClusterGraph.TYPE_ALARM or AlarmClusterGraph.TYPE_NOTIF
*   		"children": {[ //Notifications
*   			{ //Notification 1
*   				"name":<notification 1 type (string)>,
*   				"info":<notification 1 info object (from model/gui/mAlarmDetails.php  notifData/Data structure)>
*					"children": [{ //Source and Target hosts
*						"name":<source host name (string)>
*						"info":{"hostType":AlarmClusterGraph.HOST_SOURCE, "ip": <Source IP address (string)>, "idx": <Source host idx (integer)>},
*					},{
*						"name":<target host name (string)>
*						"info":{"hostType":AlarmClusterGraph.HOST_TARGET, "ip": <Target IP address (string)>, "idx": <Target host idx (integer)>},
*					}]
*   			},
*   			{  ... other notifications ...}
*   		]}
*    
*/
function AlarmClusterGraph(paramObj) {
	if ((paramObj.graphDOMID == null) || (paramObj.graphData == null)) { //Not using === because we want to check against null AND undefined
		alert("graphDOMID and/or graphData parameter null or undefined");
		return;
	}
	
	//The DOM ID of the element to use
	this._graphDOMID = paramObj.graphDOMID;
	
	this._busyIndicator = paramObj.busyIndicator;
	
	//The jQuery DOM element to put the graph
	this._$graphDOM = $("#" + paramObj.graphDOMID);
	
	//Tooltip
	// this._tooltip = new adAPTToolTip();
			
	//Graph data
	this._graphData = paramObj.graphData;
	
	this._notifPlural = (this._graphData.children.length == 1)?"":"s";
} //End of constructor

/***************************
 * 'Static' members
****************************/
AlarmClusterGraph.TYPE_ALARM = 0;
AlarmClusterGraph.TYPE_NOTIF = 1;
AlarmClusterGraph.TYPE_HOST = 2;
AlarmClusterGraph.HOST_SOURCE = 0;
AlarmClusterGraph.HOST_TARGET = 1;

/***************************
 * 'Static' methods
****************************/

/***************************
* Public Non-Static/Instance methods
****************************/
/*
 * Creates the cluster graph and handles the behavior/events
 */
AlarmClusterGraph.prototype.execute = function() {
    var clusterObj = this; //Reference to this alarm object instance
    
    clusterObj._createGraph();
}; //End of AlarmClusterGraph.prototype.execute function
 
/***************************
* Private Non-Static/Instance methods
****************************/
/**
 * Function that creates the actual graph
 */
AlarmClusterGraph.prototype._createGraph = function() {
	var clusterObj = this;
    var mLeft = 20;
    var mRight = 260;
    var mTop = 50;
    var width;
    var height;	
    
    //Set height of graph dynamically - Number of notifications * 50px per notification, then add top margin
    clusterObj._$graphDOM.css('height',(clusterObj._graphData.children.length * 50) + mTop);
    //Set width and height variables to width/height of graph
    width = clusterObj._$graphDOM.width();
    height = clusterObj._$graphDOM.height();	
    
    var cluster = d3.layout.cluster()
	    .separation(function(a, b) { 
	    		return a.parent === b.parent ? 5 : 7; 
	    })
    	.size([height - mTop, width - mRight]); //-mTop to fit 'column' headers, -mRight to fit host texts

    //This is the function to draw the curved line between nodes
    var diagonal = d3.svg.diagonal()
    	.projection(function(d) { return [d.y, d.x]; });

    //Append svg node to the appropriate DOM
    var svg = d3.select("#" + this._graphDOMID).append("svg")
    	.attr("width", width)
    	.attr("height", height)
    	.attr("class", "cluster_svg")
    	.append("g")
    	.attr("transform", "translate(" + mLeft + "," + mTop + ")"); //Make room for top/left margins

    var nodes = cluster.nodes(clusterObj._graphData);
    var links = cluster.links(nodes);

    //Create links
	var link = svg.selectAll(".link")
	    .data(links)
	    .enter().append("path")
	    .attr("class", "link")
	    .attr("d", diagonal);
	
	//Create nodes
	var node = svg.selectAll(".node")
	    .data(nodes)
	    .enter().append("g")
	    .attr("class", "node")
	    .attr("transform", function(d) { 
	    	return "translate(" + d.y + "," + d.x + ")"; 
	    })
	    .attr("id", function(d, i) {
	    	return "id_node__" + i;
	    })
	    .on("click", function(d) {
	    	switch (d.depth) {
	    		case AlarmClusterGraph.TYPE_NOTIF:
	    			//Redirect to Notification details page
	    	        window.location = g_vNotifDetailsPage() + "?idx=" + d.info.idx;
	    	        break;
	    		case AlarmClusterGraph.TYPE_HOST:
	    			if (d.info.idx >= g_monitoredStartIdx) {
	    				//Redirect to Host details page {
	    				window.location = g_vHostDetailsPage() + "?idx=" + d.info.idx;
	    			} else { //Non-monitored host
	    				if (g_iScriptedDemo !== 1) { //Not a scripted demo, and for now, we're disabling geolocation for normal op
								return; //Do nothing
							}
	    				//Pull up geolocation info
	    				//Create new geoLocationIP object and call its execute function
						var geoLocationIPObj = new GeoLocationIP([d.info.ip]);
//var geoLocationIPObj = new GeoLocationIP(["163.109.157.183"]);
						geoLocationIPObj.execute();
	    			}
	    	        break;
	    		default: //Including TYPE_ALARM
	    			//Ignore
	    			break;
	    	}
	    })  
	    .on("mouseover", function(d) {
	    	// clusterObj._tooltip.show();
	    		    	
	    	if ((d.depth == AlarmClusterGraph.TYPE_HOST) && (d.info.idx < g_monitoredStartIdx)) { //Unmonitored host node
	    		// clusterObj._tooltip.d3Tooltip.style("width", "150px");
				// clusterObj._tooltip.d3Tooltip.html("Click to geolocate this umonitored host");
				// clusterObj._tooltip.d3Tooltip.style("font-size", "14px");
				// clusterObj._tooltip.center(this, "left", -18, true);
			} else { //Alarm, notification, or monitored host node. Create a table
				// var id_table = "id_tooltip_table";
				// clusterObj._tooltip.d3Tooltip.append("table").attr("id", id_table).style("width", "100%");

				switch (d.depth) {
        			case AlarmClusterGraph.TYPE_ALARM:
        				d3.select(this).style("cursor", "default"); //Make cursor default since alarm node click event will be ignored
        				// clusterObj._tooltip.d3Tooltip.style("width", "350px");
        				var columns = {
        		         	"columnNames":["Alarm Type","Description","Time Stamp","Host","Severity","Host IPs","Rule Description","Rule Number"],
        		         	"columnMaps":["alarmType","alarmDesc","time","host","severity","hostIPs","ruleDesc","ruleNum"]
        		     	};
        				// g_createInfoTable(id_table, d.info, columns);
        				// clusterObj._tooltip.center(this, "top", -12, true);
        				break;
        			case AlarmClusterGraph.TYPE_NOTIF:
        				// clusterObj._tooltip.d3Tooltip.style("width", "350px");
        				var columns = {
        		         	"columnNames":["Notification Type", "Description","Time Stamp","Source Host","Source IP","Target Host", "Target IP", "Protocol"],
        		         	"columnMaps":["notifType","notifDesc","time","source","sourceIP","target","targetIP","appName"]
        		     	};
        				// g_createInfoTable(id_table, d.info, columns);
        				// clusterObj._tooltip.center(this, "left", -18, true);
        				break;
        			case AlarmClusterGraph.TYPE_HOST: //Non-monitored hosts are handled above
    					// clusterObj._tooltip.d3Tooltip.style("width", "100px");
    					//Create info table
        				var columns = {
        		         	"columnNames":["IP"],
        		         	"columnMaps":["ip"]
        		     	};
        				// g_createInfoTable(id_table, d.info, columns);
        				// clusterObj._tooltip.center(this, "left", -18, true);
        				break;
    			} //End of switch
			} //End of else of (if ((d.depth == AlarmClusterGraph.TYPE_HOST) && (d.info.idx < g_monitoredStartIdx)))
        }) //End of on mouseover
        .on("mouseout", function(d) {
        	//Hide tooltip
        	// clusterObj._tooltip.hide();
        });
	
	node.append("circle")
	    .attr("r", function(d) {
	    	return (d.depth == AlarmClusterGraph.TYPE_HOST)?7:4.5;
	    });
	
	//Append circle label drop shadows and text as well as text in host circles
	for (iTextCount = 0; iTextCount <= 1; ++iTextCount) { //Note: iTextCount == 0 is for shadow; iTextCount == 1 is for regular text on top of shadow
		node.append("text") //Text shadow comes first
		.attr("dx", 8)
	    .attr("dy", 3)
	    .style("text-anchor", "start")
		.classed("shadow", (iTextCount == 0)?true:false) //Add shadow for iTextCount = 0
		.text(function(d) { 
	    	var retVal = d.name;
	    	if ((d.depth == AlarmClusterGraph.TYPE_HOST) && (d.info.idx < g_monitoredStartIdx)) { //Unmonitored host
	    		//Add IP address
	    		retVal += " - " + d.info.ip;
	    	}
	    	return retVal; 
		});
		
		//Add 's'ource and 't'arget letters in the host circles
		node.filter(function(d) { return d.depth == AlarmClusterGraph.TYPE_HOST; })
		.call(function(hostNodes) {
			hostNodes.append("text") //Text shadow comes first
			.attr("dx", 0)
			.attr("dy", 4)
			.style("text-anchor", "middle")
			.classed("shadow", (iTextCount == 0)?true:false) //Add shadow for iTextCount = 0
			.text(function(d) { 
				return (d.info.hostType == AlarmClusterGraph.HOST_SOURCE)?"s":"t";
			});
		}); //End of node.filter.call
	} //End of iTextCount for

	//Create header columns
	createHeaderColumns();
	
	// clusterObj._busyIndicator.stop();
	
	/******************************************************
	 * FUNCTIONS
	 ******************************************************/
	/**
	 * Creates the header 'columns' for the cluster graph
	 * @param leftArray (array) - Array containing css 'left' values for Alarm, Notifications, and Hosts headers
	 */
	function createHeaderColumns(leftArray) {
		var textArray = ["Alarm", "Notification"+clusterObj._notifPlural, "Hosts"];
		//Get left offsets of the alarm node, the first notification node, and the first host node
		var a1 = d3.select(node[0][0]).node().getBoundingClientRect().left; //Left attribute of the alarm node bounding box
		var n1 = d3.select(node[0][1]).node().getBoundingClientRect().left; //Left attribute of the first notification node bounding box
		var h1 = d3.select(node[0][node[0].length - 1]).node().getBoundingClientRect().left; //Left attribute of the last node (which is a host node) bounding box
		var alarmLeft = mLeft;
		var notifLeft = alarmLeft + n1 - a1;
		var hostLeft = notifLeft + h1 - n1;
		var leftArray = [alarmLeft, notifLeft, hostLeft];
		
		//Create headers for each cluster node grouping
		for (var iHeaderCount = AlarmClusterGraph.TYPE_ALARM; iHeaderCount <= AlarmClusterGraph.TYPE_HOST; ++iHeaderCount) {
			var leftVal = leftArray[iHeaderCount];
			var htmlVal = textArray[iHeaderCount];
			
			var div = $("<div></div>")
				.css("position", "absolute")
				.css("left", leftVal)
				.css("top", 10)
				.css("text-align", "left")
				.css("font-style", "italic")
				.css("font-weight", "bold")
				.attr("id", "id_clustHeader__" + iHeaderCount)
				.html(htmlVal);
			
			clusterObj._$graphDOM.append(div);
		} //End of iHeaderCount for
		
		//Add header table for host column
		var hostTable = 
			"<div style='width:5em;float:right;margin-left:0.5em;position: relative;top:-4px;'>" + 
				"<table id='id_hostHeaderTable' class='smallHeaderTable' style='border:none'>" +
					"<tr style='border:none;'>" +
						"<td></td>" +
						"<td>Source Host</td>" +
						"<td>&nbsp;</td>" +
						"<td></td>" +
						"<td>Target Host</td>" +
					"</tr>" +
				"</table>" + 
			"</div>";
				
		//Append table to the host column
		$("#id_clustHeader__" + AlarmClusterGraph.TYPE_HOST).append(hostTable);
		
		var width = 25, height = 25, radius = 7;
		var tds = [1, 4]; //We want to put svg circles on the first and fourth tds
		//Add svg circles
		for (var iTDCount = 1; iTDCount <= tds.length; ++iTDCount) {
			var headerNode = d3.select("#id_hostHeaderTable tr td:nth-child(" + tds[iTDCount - 1] + ")").append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("class", "cluster_svg")
				.append("g")
				.attr("class", "node");
			
			headerNode.append("circle")
				.attr("cx", width / 2)
				.attr("cy", height / 2)
				.attr("r", radius);
			
			//Add 's' and 't' text with shadow
			for (iTextCount = 0; iTextCount <= 1; ++iTextCount) {
				headerNode.append("text") //Text shadow comes first
					.attr("dx", 12)
					.attr("dy", 16)
					.style("text-anchor", "middle")
					.classed("shadow", (iTextCount == 0)?true:false) //Add shadow for iTextCount = 0
					.text(function(d) { 
						return (iTDCount == 1)?"s":"t";
					});
			} //End of iTextCount for
		} //End of iTDCount for
	} //End of function createHeaderColumns
} //End of AlarmClusterGraph.prototype._createGraph function 