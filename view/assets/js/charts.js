var Charts = function() {

	var prevData = [];
	var activityChart = function(timeOffset) {
		
		var interpolation = "mototone",
      margin = {"top": 10, "right": 40, "bottom": 30, "left": 30},
      width = $("#activityChart").width()-margin.left-margin.right,
      height = $("#activityChart").height()-margin.top-margin.bottom,
      myData, svg, notifications, alarms, notifLine, notifArea, alarmLine, alarmArea, alarmPoints, textPoints

	  // Parse the date and time
	  var timeFormat = d3.time.format("%H:%M:%S");

		//defines a function to be used to append the title to the tooltip.  you can set how you want it to display here.
		var tooltip = function (d) {
			var alarms = [], hosts = [];
			$.each(d.alarms.alarm, function(i, v) {
				var alarm = '<li><span class="date">' + v.date + '</span><br><span class="threatScore">Threat Score: ' + v.threat + '</span><br><span class="alarm" id="' + v.idx + '">' + v.type + '</span><br><span class="host" id="'+v.hostIdx+'">' + v.hostName + '</span></li>'
				alarms.push(alarm)
			});
			var tip = '<ul>'+alarms.join('')+'</ul>';
			return tip;
		}

	  // Set the ranges
	  var x = d3.time.scale().range([0, width]);
	  var y = d3.scale.linear().range([height, 0]);

	  // Define the axes
	  var xAxis = d3.svg.axis().scale(x).ticks(d3.time.seconds, 10).tickSize(10).tickSubdivide(true), // x axis function
	      yAxis = d3.svg.axis().scale(y).tickSize(5).orient("right").tickSubdivide(true) // y axis function

	  // Define the notification line
	  var createNotifLine = d3.svg.line()
	    .interpolate(interpolation)
	    .x(function(d) { return x(new Date(d.unixDate*1000)); })
	    .y(function(d) { return y(d.notifCnt); })

	  // Define the notification area
	  var createNotifArea = d3.svg.area()
	    .interpolate(interpolation)
	    .x(function(d) { return x(new Date(d.unixDate*1000)); })
	    .y0(function(d) { return height-Math.abs(d.notifCnt); })
	    .y1(function(d) { return y(d.notifCnt); })

	  d3.json("/adaptUI/view/assets/js/dashboard-controller-response-alarms.json", function(data) {
	    myData = data.data

	    function init() {

	      // the data domains or desired axes might have changed, so update them all
	      var min = d3.min(myData, function(d) { return new Date(d.unixDate*1000); })
	      var max = d3.max(myData, function(d) { return new Date((d.unixDate)*1000); })
	      x.domain([moment(max).subtract(180, 'seconds'), moment(max).subtract(60, 'seconds')])
	      y.domain([0, d3.max(myData, function(d) { return d.notifCnt; })+1])

	      // Adds the svg canvas
	      svg = d3.select("#activityChart")
	        .append("svg")
	          .attr("width", width + margin.left + margin.right)
	          .attr("height", height + margin.top + margin.bottom)
	        .append("g")
	          .attr("transform",
	                "translate(" + margin.left + "," + margin.top + ")")

	      // Add Clipping Path
	      var clip = svg.append("defs").append("clipPath")
	        .attr("id", "clip")
	        .append("rect")
	        .attr("width", width)
	        .attr("height", height+margin.bottom);

	      // Make group for notifications
	      notifications = svg.append("g")
	        .attr("class", "notifs")
	        .attr("clip-path", "url(#clip)");

	      // Make group for alarms
	      alarms = svg.append("g")
	        .attr("class", "alarms")
	        .attr("clip-path", "url(#clip)")

	      // Add the notification Line.
	      notifLine = notifications.append("path")
	        .datum(myData)
	        .attr("class", "notifLine")
	        .attr("stroke", "rgba(220,178,7,1)")
	        .attr("stroke-width", 2)
	        .attr("fill", "none")
	        .attr("d", createNotifLine(myData))

	      // Add the notification Area.
	      notifArea = notifications.append("path")
	          .datum(myData)
	          .attr("class", "notifArea")
	          .attr("fill", "rgba(240,217,122,1)")
	          .attr("d", createNotifArea(myData))

	      // Add Points and Data
	      alarmPoints = alarms.selectAll("circle").data(myData, function (d) { return d.unixDate })
	      textPoints = alarms.selectAll("text").data(myData, function (d) { return d.unixDate })

	      alarmPoints.enter()
	        .append("alarms:g")
						.attr("class", "alarmPoint")
						.attr("height", function (d) {
							if(d.alarms.alarmCnt == 0) {
		            return 0
		          } else {
		            return 3*d.alarms.highestThreat+2
		          }
						})
						.attr("width", function (d) {
							if(d.alarms.alarmCnt == 0) {
		            return 0
		          } else {
		            return 3*d.alarms.highestThreat+2
		          }
						})
						.append("circle")
		        .attr("cx", function (d) { return x(new Date(d.unixDate*1000)) })
		        .attr("cy", function (d) { return y(d.alarms.alarmCnt) })
		        .attr("r", function (d) {
		          if(d.alarms.alarmCnt == 0) {
		            return 0
		          } else {
		            return 3*d.alarms.highestThreat+2
		          }
		        })
						.style("fill", "rgba(255,255,255,1)")

				svg.selectAll(".alarmPoint")
					.append("circle")
		        .attr("cx", function (d) { return x(new Date(d.unixDate*1000)) })
		        .attr("cy", function (d) { return y(d.alarms.alarmCnt) })
		        .attr("r", function (d) {
		          if(d.alarms.alarmCnt == 0) {
		            return 0
		          } else {
		            return 3*d.alarms.highestThreat
		          }
		        })
		        .style("stroke", "rgba(207,88,88,1)")
		        .style("fill", "rgba(218,120,120,1)")
		        .style("stroke-width", "2")
		        .style("cursor", "pointer")
		        .on('click', function (d) {
		          d3.event.stopPropagation();
		          var idx = []
		          var alarms = d.alarms.alarm;
		          for (var k = 0; k < alarms.length; k++) {
		            idx.push(alarms[k].idx)
		          }
		          var idxs = idx.join('_')
		          // console.log(idxs)
		          $.ajax({
		            url: 'vIntervalDetails.php',
		            dataType: 'html',
		            data: {idx: idxs}
		          }).success(function(data) {
		            $('#ajax-content').html(data);
		          })
		        })

				svg.selectAll(".alarmPoint")
					.on("mouseover", function (d) {
							var alarms = [], hosts = [];
							$.each(d.alarms.alarm, function(i, v) {
								var alarm = '<li><span class="date">' + v.date + '</span><br><span class="threatScore">Threat Score: ' + v.threat + '</span><br><span class="alarm" id="' + v.idx + '">' + v.type + '</span><br><span class="host" id="'+v.hostIdx+'">' + v.hostName + '</span></li>'
								alarms.push(alarm)
							});
							var tip = '<ul>'+alarms.join('')+'</ul>';

	            var g = d3.select(this); // The node

							var div = g.append("foreignObject")
														.attr("x", function (d) { return x(new Date(d.unixDate*1000)) })
										        .attr("y", function (d) { return y(d.alarms.alarmCnt) })
												    .attr("width", 10)
												    .attr("height", 10)
												  .append("xhtml:body")
														.attr("class", "chartTip")
														.style("opacity", 1)
														.style("left", function (d) { return x(new Date(d.unixDate*1000)) })
				                    .style("top", function (d) { return y(d.alarms.alarmCnt) })
												    .html(tip)
		        });

					svg.selectAll(".alarmPoint")
						.on("mouseout", function (d) {
		            d3.selectAll("foreignObject").attr("opacity", 0).transition(1000).delay(500).remove();
		        });

	      // Add the X Axis
	      svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + height + ")")
	        .call(xAxis);

	      // Add the Y Axis
	      svg.append("g")
	        .attr("class", "y axis")
	        .attr("transform", "translate(" + width + ",0)")
	        .call(yAxis);

	      $('.row').addClass('fadeInUp').addClass('animated')

	      setInterval(function(){ 
					update()
				}, 1000);

	    }

	    function redraw() {
	    	console.log("prevData Length: "+prevData.length);

	    	myData = prevData
	      // the data domains or desired axes might have changed, so update them all
	      var min = d3.min(myData, function(d) { return new Date(d.unixDate*1000); })
	      var max = d3.max(myData, function(d) { return new Date((d.unixDate)*1000); })
	      x.domain([moment(max).subtract(180, 'seconds'), moment(max).subtract(60, 'seconds')])
	      y.domain([0, d3.max(myData, function(d) { return d.notifCnt; })+1])

	      var duration = 1000;
	      // slide the x-axis left

	      notifications.select(".notifLine")
	        .attr("d", createNotifLine(myData))
	        .attr("transform", null)
	        .transition()
	        .duration(duration)
	        .ease("linear")

	      notifications.select(".notifArea")
	        .attr("d", createNotifArea(myData))
	        .attr('transform', null)
	        .transition()
	        .duration(duration)
	        .ease("linear")
        
        svg.select(".x.axis")
        	.transition()
          .duration(duration)
          .ease("linear")
          .call(xAxis);

        svg.select(".y.axis")
        	.transition()
          .duration(duration)
          .ease("linear")
          .call(yAxis);

	      // alarms.select(".alarmLine")
	      //   .attr("d", createAlarmLine(myData));

	      // alarms.select(".alarmArea")
	      //   .attr("d", createAlarmArea(myData));

	      // Add Points and Data
	      alarmPoints = alarms.selectAll("circle").data(myData, function (d) { return d.unixDate })
	      // textPoints = alarms.selectAll("text").data(myData, function (d) { return d.unixDate })

	      // add new points if they're needed
				alarmPoints.enter()
	        .append("alarms:g")
						.attr("class","alarmPoint")
						.append("circle")
		        .attr("cx", function (d) { return x(new Date(d.unixDate*1000)) })
		        .attr("cy", function (d) { return y(d.alarms.alarmCnt) })
		        .attr("r", function (d) {
		          if(d.alarms.alarmCnt == 0) {
		            return 0
		          } else {
		            return 3*d.alarms.highestThreat+2
		          }
		        })
						.style("fill", "rgba(255,255,255,1)")

				svg.selectAll(".alarmPoint")
						.append("circle")
		        .attr("cx", function (d) { return x(new Date(d.unixDate*1000)) })
		        .attr("cy", function (d) { return y(d.alarms.alarmCnt) })
		        .attr("r", function (d) {
		          if(d.alarms.alarmCnt == 0) {
		            return 0
		          } else {
		            return 3*d.alarms.highestThreat
		          }
		        })
		        .style("stroke", "rgba(207,88,88,1)")
		        .style("fill", "rgba(218,120,120,1)")
		        .style("stroke-width", "2")
		        .style("cursor", "pointer")
		        .on('click', function (d) {
		          d3.event.stopPropagation();
		          var idx = []
		          var alarms = d.alarms.alarm;
		          for (var k = 0; k < alarms.length; k++) {
		            idx.push(alarms[k].idx)
		          }
		          var idxs = idx.join('_')
		          // console.log(idxs)
		          $.ajax({
		            url: 'vIntervalDetails.php',
		            dataType: 'html',
		            data: {idx: idxs}
		          }).success(function(data) {
		            $('#ajax-content').html(data);
		          })
		        })
	    }

	    // let's kick it all off!
	    init ();

	    // called every time a form field has changed
	    function update () {
        myData = prevData
        redraw();
        prevData.shift()
	    }
	  });
	}

	var networkActivity = function() {

		d3.json("/adaptUI/view/assets/js/dashboard-controller-response-alarms.json", function(data) {
			prevData = data.data;
			generateInterval(prevData)
		})

		function generateInterval(last) {
			var lastEl = last[last.length-1];
			var newUnixDate = moment(lastEl.unixDate*1000).add(1, 's')
			var intervalNotifs = getRandomIntInclusive(0,40)
			var intervalAlarms = getRandomIntInclusive(0,5)
			if (intervalAlarms > 3) {
				var alarms = {
					"alarm":[
	          {
	            "idx":15731,
	            "hostIdx":6,
	            "ruleIdx":105,
	            "unixDate":1455142170,
	            "hostName":"Disc Host 10.0.1.188",
	            "severity":1,
	            "criticality":1,
	            "threat":1,
	            "date":"2016\/02\/10 22:09:30",
	            "type":"ARP Misuse 1",
	            "aDesc":"A host has been detected sending and\/or receiving ARP packets at excessive rates. This could be an attemtped denial of service (DoS).",
	            "rName":null,
	            "rDesc":null
	          },{
	            "idx":15731,
	            "hostIdx":6,
	            "ruleIdx":105,
	            "unixDate":1455142170,
	            "hostName":"Disc Host 10.0.1.188",
	            "severity":1,
	            "criticality":1,
	            "threat":1,
	            "date":"2016\/02\/10 22:09:30",
	            "type":"ARP Misuse 2",
	            "aDesc":"A host has been detected sending and\/or receiving ARP packets at excessive rates. This could be an attemtped denial of service (DoS).",
	            "rName":null,
	            "rDesc":null
	          },{
	            "idx":15731,
	            "hostIdx":6,
	            "ruleIdx":105,
	            "unixDate":1455142170,
	            "hostName":"Disc Host 10.0.1.188",
	            "severity":1,
	            "criticality":1,
	            "threat":1,
	            "date":"2016\/02\/10 22:09:30",
	            "type":"ARP Misuse 3",
	            "aDesc":"A host has been detected sending and\/or receiving ARP packets at excessive rates. This could be an attemtped denial of service (DoS).",
	            "rName":null,
	            "rDesc":null
	          }
	        ],
	        "hostsSeen":[
	          {
	            "idx":6,
	            "name":"Disc Host 10.0.1.188",
	            "criticality":1,
	            "cnt":1
	          }
	        ],
	        "alarmCnt":3,
	        "avgSeverity":"1.0",
	        "avgThreat":"1.0",
	        "avgCrit":"1.0",
	        "highestSeverity":1,
	        "highestThreat":1,
	        "highestCrit":1,
	        "hostCnt":1
				}
			} else {
				var alarms = {
					"alarm":[
	        ],
	        "hostsSeen":[
	        ],
	        "alarmCnt":0,
	        "avgSeverity":0,
	        "avgThreat":0,
	        "avgCrit":0,
	        "highestSeverity":0,
	        "highestThreat":0,
	        "highestCrit":0,
	        "hostCnt":0
				}
			}
			var entry = {
				"unixDate": newUnixDate.valueOf()/1000,
				"date": newUnixDate.utcOffset(0).format("YYYY\/MM\/DD HH:mm:ss"),
				"notifCnt": intervalNotifs,
				"alarms": alarms
			}
			prevData.push(entry)
			setTimeout(function(){ 
				generateInterval(prevData)
			}, 1000);
		}

		function getRandomIntInclusive(min, max) {
		  return Math.floor(Math.random() * (max - min + 1)) + min;
		}

	}();

	// --- end custom chart testing -- //

	return {
		//main function to initiate template pages
		init : function() {
			if($('#activityChart').length) {
				activityChart(); // just testing
				// window.setInterval(d3Testing, 1000); //Run again every 1000ms  
				// runMainChart(); // run on dashboard only
			}
		}
	};
}();
