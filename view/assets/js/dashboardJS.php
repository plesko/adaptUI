<script>
$(document).ready(function(){

  var interpolation = "monotone",
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

  d3.json("/adaptUI/view/assets/js/dashboard.json", function(data) {
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

//			console.log(myData);

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

      // update()

    }

    function redraw() {
      // console.log(myData)

      // the data domains or desired axes might have changed, so update them all
      var min = d3.min(myData, function(d) { return new Date(d.unixDate*1000); })
      var max = d3.max(myData, function(d) { return new Date((d.unixDate)*1000); })
      x.domain([moment(max).subtract(180, 'seconds'), moment(max).subtract(60, 'seconds')])
      y.domain([0, d3.max(myData, function(d) { return d.notifCnt; })+1])

      // notifications.select(".notifLine")
      //   .attr("d", createNotifLine(myData))

      // notifications.select(".notifArea")
      //   .attr("d", createNotifArea(myData));

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
      d3.json(<?= $mainActivityData ?>, function (data) {
        // process new data and store it in the appropriate variables
        myData = data.data
        redraw();
      });
    }

})



/*
  var doTables = function() {
    $.getJSON(<?= $allTableData ?>, function(data){
        createRecentNotifTable(data.data.recentNotifs);
        createFreqNotifTable(data.data.freqNotifs);
        createRecentAlarmTable(data.data.recentAlarms);
        createFreqAlarmTable(data.data.freqAlarms);
        createHostTable(data.data.hosts);
	})
  }();
*/
  //Load recent and freq alarm info on page load
  var recentAlarmTable = function() {
    $.getJSON(<?= $recentAlarmData ?>, function(data){
      createRecentAlarmTable(data.data)
    })
  }
  recentAlarmTable();

  var freqAlarmTable = function() {
    $.getJSON(<?= $freqAlarmData ?>, function(data){
      createFreqAlarmTable(data.data)
    })
  }
  freqAlarmTable();

  var loadedNotifs = false;
  var loadedHosts = false;

  //Load notifications panel data (only once) when user clicks on the notifications tab
  $("#notifsPanel").one("click", function(event) {
	if (loadedNotifs == false) {
		$.getJSON(<?= $recentNotifData ?>, function(data){
			createRecentNotifTable(data.data);
			$.getJSON(<?= $freqNotifData ?>, function(data){
				createFreqNotifTable(data.data);
				loadedNotifs = true;
			});
		});
	}
  });

  //Load hosts panel (only once) when user clicks on the hosts tab
  $("#hostsPanel").one("click", function(event) {
	if (loadedHosts == false) {
		$.getJSON(<?= $hostData ?>, function(data) {
			createHostTable(data.data);
			loadedHosts = true;
		});
	}
  });

  function createRecentAlarmTable(intervalAlarmData) {
    $('#recentAlarmTable')
      .dataTable({
        retrieve: true,
        autoWidth: false,
        data: intervalAlarmData,
        searching: false,
        paging: true,
        pagingType: "simple",
        processing: true,
        order: [[6, "desc"]],
        info: false,
        autoWidth: false,
        dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        columns: [
          { targets: 0,
            orderable: false,
            className: "select",
            render: function (data, type, full, meta){
              // console.log(full); //Please don't forget to remove this!!  
              if (full.state == "seen") {
                return '<i class="seen fa fa-square-o fa-fw"></i>';
              } else if (full.state == "unseen") {
                return '<i class="unseen fa fa-circle fa-fw"></i>';
              } else if (full.state == "inreport") {
                return '<i class="inreport fa fa-file-text-o fa-fw"></i>';
              }
            }
          },
          { title: "Alarm",
            data: "type",
            className: "type left",
            render: function (data, type, full, meta){
              return '<a class="alarmDetailsLink" data-idx="'+full.idx+'" href="#" title="View Alarm Details">'+data+'</a>';
            }
          },
          { title: "Host",
            data: "hostName",
            className: "host left",
            render: function (data, type, full, meta) {
              return '<a class="hostDetailsLink" data-idx="'+full.hostIdx+'" href="#" title="View Host Details">'+data+'</a>';
            }
          },
          { title: "Severity",
            data: "severity",
            className: "severity center" },
          { title: "Asset Criticality",
            data: "assetCrit",
            className: "assetCrit center" },
          { title: "Threat Score",
            data: "threatScore",
            className: "threatScore center" },
          { title: "Time & Date",
            data: "date",
            className: "lastConnection center",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }
          }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr('data-type', 'alarm');

          // console.log(row); //Please don't forget to remove this!!  
          // if (full.state == "seen") {
          //   $(this).parents('tr').addClass('seen');
          //   return '<i class="fa fa-square-o fa-fw"></i>';
          // } else if (full.state == "unseen") {
          //   $(this).parents('tr').addClass('unseen');
          //   return '<i class="fa fa-circle fa-fw"></i>';
          // } else if (full.state == "inreport") {
          //   $(this).parents('tr').addClass('inreport');
          //   return '<i class="fa fa-file-text-o fa-fw"></i>';
          // }
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

  function createFreqAlarmTable(intervalAlarmData) {
    $('#freqAlarmTable')
      .dataTable({
        retrieve: true,
        autoWidth: false,
        data: intervalAlarmData,
        searching: false,
        paging: true,
        processing: true,
        info: false,
        dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        order: [ [ 6, "desc" ] ],
        columns: [
          { targets: 0,
            orderable: false,
            className: "select",
            render: function (data, type, full, meta){
              return '<i class="fa fa-square-o fa-fw"></i>'; 
            }
          },
          { title: "Alarm",
            data: "type",
            className: "type left" },
          { title: "Description",
            data: "desc",
            className: "desc left" },
          { title: "Associated Hosts",
            data: "hostCnt",
            className: "hostCnt center" },
          { title: "Total Alarms",
            data: "alarmCnt",
            className: "totalAlarms center" },
          { title: "Timestamp",
            data: "date",
            className: "lastConnection center",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }
          },
          { title: "Percentage of All",
            data: "percentage",
            className: "percentage center" }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr('data-type', 'alarm');
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

  function createRecentNotifTable(intervalAlarmData) {
    $('#recentNotifTable')
      .dataTable({
        autoWidth: false,
        data: intervalAlarmData,
        searching: false,
        paging: true,
        pageLength: 5,
        processing: true,
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
            data: "type",
            className: "type left",
            render: function (data, type, full, meta){
              return '<a class="notifDetailsLink" data-idx="'+full.idx+'" href="#" title="View Notification Details">'+data+'</a>'; 
            } 
          },
          { title: "Description",
            data: "desc",
            className: "desc left" },
          { title: "Source IP",
            data: "sourceIP",
            className: "sourceIP center" },
          { title: "Target IP",
            data: "targetIP",
            className: "targetIP center" },
          { title: "Time & Date",
            data: "date",
            className: "lastConnection center",            
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }
          }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr('data-type', 'notif');
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

  function createFreqNotifTable(intervalAlarmData) {
    $('#freqNotifTable')
      .dataTable({
        autoWidth: false,
        data: intervalAlarmData,
        searching: false,
        paging: true,
        processing: true,
        info: false,
        dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        order: [ [ 6, "desc" ] ],
        columns: [
          { targets: 0,
            orderable: false,
            className: "select",
            render: function (data, type, full, meta){
              return '<i class="fa fa-square-o fa-fw"></i>'; 
            }
          },
          { title: "Notification",
            data: "type",
            className: "type left" },
          { title: "Description",
            data: "desc",
            className: "desc left" },
          { title: "Associated Hosts",
            data: "hostCnt",
            className: "hostCnt center" },
          { title: "Total Notifications",
            data: "notifCnt",
            className: "totalNotifs center" },
          { title: "Time & Date",
            data: "date",
            className: "lastConnection center",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }            
          },
          { title: "Percentage of All",
            data: "percentage",
            className: "percentage center" }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr('data-type', 'notif');
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

  function createHostTable(hostData) {
    $('#freqHosts')
      .dataTable({
        autoWidth: false,
        data: hostData,
        searching: false,
        paging: true,
        processing: true,
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
          { title: "Host",
            data: "host",
            className: "host",
            render: function (data, type, full, meta){
              return '<a class="hostDetailsLink" data-idx="'+full.idx+'" href="#" title="View Host Details">'+data+'</a>'; 
            } 
          },
          { title: "Asset Criticality",
            data: "assetCrit",
            className: "assetCrit" },
    		  { title: "Total Alarms",
  			     data: "alarmCnt",
            className: "totalAlarms" },
  	      { title: "Time & Date",
  	      	data: "date",
            className: "lastConnection",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }            
          },
          { title: "Percentage of All",
            data: "percentage",
            className: "percentage" }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr('data-type', 'host');
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

});

</script>
