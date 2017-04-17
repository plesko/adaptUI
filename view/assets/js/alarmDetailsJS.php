<script>
$(document).ready(function(){
	var alarmTypeData, notifData, hostData, alarmIdx

	var loadData = $.getJSON(<?= $alarmDataURL ?>, function(data){
		if (data.error !== undefined) { //An error occurred
			alert(data.error);
			return;
		}
		// console.log(data)
		createAlarmDetailTable = alarmDetails(data.alarmTypeData.data);
		createNotifsTable = notifDetails(data.notifData.data)
		createHostChart = forceDirectedGraph(data.alarmTypeData.data.hostIdx, 2, 0); // variables = hostIdx, hopsToUse, startTimeStamp
		// createHostTable = hostDetails(data.hostData.data)
		// alarmTypeData = data.alarmTypeData
		// notifData = data.notifData
		// hostData = data.hostData
		$("#page-title").text("Alarm Details")
		$("#page-sub-title").text("Originating Alarm, Host Association, Contributing Notifications")
	});

	loadData.done(function() {
		$("#ajax-content").addClass('fadeIn')
		$('.toolbar.row').addClass('fadeIn')
	})

	function alarmDetails(alarmData) {
		// console.log(alarmData)
    alarmIdx = alarmData.alarmIdx;
		
    stateSet = [
           {
      	     "entityType":"alarm",
      	     "cadaptIdx": alarmData.alarmIdx,
      	     "newState":"seen"
           }
        ];
				$.ajax({  
      		type: "POST", 
      		dataType: 'json', 
      	    url: g_getURLHeader() + '/controller/cAjax.php', 
      	    data: {
      	    	"action":"updateEntitiesStates",
      	    	"data":stateSet
      	    },
      	    success: function(res) { 
      		    // console.log(res);
      		    switch (res.result) {
      		    	case AJAX_RESULT_OK: 
      		    		// console.log("OK!");
      			    	break;
      		    	case AJAX_RESULT_EXCEPTION: //Exception error
      			    	alert("Exception error: " + res.thrown);
      			    	break;
      		    	case AJAX_RESULT_ERROR:
      			    default:
      			    	alert("Error: " + res.thrown);
      			    	break;
      		    } //End of switch
      	    },
          	error: function (res, error, thrown) { //Unanticipated error
              	alert("Submit error: " + thrown);
          	}
	      	}) //End of ajax call
		$('.template').clone().removeClass('template').addClass('alarmDetails')
			.find('.panel-title .text-bold')
			.text(alarmData.alarmType)
			.after(' <a class="editRule hidden" data-ruleNum="'+alarmData.ruleNum+'" href="javascript:void(0)"><i class="fa fa-question-circle"></i></a>')
		.end()
			.find('.panel-body')
			.append('<p><span class="detail-label">Description</span> <span class="detail-data">'+alarmData.alarmDesc+'</span></p>')
			.append('<p><span class="detail-label">Host</span> <span class="detail-data"><a href="#" id="'+alarmData.hostIdx+'" class="hostDetailsLink alt-color" data-idx="'+alarmData.hostIdx+'">'+alarmData.host+'</a></span></p>')
      .append('<p><span class="detail-label">Asset Criticality</span> <span class="detail-data">'+alarmData.assetCrit+'</span></p>')
      .append('<p><span class="detail-label">Threat Score</span> <span class="detail-data">'+alarmData.threatScore+'</span></p>')
			.append('<p><span class="detail-label">Host IPs</span> <span class="detail-data">'+alarmData.hostIPs+'</span></p>')
			.append('<p><span class="detail-label">Timestamp</span> <span class="detail-data">'+g_convertFromUTC(alarmData.time)+'</span></p>')
			.append('<p><span class="detail-label">Date Range</span> <span class="detail-data">'+g_convertFromUTC(alarmData.earliestNotifDate)+' --> '+ g_convertFromUTC(alarmData.latestNotifDate) +'</span></p>')
//			.append('<p><span class="detail-label">Rule Description</span> <span class="detail-data">'+alarmData.ruleDesc+'</span></p>')
			.wrapInner('<div class="detailTable col-md-8 inline-block"></div>')
		.end()
			.find('.panel-body')
			.append('<div id="detailChart" class="chart-container col-md-4 height-200 inline-block"></div>')
		.end()
		.appendTo('#ajax-content')
		.end()
		.show()
		.addClass('animated')
		.addClass('fadeInUp')

		var threatScore = alarmData.threatScore,
				severity = alarmData.severity,
				assetCrit = alarmData.assetCrit

		var axes = [{ axis: 'Threat Score', value: threatScore},
								{ axis: 'Severity', value: severity},
								{ axis: 'Asset Criticality', value: assetCrit}]

		var dataArray = [{className: "spiderChart", axes: axes}]

		var chartHeight = $('.chart-container').height(),
				chartWidth = $('.chart-container').width()

		var chart = RadarChart.chart();
		var svg = d3.select('#detailChart').append('svg')
		  .attr('width', chartWidth)
		  .attr('height', chartHeight);

		chart.config({
			w: chartWidth,
			h: chartHeight,
			radius: 6
		})

		// draw one
		svg.append('g').classed('focus', 1).datum(dataArray).call(chart);
	}

	function notifDetails(notifData) {
		$('.template').clone().removeClass('template').addClass('notifDetails')
			.find('.panel-title .text-bold')
			.text("Contributing Notifications")
		.end()
			.find('.panel-body')
			.html( '<table cellpadding="0" cellspacing="0" border="0" class="display table top-align" id="notifTable"></table>' )
		.end()
			.find('#notifTable').addClass('table')
			.dataTable({
        autoWidth: false,
        data: notifData,
        searching: true,
        paging: true,
        pageLength: 10,
        info: false,
        dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        order: [ [ 5, "desc" ] ],
        columns: [
          { targets: 0,
            orderable: false,
            className: "select",
            render: function (data, type, full, meta){
              // console.log(full.state); //Please don't forget to remove this!!  
              if (full.state == "seen") {
                return '<i class="seen fa fa-square-o fa-fw"></i>';
              } else if (full.state == "unseen") {
                return '<i class="unseen fa fa-circle fa-fw"></i>';
              } else if (full.state == "inreport") {
                return '<i class="inreport fa fa-file-text-o fa-fw"></i>';
              }
            }
          },
          { title: "Notification",
            data: "notifType",
            className: "type left",
            render: function (data, type, full, meta){
              return '<a class="notifDetailsLink" data-idx="'+full.idx+'" href="#" title="View Notification Details">'+data+'</a>'; 
            }
          },
          { title: "Description",
            data: "notifDesc",
            className: "desc left" },
          { title: "Source IP",
            data: "sourceIP",
            className: "sourceIP center" },
          { title: "Target IP",
            data: "targetIP",
            className: "targetIP center" },
          { title: "Time & Date",
            data: "time",
            className: "lastConnection center",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            } 
          }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr("data-type", "notif")
        }
      })
    .end()
      .find('.dataTables_length').hide()
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
	}

	function forceDirectedGraph(hostIdx, hopsToUse, startTimeStamp) {
    $('.template').clone().removeClass('template').addClass('fdg')
      .find('.panel-title .text-bold')
      .text("Communication Pattern Analysis")
      .end()
      .find('.panel-body')
      .append('<div class="chart-legend"><ul><li><span class="symbol root circle"></span><span class="name root">Alarming Host</span></li><li><span class="symbol one-hop circle"></span><span class="name one-hop">One Hop Away</span></li><li><span class="symbol two-hop circle"></span><span class="name two-hop">Two Hops Away</span></li><li><span class="symbol three-hop circle"></span><span class="name three-hop">Three Hops Away</span></li><li><span class="symbol number"> # : </span><span class="name number">Threat Score (0-25)</span></li><li><span class="symbol unmonitored circle">?</span><span class="name unmonitored">Unmonitored Host</span></li></ul></div><div id="hostChart" class="height-1000"></div>')
      .end()
      .appendTo('#ajax-content')
      .end()
      .show()
      .addClass('animated')
      .addClass('fadeInUp')

    // FDG CONTROLLER CALL URL --> USED TO LOAD EXTERNAL DATA THROUGH d3.json in next load external data function
    var hostGraphURL = "<?= $_SESSION["baseURI"] ?>/controller/cHostDirectedGraph.php?" + "&hostZeroIdx=" + hostIdx + "&hops=" + hopsToUse + "&startTimeStamp=" + startTimeStamp;

    var width = $("#hostChart").width(),
        height = $("#hostChart").height();

    var svg = d3.select("#hostChart").append("svg")
        .attr("width", width)
        .attr("height", height);

    var drag = d3.behavior.drag()
        .on('dragstart', function () {
          d3.event.sourceEvent.stopPropagation();
          d3.event.sourceEvent.preventDefault();
          console.log('Start Drag');
        })
        .on('drag', function (d, i) {
          d.cx += d3.event.dx;
          d.cy += d3.event.dy;
          d3.select(this).attr('cx', d.cx).attr('cy', d.cy);
        })
        .on('dragend', function (d, i) {
          d3.event.sourceEvent.stopPropagation();
          d3.event.sourceEvent.preventDefault();
        });

    var force = d3.layout.force()
        .charge(-250)
        .gravity(.05)
        .friction(0.9)
        .linkDistance(function(link) {
          if (link.hopLevel === 0) return 50;
          if (link.hopLevel === 1) return 100;
          if (link.hopLevel === 2) return 200;
          if (link.hopLevel === 3) return 300;
          return 200
        })
        .linkStrength(function(link) {
          if (link.hopLevel === 0) return 1;
          if (link.hopLevel === 1) return .5;
          if (link.hopLevel === 2) return .25;
          if (link.hopLevel === 3) return .05;
          return .01
        })
        .size([width, height]);

    // load the external data
    d3.json(hostGraphURL, function(error, json) {
      var fdg = json.data;

      var graphNodes = [];
      var graphLinks = [];
      var iIndex = 0;
      
      //Create graphNodes
      $.each(fdg.nodes, function(hostIdx, node) {
        //Add iIndex to each node
        node.iIndex = iIndex++;
        //Add node to graphNodes array
        if(node.hopLevel === 0) {
          node.fixed = true;
          node.x = width/2
          node.y = height/2
        }
        graphNodes.push(node);
      });

      //Create graphLinks array from origLinks
      //Each index of the array corresponds to a source host
      $.each(fdg.links, function(sourceHostIdx, linkArray) {
        //Now loop through the source link array. Each index corresponds to a target host
        $.each(linkArray, function(index, targetHostIdx) {
          var sourceIndex = fdg.nodes[sourceHostIdx].iIndex;
          var targetIndex = fdg.nodes[targetHostIdx].iIndex;
          //Add source/target object to graphLinks array
          graphLinks.push({
            "source": sourceIndex,
            "target": targetIndex
          });
        }); //End of inner .each
      }); //End of outer .each
      
      // console.log('graphNodes:');
      // console.log(graphNodes);
      // console.log('graphLinks:');
      // console.log(graphLinks);
      
      force
          .nodes(graphNodes)
          .links(graphLinks)
          .start();

      var link = svg.selectAll(".link")
          .data(graphLinks)
        .enter().append("line")
          .attr("class", "link");

      var node = svg.selectAll(".node")
          .data(graphNodes)
        .enter().append("g")
          .attr("class", "node")
          .call(force.drag)

      var clicks, timer, delay

      node.append("circle")
          .attr("r", function(d, i) {
            return d.threatInfo.assetCrit*8
          })
          .style("fill", function(d, i) { 
            // console.log(d);
            switch(d.hopLevel) {
              case 0:
                return "rgba(192,59,60,.8)";
                break;
              case 1:
                return "rgba(76,124,185,.8)"
                break;
              case 2:
                return "rgba(153,185,41,.8)"
                break;
              case 3:
                return "rgba(153,185,41,.5)"
                break;
            }
          })
          .style("stroke", function(d, i) { 
            // console.log(d);
            switch(d.hopLevel) {
              case 0:
                return "rgba(192,59,60,1)";
                break;
              case 1:
                return "rgba(76,124,185,1)"
                break;
              case 2:
                return "rgba(153,185,41,1)"
                break;
              case 3:
                return "rgba(153,185,41,.75)"
                break;
            }
          })
          .on("click", function (d) {
            var defaultPrevented = d3.event.defaultPrevented;
            var selectedNode = d3.select(this);
            if (d3.event.defaultPrevented) return; // click suppressed
            if (d.hostIdx < g_monitoredStartIdx) { //Unmonitored, Broadcast, or Multicast address
      				if (typeof d.hostIdx !== undefined) {
      					//Create new geoLocationIP object and call its execute function
      					var geoLocationIPObj = new GeoLocationIP(json.data.unmonIPs[d.hostIdx], $("#hostChart"));
      					geoLocationIPObj.execute();
      				} else { //We shouldn't get here because there should have been at least one IP
      					alert("No IPs found");
      				} //End of else of (if (typeof data.data.commData.unmonIPs[idx] !== undefined))
            } else {
              //Load host details page
              var prev = {type:"host", idx: d.hostIdx, name: d.hostName};
              nav_history.push(prev)
              var url = g_vHostDetailsPage() + "?idx=" + d.hostIdx;
              ajaxLoader(url, ajaxContainer, nav_history);
            }
          }) //End of .on click

      node.append("text")
          .attr("dx", -7)
          .attr("dy", 8)
          .text(function(d) {
            if (d.hostIdx < 3) {
              return "?"
            } else {
              return d.threatInfo.threatScore
            }
          })
          .on("click", function (d) {
            var defaultPrevented = d3.event.defaultPrevented;
            var selectedNode = d3.select(this);
            if (d3.event.defaultPrevented) return; // click suppressed
            // console.log("clicked!");
            if (d.hostIdx < g_monitoredStartIdx) { //Unmonitored, Broadcast, or Multicast address
    			if (typeof d.hostIdx !== undefined) {
    				//Create new geoLocationIP object and call its execute function
    				var geoLocationIPObj = new GeoLocationIP(json.data.unmonIPs[d.hostIdx], $("#hostChart"));
    				geoLocationIPObj.execute();
    			} else { //We shouldn't get here because there should have been at least one IP
    				alert("No IPs found");
    			} //End of else of (if (typeof data.data.commData.unmonIPs[idx] !== undefined))
            } else {
              //Load host details page
              var prev = {type:"host", idx: d.hostIdx, name: d.hostName};
              nav_history.push(prev)
              var url = g_vHostDetailsPage() + "?idx=" + d.hostIdx;
              ajaxLoader(url, ajaxContainer, nav_history);
            }
          }) //End of .on click

      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });

    });
  }

});
</script>