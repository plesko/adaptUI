(function(globals) {
	globals.killArray = []; //To be filled in by dashboard.php
	
	globals.summaryTitle = function(unixTime, dataType, interval) { 
		var dFrom = g_getFormattedDate(new Date(unixTime * 1000), true);
		var dTo = g_getFormattedDate(new Date((unixTime + interval-1) * 1000), true);
		return (dataType == 0 ? "Alarms" : "Notifications") + " from<br/>" + dFrom + " to " + dTo;
	};
	
	globals.chart = function(json) {
	 	if (json == null) {
    		return;
    	}
    	
		var chartCount = 0; 
		for (var graph in json.graphing)
		{
			var graphType = json.graphing[graph].type;
			var graphData = json.graphing[graph].data;
			++chartCount;
			switch(graphType)
			{
				case "SCATTER":
//					scatterGraph(graphData, chartCount);
					break;
				case "BAR":
//					barGraph(graphData,chartCount);
					break;
				case "COLUMN":
//					columnGraph(graphData,chartCount);
					break;
				case "TIME":
					timeGraph(graphData,chartCount);
					break;
				case "HIST":
				default:
					break;
			}
		}
	};
	
	globals.asyncCharts = function(json, callback, div)
	{
		var divName;
		if(div == null)
		{
			div = "timeLine";
			divName = "#timeLine";
			
		}
		else
		{
			divName = "#" + div;
		}

		if($(divName).length > 0) {}
		else
		{
			d3.select("#main")
				.append("div")
				.attr("id", div);
		}
		var chartCount = 0; 
		
		for (var graph in json.graphing)
		{
			var graphType = json.graphing[graph].type;
//			var graphData = json.graphing[graph].data;
			++chartCount;
			switch(graphType)
			{
				case "TIME":
					timeGraph(json,callback,divName, chartCount);
					break;
				default:
	//				timeTable(json,callback,divName);
					break;
			}
		}
		switch(div)
		{
			case "id_recentNotifsTable":
			case "id_recentAlarmsTable":
				if(json.data.length != 0) {
					timeTable(json,callback,divName);
				}
				break;
			case "hostMapContainer":
				hostMap(json, callback, divName);
				break;
			default:
				break;
		}
	};
	
	/**************************************************************
	 * Host Threat Heat Map
	 **************************************************************/
	globals.hostMap = function (dataset, callback, div)
	{
		var baseR = 5;
		var tooltip = new adAPTToolTip("id_hosttooltip");
		var data = dataset.data;
		
		//Get highest alarm count and set up r_scale (radius scale for the host circles)
		var iHighestAlarmCount = d3.max(data, function(d) { return d.numberOfAlarms; }); //Used in host circle radius scaling 
		var iHighestRadius = 25;
		var r_scale = d3.scale.sqrt().domain([0, iHighestAlarmCount]).range([baseR, iHighestRadius]); //Scale function

		var margin = {
				top: 15 + iHighestRadius, 
				right: 20 + iHighestRadius, 
				bottom: 95 + iHighestRadius, 
				left: 50 + iHighestRadius
		};
		var width = $(div).width() - margin.left - margin.right;
		var height = $(div).height() - margin.top - margin.bottom;
		
		//Set up hostmap slider placement and show slider
		$("#id_hostmapSlider").css({
			"left": margin.left,
			"width": width		
		});
		$("#id_hostmapSlider").show();
		//Show subtitle (Subrange info)
		$("#id_hostMapSubTitle").show();
		
		createResetZoomBtn(); //Create reset zoom button

		//Set up x-axis scale
		var xScale = d3.time.scale() ///x-axis is date
			.domain([new Date(dataset.startTimeStamp), new Date(dataset.endTimeStamp)])
			.range([0,width])
			.nice(d3.time.day);
        
		//Set up y-axis scale
		var yScale = d3.scale.linear() //y-axis is threat score
			.domain([0, g_maxPossibleThreatScore])
			.range([height, 0]);
    
		//Create xAxis
		var xAxis = d3.svg.axis() 
			.scale(xScale)
			.orient("bottom")
			.ticks(10)
			.tickFormat(function(d){
				var dateOnlyFormat = d3.time.format("%Y/%m/%d");
				var dateTimeFormat = d3.time.format("%Y/%m/%d %H:%M:%S");
				var newFromTS = xScale.domain()[0].getTime();
				var newToTS = xScale.domain()[1].getTime();
				var numDaysCovered = Math.ceil(((newToTS - newFromTS) / 1000) / 24/ 60 /60); //Number of days (rounded up) covered by new timescale
				//New tick label format depends upon number of days covered by new range
				//<= 7 days, include time; > 7 days, just use date
				var newFormat = (numDaysCovered <= 7)?dateTimeFormat:dateOnlyFormat;

				return newFormat(d);
			});
	
		//Create yAxis
		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(5);
		
		//Create zoom behavior
		var zoom = d3.behavior.zoom()
			.x(xScale)
			.scaleExtent([1, 250])
			.on("zoom", zoomed);
		
		//Create drag behavior
		var drag = d3.behavior.drag()
			.on("drag", function(d) {
				var ele = d3.select(this);
				ele.style("cursor", "grabbing");
				
				tooltip.hide();
			})
			.on("dragstart", function(d) {
				d3.event.sourceEvent.stopPropagation(); // silence other listeners
			})
			.on("dragend", function(d) {
				var ele = d3.select(this);
				ele.style("cursor", "grab");
			});

		//Key function - returns hostIdx
		var key = function(d){
			return d.hostIdx;
		};
		
		//Create svg element
		var svg = d3.select(div)
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("id", "id_hostMapViewArea")
				.attr("transform","translate(" + margin.left + "," + margin.top + ")");	
		
		//Add gradiant
		var defs = svg.append("defs");
 		var grad = defs.append("linearGradient")
			.attr("id", "g391")
			.attr("x1", "0%")
			.attr("x2", "100%")
			.attr("y1", "100%")
			.attr("y2", "0%");
		grad.append("stop")
				.style("stop-color", "#FFFF00")
				.attr("offset", "0%");
		grad.append("stop")
		.style("stop-color", "#FF0000")
		.attr("offset", "100%");
		
		svg.append("rect") //Append a rectangle and put the gradiant in it
			.attr("x",-1 * iHighestRadius) //X - Start at 0 - iHighestRadius to account for overflow of largest circle
			.attr("y",0 - iHighestRadius) //Y - Start at 0 - iHighestRadius to account for overflow of largest circle
			.attr("width", width + iHighestRadius * 2) //Width - Account for overflow of the radius of the largest circle (* 2 for both right and left sides)
			.attr("height", height + iHighestRadius * 2) //Height - Account for overflow of the radius of the largest circle (* 2 for both top and bottom))
			.style("cursor", "grab")
			.attr("fill", "url(#g391)")
			//User can drag/zoom the rectangle (main part of graph)
			.call(drag)
			.call(zoom);
		
		//Append x-axis to graph
		svg.append("g") //x-axis
			.attr("id", "id_xaxis")
			.attr("class", "x axis")
			.style("cursor", "grab")
			.attr("transform", "translate(0," + (height + iHighestRadius) + ")") //Account for overflow of circle with highest raidus
			//User can drag/zoom on the x-axis
			.call(drag)
			.call(zoom)			
			.call(xAxis);

		//Format X-Axis tick labels
		formatXAxisTickLabels();
		
		//Add x-axis label
		svg.append("text") //x-axis label
			.attr("class", "hostbubbleaxis-label")
			//Bottom left
			.attr("x", 0)
			.attr("y",  height + iHighestRadius + 30)
			.attr("dx", "-1em")
			.style("text-anchor", "end")
			.text("Date");
		
		//Append y-axis to graph
  		svg.append("g") //y-axis
			.attr("id", "id_yaxis")
			.attr("class", "y axis")
			.attr("transform", "translate(" + (-1 * iHighestRadius) + ", 0)") //-iHighestRadius to account for overflow of circle with highest raidus
			.call(yAxis);
		
  		//Add y-axis label
		svg.append("text") //y-axis label
			.attr("class", "hostbubbleaxis-label")
			.attr("text-anchor", "end")
			.attr("y", 0 - margin.left)
			.attr("x", 0)
			.attr("dy", "1em")			
			.attr("transform", "rotate(-90)")
			.text("Threat Score");	
		
		//Add dashed line axis 'extensions' to corners of graph - All to account for overflow of highest possible radius of a circle
		svg.append("path")
			.attr("d", function() { //Path instructions - See https://www.dashingd3js.com/svg-paths-and-d3js for list
				var szPath = "";
				var data = [
				    {x1: -1 * iHighestRadius, y1: height + iHighestRadius, x2: 0, y2: height + iHighestRadius}, //Horizontal bottom left
				    {x1: width, y1: height + iHighestRadius, x2: width + iHighestRadius, y2: height + iHighestRadius}, //Horiztonal bottom right
				    {x1: 0 - iHighestRadius, y1: height, x2: 0 - iHighestRadius, y2: height + iHighestRadius}, //Vertical bottom left
				    {x1: 0 - iHighestRadius, y1: 0, x2: 0 - iHighestRadius, y2: -iHighestRadius} //Vertical top right
				];

				//Create the path instructions
				$.each(data, function(index, coord) {
					szPath += "M" + coord.x1 + "," + coord.y1; //'M' = Move pen (absolute coordindates)
					szPath += "L"  + coord.x2 + "," + coord.y2; //'L' = Draw line (absolute coordindates)
				});
		
				return szPath;
			})
			.style("stroke-dasharray", ("3, 3"))
			.attr("stroke", "black");
		
		 //Set up host bubbles
		 var circles = svg.selectAll("circle")
			.data(data ,key)
			.enter()
			.append("circle")
			.attr("class", "hostbubble")
			.attr("cx", function(d){ 
				return xScale(new Date(d.lastAlarmDate * 1000));
			})
			.attr("cy", function(d){ 
				return yScale(d.threatScore);
			})
			.style("stroke", "silver")
			.style("stroke-width", "1px")
			.attr("r", function(d) { 
				return r_scale(d.numberOfAlarms);
			})
			.on("click", function(d) {
				if (d3.event.defaultPrevented) { // click suppressed - for drag
					return; 
				}
				
				var url = g_vHostDetailsPage() + "?idx=" + d.hostIdx;
		        window.location = url; //Load host details page 
		 	})
			.on("mouseover", function(d) {
				var id_table = "id_hostCircle_popupTable";
				
				//Add 'highlighted' class to node
				var curNode = d3.select(this);
				curNode.classed("highlighted", true);
				
				//Set up and show tooltip
				tooltip.show();
				tooltip.d3Tooltip.append("table").attr("id", id_table).style("width", "100%");
				tooltip.d3Tooltip.style("width", "300px");
				//Table column names and the column name -> data property mappings
				var columns = {
		         	"columnNames":["Host", "Threat Score", "Highest Severity", "Asset Criticality", "Number of Alarms", "Last Alarm Date", "Last Alarm Type"],
		         	"columnMaps":["host", "threatScore", "severity", "assetCrit", "alarmCount", "lastAlarmDate", "lastAlarmType"]
		     	};
				//Table data
				var data = {
					"host": d.hostName,
					"threatScore": d.threatScore,
					"severity": d.highestAlarmSeverity, 
					"assetCrit": d.assetCrit,
					"alarmCount": d.numberOfAlarms,
					"lastAlarmDate": g_getFormattedDate(new Date(d.lastAlarmDate * 1000), true),
					"lastAlarmType": d.lastAlarmType
				};
				
				g_createInfoTable(id_table, data, columns);
				
				if ($(this).attr("cx") >= width / 2) { //Circle is on the right half of the graph
					//Put tooltip to the left of node
					tooltip.center(this, "left", -19, true);
				} else { //Circle is on left half of the graph
					//Put tooltip to the right of the node
					tooltip.center(this, "right", 19, true);
				}
        	}) 
        	.on("mouseout", function(d) {
        		//Remove 'highlighted' class from node
				var curNode = d3.select(this);
				curNode.classed("highlighted", false);
        		
        		tooltip.hide();
			})
			//User can drag/zoom from a node
			.call(drag)
			.call(zoom);

		 //Enable 'Within X Days' button and associated text input
		 $("#id_hostgraph_days_btn").removeAttr("disabled");
		 $("#id_hostgraph_days_input").removeAttr("disabled");
		 
		 /*******************************************
		  * Host map functions
		  ******************************************/
		 /**
		  * Creates and sets up the Reset Zoom button
		  */
		 function createResetZoomBtn() {
			 //Create input button
			 d3.select(div).append("input")
			 	.attr("id", "id_resetzoom_btn")
			 	.attr("type", "button")
			 	.attr("value", "Reset Graph")
			 	.attr("disabled", "disabled")
			 	.style("font-size", "12px")
			 	.style("position", "absolute")
				//Bottom right - below graph
				.style("right", (0 + margin.right) + "px")
				.style("top", (height + margin.bottom + 10) + "px");
			 
			//Clicking on the reset zoom button
			$("#id_resetzoom_btn").on("click", function() {
				var sliderValues = $("#id_hostmapSlider").slider("option", "values");
				$("#id_hostmapSlider").slider("option", "values", sliderValues);
				$("#id_resetzoom_btn").attr("disabled", "disabled");
			});
		 } //End of function createResetZoomBtn
		 
		 /**
		  * Function called when the user zooms in on the host map
		  */
		 function zoomed() {
			//Update xAxis
			svg.select(".x.axis").call(xAxis);
			
			//Create new x-axis ticks and format their labels
			formatXAxisTickLabels();
			
			//Reposition nodes and only display those whose lastAlarmDate falls within the new date range
			circles
				.attr("cx", function(d){ 
					return xScale(new Date(d.lastAlarmDate * 1000));
				})
				.attr("cy", function(d){ 
					return yScale(d.threatScore);
				})
				.style("display", function(d) {
					var newFromTS = xScale.domain()[0].getTime();
					var newToTS = xScale.domain()[1].getTime();
					var nodeTS = new Date(d.lastAlarmDate * 1000).getTime();
					
					return ((nodeTS >= newFromTS) && (nodeTS <= newToTS))?null:"none";
				});
			$("#id_resetzoom_btn").removeAttr("disabled");					
		} //End of function zoomed
		 
		/**
		 * Formats the X-Axis tick labels
		 */
		function formatXAxisTickLabels() { 
			d3.select("#id_xaxis").selectAll("text") //Rotate x-axis tick labels again
				.style("text-anchor", "end")
				.call(d3TextWrap)
				.attr("transform", function(d) {
					return "rotate(-65)"; 
				});
		} //End of function formatXAxisTickLabels
	}; //End of globals.hostMap

	/**************************************************************
	 * Time Bar Graphs
	 **************************************************************/
	globals.timeGraph = function (json, callback, div, chartNumber)
	{
		var dataset = json.graphing["TimeData"].data;
		var timeSliceData = json.timeSliceData;
		var name = (callback.dataType == g_dataTypeAlarm) ? "Alarms" : "Notifications";
		var margin = {
				top: 20, 
				right: 25, 
				bottom: 50, 
				left: 50
		};
		var width = $(div).width() - margin.left - margin.right;
		var height = $(div).height() - margin.top - margin.bottom;
		var tooltip = new adAPTToolTip("id_barGraphPopup");
		var timeFormat = "%H:%M:%S";
   		var gClass = ""+div.substr(1)+"bar";

   		//Add title
        var title = d3.select(div)
        	.append("div")
        	.attr("class", "timeChartTitle")
        	.text(callback.title);
    
        //Append svg canvas
        var svg = d3.select(div)
        	.append("svg")
        	.attr("width", width + margin.left + margin.right)
        	.attr("height", height + margin.top + margin.bottom)
        	.append("g")
				.attr("transform","translate(" + margin.left + "," + margin.top + ")");	;
   		
   		//Add x-axis label
		svg.append("text") //x-axis label
			.attr("class", "timegraphaxis-label")
			//Bottom left
			.attr("x", width / 2)
			.attr("y",  height + 35)
			.attr("dx", "-1em")
			.style("text-anchor", "middle")
			.text("Date");

		//Add y-axis label
		svg.append("text") //y-axis label
			.attr("class", "timegraphaxis-label")
			.attr("text-anchor", "middle")
			.attr("y", 0 - margin.left)
			.attr("x", -(height / 2))
			.attr("dy", "1em")			
			.attr("transform", "rotate(-90)")
			.text("Number of " + name);		
		
        //call setupBarGraph
        setupBarGraph();

        //Add instructions to summary divs
		d3.select("#id_summaryText_" + ((callback.dataType == g_dataTypeAlarm)?"alarm":"notif"))
			.html("Please click on " + ((callback.dataType == g_dataTypeAlarm)?"an alarm":"a notification")  + " bar to see a summary of that time range");

        //Every groupingInterval seconds, get new data and call setupBarGraph function
        window.setInterval(function() { 
        	var numxs = dataset.length;
        	//New start timestamp is timestamp of second entry of data set. We are removing the first timestamp
        	var newStartTimeStamp = dataset[1].y;
        	
        	//New end timestamp is the last timestamp in the group plus (twice the groupingInterval - 1)
        	//Note: - 1 to retrieve only one grouping, otherwise we'd get two 
        	var newEndTimeStamp = dataset[numxs - 1].y + ((callback.groupingInterval * 2) - 1);

        	var callbackURL = callback.url + "?startTimeStamp=" + newStartTimeStamp + 
        		"&dataType=" + callback.dataType + "&endTimeStamp=" + 
        		newEndTimeStamp + "&groupingInterval=" + callback.groupingInterval;
        	
            d3.json(callbackURL, function (json){
            	svg.selectAll("g."+gClass).remove(); //Clear out bars
            	svg.selectAll(".axis").remove(); //Clear out axes

            	dataset = json.graphing.TimeData.data;
            	timeSliceData = json.timeSliceData;
            	
                setupBarGraph();
            });        	
        }, callback.groupingInterval * 1000);
        
        /***********************************************
         * timeGraph functions
         ***********************************************/
        /**
         * Draws the kill chain widgets
         */
        function drawKillChain() {
			var baseKill = d3.select("#killChain");
			
			baseKill.text("");
			
			//Create kill chain bubbles
			var killdiv = baseKill.selectAll("div")
			.data(killArray)
			.enter()
			.append("div")
			.attr("class", "killChainIcon")
			.attr("id", function(d,i) { return "kill" + d.idx;})
			.text(function(d) { return d.name;});
			
			//Add kill chain number divs to each kill chain bubble
			killdiv.append("div")
				.attr("class", "killChainNumOuterDiv")
				.style("opacity", function(d){ if (d.number == 0) return 0.0; else return 0.9;})
				.append("div")
				.attr("class", "killChainNumInnerDiv")
				.text(function(d) { return d.number;});
		} //End of function drawKillChain
         
        /**
         * Reset values of all killchain steps to 0
         */
   		function resetKillChain() {
   			$.each(killArray, function(index, killChain) { 
   				killChain.number = 0;
   			});
   		} //End of function resetKillChain

   		/**
   		 * Increment number of alarm in specific killchain step
   		 * @param idx (integer) - Kill chain idx to use
   		 */
		function addToKillChain(idx) {
			//Find idx in killchain array
			var result = killArray.filter(function( obj ) {
			  return obj.idx == idx;
			});

			if (result.length > 0) { //Killchain idx found
				//Increase number for this killchain object and redraw the killchain
				result[0].number++;
			}
        }
        
        /**
         * Creates the bar graph (alarm or notification)
         */
        function setupBarGraph() {
        	//X-axis stuff is set up here because its tick values need to move
            var xScale = d3.time.scale()
//        		.domain(d3.extent(dataset, function(d){return new Date(d.y * 1000);}))
        		.domain(function() {
        			//Earliest time is earliest d.y and latest time is latest d.y + callback.groupingInterval
        			var minTime = d3.min(dataset, function(d) {return new Date(d.y * 1000)});
        			var maxTime = d3.max(dataset, function(d) {return new Date((d.y + callback.groupingInterval) * 1000)});

        			return [minTime, maxTime];
        		}())
        		.range([0, width]);
            
       		var xAxis = d3.svg.axis()
       			.scale(xScale)
       			.orient("bottom")
       			.ticks(5)
       			.tickFormat(d3.time.format(timeFormat));
        	
	   		//Append xAxis to svg element
	   		svg.append("g")
	   			.attr("id", "id_yaxis")
	   			.attr("class", "axis")
	   			.attr("transform", "translate(0," + height + ")")
	   			.call(xAxis);
	   		
			//Create yScale and yAxis
	        var yScale = d3.scale.linear()
	            .domain([0, d3.max(dataset, function(d) { return d.x;}) + 1 ]) //+ 1 to give illusion of 'room for growth'
	            .range([height,0])
	            .nice(5);//Make round numbers
	        
			var yAxis = d3.svg.axis()
				.scale(yScale)
				.orient("left")
				.ticks(5)
				.tickFormat(d3.format("d"));

        	//Append yAxis to svg element
	   		svg.append("g")
	   			.attr("id", "id_xaxis")
				.attr("class", "axis")
				.attr("transform", "translate(0,0)")
				.call(yAxis);
	   		
	   		//Add bars
	   		var bars =	svg.selectAll("g."+gClass)
//	   			.data(dataset,key); //We cannot use the key/exit/transition because previous time values could still get new data - Plus we wiped the bars away
	   			.data(dataset);
	   		
	        if (callback.dataType == g_dataTypeAlarm) {
	        	resetKillChain();
	        }

			var g = bars.enter()
		   		.append("g")
		   		.attr("class", gClass);
			//Add solid bars
	        g.append("rect")
	        	.attr("id","solid")
	            .attr("x", function(d) {
	            	return xScale(new Date(d.y * 1000));
	             })
	             .attr("y", function(d,i) {
	            	 return yScale(d.x);
	             })
	             .attr("width", width / dataset.length - 0.1)
	             .attr("height", function(d) {
	            	 var val = height - yScale(d.x);
	            	 
	            	 //If val is 0, make val 1. This is so the bar will appear on the graph and not end up on the side.
	            	 //For some reason, when val = 0 (i.e, height of bar is 0), the bar ends up at x = 0 and the div for 
	            	 //the parent 'g' node has a huge width.
	            	 //We will add a display attribute to hide the node in this case
	            	 return (val == 0)?1:val; 
	             })
	             .attr("stroke", "#000000")
	             .attr("fill", callback.highlightColor.substr(0,5) + "00")
	             .attr("display", function(d) {
	            	 //Hide the node if d.x = 0; otherwise, remove 'display' attribute
	            	 return (d.x == 0)?"none":null;
	             })
	             .each(function(d, i) { //Add to killchain if need be
	            	 if (callback.dataType == g_dataTypeAlarm) {
		            	 //Now create mTimeTable data structure from timeSliceData
		            	 var data = timeSliceData.data[d.y].data.rowData; //Data from the specific bar clicked
		            	 $.each(data, function(index, alarmInfo) { 
		            		 addToKillChain(alarmInfo.killChainIdx);
		            	 });
	            	 }
        		 });
	        
	        if (callback.dataType == g_dataTypeAlarm) {
	        	drawKillChain();
	        }
	        
	        //Add 'invisible' bars, which show up upon mouse over
	        g.append("rect")
	        	.attr("id", "invis")
				.attr("x", function(d, i) {
	   				return xScale(new Date(d.y * 1000));
	   			})
	   			.attr("y", function(d,i) {
	   				return 0;
	   			})
	   			.attr("width", width / dataset.length - 0.1)
	   			.attr("height", height)
	   			.attr("fill-opacity", "0.0")
	   			.attr("pointer-events", "all") 
	   			.attr("class", "highlightBar");
        
	        //Handle bar events
	        g.on("mouseover", function(d) {
	        	if (d.x == 0) { //No alarm/notification for this time slice
	        		//Change cursor to hand/pointer icon
	        		$(this).css('cursor', 'default');
	        	}
	        	
	        	tooltip.show();
	        	tooltip.d3Tooltip.style("width", "200px");
	        	var id_table = "id_barpopupInfoTable";
	        	
	    		//Append table element to popup
	        	tooltip.d3Tooltip.append("table").attr("id", id_table).style("width", "100%");
	    		//Set up column names and column names -> data properties mappings
	    		var columns = {
	             	"columnNames":["Number of " + name, "Time Range"],
	             	"columnMaps":["count", "timeRange"]
	         	};
	    		//Table data
	    		var popupData = {
	    			"count": d.x,
	    			"timeRange": function() {
	    	    		var dFrom = g_getFormattedDate(new Date(d.y * 1000), true);
	    	    		var dTo = g_getFormattedDate(new Date((d.y + callback.groupingInterval-1) * 1000), true);
	    	    		return dFrom + " to " + dTo;
	    			}()
	    		};
	    		
	    		//Create table inside table dom element
	    		g_createInfoTable(id_table, popupData, columns);
	    		tooltip.center(this, "bottom", 30, true);
	        	
	        	//Fill in solid bar with darker color
	            d3.select(this).select("rect")
	            	.transition()
	            	.duration(250)
	            	.attr("fill","rgb(255," + (128 + d.x) + ", " + (d.x * 2) + ")");
	            
	            //Show highlight bar 'over' solid bar
	            d3.select(this).select(".highlightBar")
	           		.attr("fill", callback.highlightColor )
	           		.attr("fill-opacity", "0.5");
	        }) 
	        .on("mouseout", function(d) {
	        	tooltip.hide();
	        	
	        	//Revert bar to normal color 
	            d3.select(this).select("rect")
	            	.transition()
	            	.duration(250)
	            	.attr("stroke", "#000000")
	            	.attr("fill", callback.highlightColor.substr(0,5) + "00");
	            
	            //Hide highlight bar
	            d3.select(this).select(".highlightBar")
	            	.attr("fill", "white")
	           	    .attr("fill-opacity", "0");
	        })
	       .on("click", function(d) { //Show subgraph table
	    	   //Now create mTimeTable data structure from timeSliceData
	    	   var yData = {
	    			 data: timeSliceData.data[d.y].data, //Data from the specific bar clicked
	    			 columns: timeSliceData.columnInfo
	    	   };
	    	   
	    	   timeGraphDetail(yData, d.x, callback.highlightColor, callback.clickThrough, 
    				   summaryTitle(d.y, callback.dataType, callback.groupingInterval), callback.dataType);
	       });	       
        } //End of inner function setupBarGraph
	}; //End of globals.timeGraph
	
	/**************************************************************
	 * Time Graph Detail (Summary) Tables
	 **************************************************************/
	globals.timeGraphDetail = function (dataset, number, highlightColor, clickThrough, title, dataType)
	{
        var outerTable,
	        tbody,
	        rows;
        
        var key = function(d,i) {
            return d.idx;
        };
       
        var subGraph_id = (dataType == g_dataTypeAlarm)?"id_subGraph_alarms":"id_subGraph_notifs";
        
        /* clear out previous tables */
        $("#" + subGraph_id).empty();
        
        var tooltip = d3.select("#" + subGraph_id);
        
        var tdData = function(row) {
            return dataset.columns.columnData.map(function(column) {
                return {column: column, value: row[column], id: row["idx"], killIdx:row["killChainIdx"], 
            		ruleIdx:row["ruleIdx"], alarmDesc:row["alarmDesc"]};
            }); 
        };
        
        tooltip
			.append("div")
			.attr("id", "id_subGraphTitle")
			.attr("class", "subGraphTitle")
			.style("padding-top", "0.5em")
			.html(title);
        
		//Determine tableType
		var tableType = (dataType == g_dataTypeAlarm)?"alarms":"notifications"; 
        
		var outerDiv = tooltip.append("div")
			.style("padding", "7px");
		
        outerTable = outerDiv.append("table")
        	.attr("id", "time-info-table-" + tableType)
        	.attr("class", "tablesorter datatable display cell-border compact")
        	.style("width", "95%");
        
        outerTable
            .append("thead").attr("class", "header-table")
            .append("tr")
            .selectAll("th")
	        .data(dataset.columns.columnData)
	        .enter()
	        .append("th")
	            .text(function(column) { return column; });

        tbody = outerTable.append("tbody").attr("class", "time-body-table");
        
        // Create a row for each object in the data and perform an intial sort.
        rows = tbody.selectAll("tr")
        .data(dataset.data.rowData)
        .enter()
        .append("tr")
        .attr("class", function(d,i) {
	        if(i % 2 == 0) { return "odd"; }
	        else { return "even"; };
        }); 
        
        // Create a cell in each row for each column
        rows.selectAll("td")
            .data(tdData)
	        .enter()
	        .append("td")
	        .style("font-size", "0.70em")
//Not sure what this is for - REMOVE?	        
//	        .attr("class", function(d) {var temp = "c" + d.value; temp = temp.replace(/[^\w]/gi, ''); return temp;})
	        .html(function(d) { return d.value; });
        
        //Make table into DataTable
        $(outerTable[0]).DataTable({
			"searching": false,
			"autoWidth": false,
			"paginate": false,
			"scrollCollapse": true,
			"scrollY": ($(outerDiv[0]).parent().height() - $("#id_subGraphTitle").height() - 80) + "px",
			"ordering": false,		
			"columns": function() { //Set up column widths
				var colObj = [];
				if (dataType == g_dataTypeAlarm) {
					colObj = 
					[
					 	{"width": "45%"}, //Alarm Type
						{"width": "35%"}, //TimeStamp				
						{"width": "20%"}  //Severity			
					];
				} else {
					colObj = 
					[
					 	{"width": "65%"}, //Notification Type
						{"width": "35%"} //TimeStamp				
					];
				}
				return colObj;
			}(), //() - Run immediately
			"language": {
			      "emptyTable": "No data to display"
			},		
			"info": true //Info at bottom
		});
        createTableRowEvents(rows, highlightColor, clickThrough, dataType);
	}; //End of function globals.timeGraphDetail
	
	/**************************************************************
	 * Recent Time Tables
	 **************************************************************/
	globals.timeTable = function (dataset, callback, div)
	{
		var bFirstCall = true;

		//Determine tableType by title (Alarm or Notification)
        var tableType = (callback.dataType == g_dataTypeAlarm)?"alarms":"notifications"; 
        var titleDivId = "id_timeTableTitle_" + tableType;

        var title = d3.select(div)
			.append("div")
			.attr("id", titleDivId)
			.attr("class", "timeTableTitle")
			.text(callback.title);
		
        
        var key = function(d,i) {
            return d.idx;
        };
        
        var tdData = function(row) {
            return dataset.columns.columnData.map(function(column) {
                return {column: column, value: row[column], id: row["idx"], killIdx:row["killChainIdx"], 
                		ruleIdx:row["ruleIdx"], alarmDesc:row["alarmDesc"]};
            }); 
        };
        
		var headerMargins = { //Padding for header table
			top: 2,
			right: 2,
			bottom: 2,
			left: 2
		};        
		        
        var headerTable = d3.select(div).append("table")
        	.attr("id", "time-info-header-table" + tableType)
        	.attr("class","tablesorter")
        	.style("border-bottom-right-radius", "0px") //Override style.css - Data table will keep its border-bottom-right-radius
        headerTable
        .append("thead").attr("class", "header-table")
        .append("tr")
        .selectAll("th")
        .data(dataset.columns.columnData)
        .enter()
        .append("th")
        	.style("border-right", "0px")
        	.style("padding", headerMargins.top + "px " +  headerMargins.right + "px " + headerMargins.bottom + "px " + headerMargins.left + "px")
            .text(function(column, i) { return column; });
    
        //Create div that will hold the data table
        var innerDiv = d3.select(div).append("div")
        //Height seemd to be required for overlfow-y/scrolling to work - Set height to height of div minus the height of the table title
        //minus the height of the header table minus some padding number
        	.style("height",($(div).height() - $("#" + titleDivId).height() 
        			- $("#time-info-header-table" + tableType).height() - 10) + "px") 
        	.style("overflow-y", "auto"); //Overflow for vertical scroll bar (auto basically means 'if needed')
        
        //Create data table
        var infoTable = innerDiv.append("table")
        	.attr("id", "time-info-table-" + tableType)
        	.attr("class", "tablesorter")
        	.style("border-top-left-radius", "0px"); //Override style.css - Header table will keep its border-top-left-radius
        //Append tbody to data table
        var tbody = infoTable.append("tbody").attr("class", "time-body-table");
        
        //call setupTimeTable
        setupTimeTable();
        
        //Every groupingInterval seconds, get new data and call setupTimeTable function
        window.setInterval(function() { 
    		var callbackURL = callback.url + "?startTimeStamp=0&dataType=" + callback.dataType;
        	bFirstCall = false;
        	
        	d3.json(callbackURL, function (data){
            	dataset = data; //Set outer function's dataset to new data
            	
            	setupTimeTable();
            });
        }, callback.groupingInterval * 1000);
        /***********************************************
         * timeTable functions
         ***********************************************/
        //Determines the width of a time chart column, based on data type (Alarm or Notif) and column number
        function bodyWidthFunc(column, i) {
        	var retVal = 50; //Initialize
        	switch (i) {
        		case 0: //Type of Alarm/Notif
        			retVal = (callback.dataType == g_dataTypeAlarm)?48:62;
        			break;
        		case 1: //Timestamp
        			retVal = (callback.dataType == g_dataTypeAlarm)?34:38;
        			break;
        		case 2: //ALARM ONLY - Severity
        			retVal = 56
        			break;
        		default:
        			break;
        	}
        	return retVal + "%";
        };
        
        /**
         * Creates the time table (alarm or notification)
         */
        function setupTimeTable() {
            var rows = tbody.selectAll("tr")
            	.data(dataset.data.rowData, key);
            
			if (bFirstCall) { //Initial set up of table
				//Create rows
				rows.enter().append("tr")
					.attr("class", function(d,i) {
						if(i % 2 == 0) { return "odd"; }
						else { return "even"; };
					});
			} else { //Not first time in function
        		//Remove old rows
        		rows.exit().remove();
        		//Now insert new rows at the top of the table
        		rows.enter().insert("tr")
        			.attr("class", function(d,i) {
        				if(i % 2 == 0) { return "odd"; }
        				else { return "even"; };
        			});        		
        	} //End of else of (if (bFirstCall))
			
            // Create a cell in each row for each column
            rows.selectAll("td")
                .data(tdData)
    	        .enter()
    	        .append("td")
    	        .html(function(d) { return d.value; })
//Not sure what this is for - REMOVE?
//    	        .attr("class", function(d) {var temp = "c" + d.value; temp = temp.replace(/[^\w]/gi, ''); return temp;})
    	        .style("width", function(column, i) { return bodyWidthFunc(column, i);})
    	        .attr("bgcolor", bFirstCall?"white":callback.highlightColor);
  		         
            //Create mouseover, mouseout, click, etc. events
            createTableRowEvents(rows, callback.highlightColor, callback.clickThrough, callback.dataType);

            //Set up widths of header columns, based on widths of the body columns
            setupHeaderWidths();
            
            //If the data table has a scroll bar, add a thin border at the bottom of the div
            if ($(innerDiv[0]).hasScrollBar()) {
            	innerDiv.style("border-bottom", "thin solid " + infoTable.style("background-color"));
            } else { //Remove any border-bottom style 
            	innerDiv.style("border-bottom", null);
            }
            
            if (!bFirstCall) { //Not first call, add transition for current rows
            	//Turn background color back to white after a second
            	rows.selectAll("td").transition()
              		.duration(1000)
              		.attr("bgcolor", "#FFFFFF");
            }
            
        } //End of function setupTimeTable
        /**
         * Sets up the column widths of the header table. Needed because we set the widths of these to match those
         * of the data table AFTER the data has its rows set up - This is to handle the data table fluctuating between
         * having a vertical scroll bar
         */
        function setupHeaderWidths() {
        	var outerTDs = infoTable.select("tbody tr").selectAll("td");
        	var colCount = outerTDs[0].length;
        	
        	//Select all columns (td) from the first row (tr) of the outer table body (tbody)
        	outerTDs.each(function(column, i) { 
        		if (i < (colCount - 1)) {
        			//Get the width of each column of the main table and assign its width to the corresponding
        			//column of the header table
        			var thisWidth = $(this).width();
        			var sel = headerTable.select("th:nth-child(" + (i + 1) + ")");
        			sel.style("width", (thisWidth - headerMargins.right - headerMargins.left) + "px");
        		}
        	});
        }
    }; //End of globals.timeTable
    
    /**********************************************************
     * General functions
     */
	/**
	 * Handles the showing/removing of the alarm rule popup
	 * @param alarmRule_popup (object) - adAPTToolTip object to use
	 * @param domElement - DomElement that was moused-over/moused-out
	 * @param szAlarmDesc - Alarm description
	 * @param ruleIdx - RuleIdx 
	 */
	function createAlarmRulePopup(alarmRule_popup, domElement, ruleIdx, szAlarmDesc) {
		var id_table = "id_alarmRule_popupTable";
		
		var szAlarmType = $(domElement.parentNode.cells[0]).text();
		

		alarmRule_popup.empty(); //Empty any current popup
		alarmRule_popup.show(null, 0.98);
		alarmRule_popup.d3Tooltip.style("width", "350px");
		//Append table element to popup
		alarmRule_popup.d3Tooltip.append("table").attr("id", id_table).style("width", "100%");
		//Set up column names and column names -> data properties mappings
		var columns = {
         	"columnNames":["Alarm Type", "Alarm Description", "Rule ID"],
         	"columnMaps":["alarmType", "alarmDesc", "ruleID"]
     	};
		//Table data
		var data = {
			"alarmType": szAlarmType,
			"alarmDesc": szAlarmDesc,
			"ruleID": ruleIdx
		};
		//Create table inside table dom element
		g_createInfoTable(id_table, data, columns);
		//Bold the alarm type cell
		$("#" + id_table + " tr:nth-child(1) td").css("font-weight", "bold").css("font-size",12);
		//Center popup
		alarmRule_popup.center(domElement.parentNode, "left", -20, true);
	} //End of function handleAlarmRulePopup
	
	/**
	 * Removes the Alarm Rule popup
	 * @param alarmRule_popup (object) - adAPTToolTip object to use
	 */
	function removeAlarmRulePopup(alarmRule_popup) {
		alarmRule_popup.hide();
	}
	
	/**
	 * Handles table row mouse events (mouseover, mouseout, clicking, etc.)
	 * @param rows (d3 selection) - table rows (D3)
	 * @param highlightColor (string) - Color to highlight the moused over row
	 * @param clickThrough (string) - Page to redirect when a user clicks
	 * @param dataType (integer) - Set to g_dataTypeAlarm or g_dataTypeNotif
	 */
	function createTableRowEvents(rows, highlightColor, clickThrough, dataType) {
        var alarmTooltip = new adAPTToolTip("id_alarmtooltip");

		rows.selectAll("td")
			.on("mouseover", function(d) {
				//Get id of enclosing div (should have the type of table: alarm or notifcation)
				var parentTableID = $(this).closest("table").attr('id');
				//See if this is the alarm table
				if (dataType == g_dataTypeAlarm) { //This is the alarm table
					createAlarmRulePopup(alarmTooltip, this, d.ruleIdx, d.alarmDesc);
				}
				
				//Select row
				d3.select(this.parentNode)
					.selectAll("td")
					.style("background", highlightColor)
					.style("color", "#000000");
			})
			.on("mouseout", function(d) {
				var parentTableID = $(this).closest("table").attr('id');
				//See if this is the alarm table
				if (parentTableID.toLowerCase().indexOf("alarm") >= 0) { //This is the alarm table
					removeAlarmRulePopup(alarmTooltip);
				}
	
				d3.select(this.parentNode)
					.selectAll("td")
					.style("background", null)
					.style("color", null);
			})
			.on("click", function(d) {
				if (!window.location.origin)
					window.location.origin = window.location.protocol+"//"+window.location.host;
				var url = window.location.origin + g_baseURI + "/view/" + clickThrough + "?idx=" + d.id;
				// alert(url);
				window.location = url; 
			});
	} //End of function createTableRowEvents
	
/*Don't think these functions are ever used	
    globals.barClickFunc = function(d) {    	
	   	var newCallbackURL = callback.url + "?startTimeStamp=" + d.y + "&dataType=" + callback.dataType + "&endTimeStamp=" + (d.y + callback.groupingInterval-1) + "&groupingInterval=1"; 
	   	d3.json(newCallbackURL, function(subd){
	   		var subW = w / 2;
	   		var subgraphNameData = ["mainGraph", "subGraph"];
	   		var returnData = subd.graphing.TimeData.data;
	   		var subDataLength = returnData.length;
	   		
	   		var subxScale = d3.time.scale()
    	        .domain(d3.extent(returnData, function(d){return new Date(d.y * 1000);}))
    	        .rangeRound([padding,subW],0.1);
            
	   		var subyScale = d3.scale.linear()
                .domain([0, d3.max(returnData, function(d) { return d.x;})])
                .range([barHeight, 0]);
	   		
	   		var subxAxis = d3.svg.axis()
	   			.scale(subxScale)
	   			.orient("bottom")
	   			.ticks(2)
	   			.tickFormat(d3.time.format(timeFormat));
	   		
	   		var subyAxis = d3.svg.axis()
	   			.scale(subyScale)
	   			.orient("left")
	   			.ticks(2);
	   		
	   		// create subGraph if it doesn't exist
	   		if($("#subsvg").length > 0) {}
			else
			{
				d3.select("#subGraph")
	   				.append("svg")
	   				.attr("id", "subsvg")
	   				.attr("width", subW)
	   				.attr("height", h);
			}
	   		
	   		var subsvg = d3.select("#subsvg");
	   		
	   		subsvg.selectAll("#axis")
	   			.remove();

   //Create bars
	   		var subg =	subsvg.selectAll("g.subbar")
	    		.data(returnData,key);
    	   	subg.exit().remove();
       		var g = subg.enter()
	       		.append("g")
	       		.attr("class", "subbar");
	   		g.append("rect")
	   			.attr("x", function(d, i) {
	   				return subxScale(new Date(d.y * 1000));
	   			})
	   			.attr("y", function(d,i) {
	   				return subyScale(d.x);
	   			})
	   			.attr("width", subW / subDataLength - 0.1)
	   			.attr("height", function(d) {
	   				return subyScale(0) - subyScale(d.x);
	   			})
	   			.attr("fill", function(d) {
	   				return callback.highlightColor.substr(0,5) + colorPad(colorValue(d.x, dataset).toString(16));
	   			});
	   		g.append("rect")
	   			.attr("x", function(d, i) {
	   				return subxScale(new Date(d.y * 1000));
	   			})
	   			.attr("y", function(d,i) {
	   				return 0;
	   			})
	   			.attr("width", subW / subDataLength - 0.1)
	   			.attr("height", barHeight)
	   			.attr("fill-opacity", "0")
	   			.attr("pointer-events", "all")
	   			.attr("class", "hightlightBar"); 
	   			
	   		g.on("mouseover", function(d) {
       			d3.select(this).select("rect")
                .transition()
                .duration(100)
                .attr("fill","rgb(255," + (128 + d.x) + ", " + (d.x * 2) + ")");
                
                d3.select(this).select(".highlightBar")
                	.attr("fill", "black")
                	.attr("fill-opacity", "1");
   			}) 
   			.on("mouseout", function(d) {
       			d3.select(this).select("rect")
                .transition()
                .duration(100)
   				.attr("fill", callback.highlightColor.substr(0,5) + colorPad(colorValue(d.x, dataset).toString(16)));
   			});

	   		subg.exit()
	   			.remove();
	   		
	   		subsvg.append("g")
	   		.attr("id", "axis")
   			.attr("class", "axis")
   			.attr("transform", "translate(" + padding + ",0)")
   			.call(subyAxis);
	   		
	   		subsvg.append("g")
	   			.attr("id", "axis")
	   			.attr("class", "axis")
	   			.attr("transform", "translate(0," + barHeight + ")")
	   			.call(subxAxis);
	   		
	   	});
   };
	
	globals.barGraph = function(data, chartNumber)
	{
		var padding = 25;
		var leftPad = 200;
        var w = 500 + padding + leftPad;
        var h = 250 + padding;
        var barH;
		var yScale;
		
		if ((data == null) || (data.length == 0)) {
			return;
		}
		
		if(typeof data[0].y != "undefined")
		{
			barH = (h - padding) / (data.length);
			yScale = d3.scale.linear()
				.domain([0, d3.max(data, function(d) { return d.y;})])
				.range([0, (h - padding)]);
		}
		else if(typeof data[0].ylabel != "undefined")
		{
			barH = (h - padding) / (data.length);
			yScale = d3.scale.ordinal()
				.domain(data.map( function(d) { return d.ylabel;}))
				.rangeRoundBands([0,(h - padding)], 0.05);
		}
		else
		{
			alert("you have failed!");
			return 0;
		}
		var xScale;
		if(typeof data[0].x != "undefined")
		{
			xScale = d3.scale.linear()
                        .domain([0, d3.max(data, function(d){return d.x;})])
                        .range([0, (w - (padding + leftPad ))]);
		}
		else if(typeof data[0].xlabel != "undefined")
		{
			xScale = d3.scale.ordinal()
			.domain(data.map( function(d) { return d.xlabel;}))
			.rangeRoundBands([0,(w - (padding + leftPad))], 0.05);
		}
		else
		{
			alert("you have failed!");
			return 0;
		}

	    var svg = d3.selectAll("#charts")
	        .append("svg")
		        .attr("width", w)
		        .attr("height", h)
		        .attr("display", "block");
	    var g =	svg.selectAll("group")
	    		.data(data)
	       		.enter()
	       		.append("g");
	       	g.append("rect")
	       		.attr("x", leftPad)
	       		.attr("y",function(d,i) { return barH * i;})
	       		.attr("width", function(d) { return xScale(d.x); })
	       		.attr("height", barH)
	       		.attr("fill", "SlateGray")
	       		.attr("class", function(d) { var temp = "c" + d.ylabel; temp = temp.replace(/[^\w]/gi, ''); return temp; });
	    	g.append("rect")
			.attr("x", leftPad)
			.attr("y", function(d,i) {return barH * i;})
			.attr("width", (w - padding))
			.attr("height", barH)
			.attr("fill-opacity", "0")
			.attr("pointer-events", "all")	
	    	// .attr("class", function(d) { return d.y; })
	    	;
	       	g.on("mouseover", function(d) {
	       			var className = d3.select(this).select("rect").attr("class");
	       			d3.select(this).select("rect")
	                .transition()
	                .duration(100)
	                .attr("fill","YellowGreen");
	       			d3.selectAll(".body-table td")
					.filter("." + className)
					.style("background", "YellowGreen");
	       		}) 
	       		.on("mouseout", function(d) {
	       			var className = d3.select(this).select("rect").attr("class");
	                d3.select(this).select("rect")
	                .transition()
	                .duration(100)
	                .attr("fill", "SlateGray");
	                d3.selectAll(".body-table td")
					.filter("." + className)
					.style("background", null);
	       		})
	       		.on("click", function() {
	                   // sortBars(g, barH);
	       		});
	    	var xAxis = d3.svg.axis()
	    		.scale(xScale)
	    		.orient("bottom")
	    		.ticks(5, "d") ;
	    	svg.append("g")
	    		.attr("class", "axis")
	    		.attr("transform", "translate(" + leftPad + "," + (h - padding) + ")")
	    		.call(xAxis);
	    	var yAxis = d3.svg.axis()
	    		.scale(yScale)
	    		.orient("left") ;
	    	svg.append("g")
	    		.attr("class", "axis")
	    		.attr("transform", "translate(" + leftPad + ", 0)")
	    		.call(yAxis);
	};
	
	globals.pieGraph = function(data, chartNumber)
	{
		var padding = 100;
        var w = 500 + padding;
        var h = 250 + padding;
        var radius = Math.min( w, h) / 2;
        var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
		var arc = d3.svg.arc()
			.outerRadius(radius - 10)
			.innerRadius(0);
		
		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return d.y; });
			
		
	    var svg = d3.selectAll("#charts")
	        .append("svg")
		        .attr("width", w)
		        .attr("height", h)
		        .append("g")
	       		.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
	    var g =	svg.selectAll(".arc")
	    		.data(pie(data))
	       		.enter()
	       		.append("g")
	       		.attr("class","arc");
	       	g.append("path")
	       		.attr("d", arc)
	       		.style("fill", function(d,i) { return color(i);})
	       		;
	       	g.append("text")
	       		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
	       		.attr("dy", ".35em")
	       		.style("text-anchor", "middle")
	       		.text(function(d) { return d.data.x;}); 
	};
	
	var sortBars = function(svg, barH)
	{
		svg.select("rect")
			.sort(function(a,b) {
				return d3.ascending(a,b);
			})
			.transition()
			.duration(1000)
			.attr("y", function(d, i) {
				return barH * i;
			});
	};
*/	
}(window));