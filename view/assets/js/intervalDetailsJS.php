<script>
$(document).ready(function(){
	var intervalAlarmData = [], intervalNotifData = [], intervalHostData = []

	$("#page-title").text("Interval Details")
	$("#page-sub-title").text("A snapshot of all notifications, alarms, and associated hosts for a specific point in time")
	
	var loadData = $.getJSON(<?= $intervalDataURL ?>, function(data){
		$.each(data.data, function(i, v) {
			$.each(v.alarmTypeData, function(key, val) {
				var alarms = val // Object.keys(val).map(function (key) {return val[key]});
				intervalAlarmData.push(alarms)
			});
			$.each(v.notifData.data, function(key, val) {
				intervalNotifData.push(val)
			});
		});
		// console.log(intervalAlarmData)
		intervalAlarms(intervalAlarmData)
		notifDetails(intervalNotifData)
		
		$(".row").addClass('animated')
		
		$('#ajax-content').one('click', '#alarmsTable tbody tr', function(event) {
			console.log("click for alarmIdx: "+$(this).attr('id'))
			event.stopPropagation();
			event.preventDefault();
			var url = '<?= $_SESSION["baseURI"] ?>/view/vAlarmDetails.php?idx='+$(this).attr('id');
			ajaxLoader(url, ajaxContainer);
			$(this).off();
		})
	});
	
	function intervalAlarms(intervalAlarmData) {
		$('.template').clone().removeClass('template').addClass('intervalDetails')
			.find('.panel-title .text-bold')
			.text('Triggered Alarms')
		.end()
			.find('.panel-body')
			.html( '<table cellpadding="0" cellspacing="0" border="0" class="display table clickable" id="alarmsTable"></table>' )
		.end()
			.find('#alarmsTable')
			.dataTable({
        autoWidth: false,
				data: intervalAlarmData,
				searching: true,
				paging: true,
				info: false,
				dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
		             "<'row'<'col-sm-12'tr>>" +
		             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
				columns: [
					{ title: "Alarm",
						data: "alarmType" },
				 	{ title: "Alarm Description",
				 		data: "alarmDesc" },
				 	{ title: "Host",
				 		data: "host" },
				 	{ title: "Timestamp",
				 		data: "time",
				 		render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
				 	    return g_convertFromUTC(data);
				 	  } 
				 	}
				],
				createdRow: function( row, data, dataIndex ) {
					$(row).attr("id", data.alarmIdx)
				}
			})
		.end()
			.appendTo('#ajax-content')
		.end()
		.show()
		.addClass('animated')
		.addClass('fadeInUp')
	}

	function notifDetails(intervalNotifData) {
		// console.log(intervalNotifData)
		$('.template').clone().removeClass('template').addClass('notifDetails')
			.find('.panel-title .text-bold')
			.text("Contributing Notifications")
		.end()
			.find('.panel-body')
			.html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="notifTable"></table>' )
		.end()
			.find('#notifTable').addClass('table')
			.dataTable( {
				"bFilter": false,
				"bPaginate": false,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 4, 'desc']],
				"aaData": intervalNotifData,
	      "aoColumns": [
          { "mData": "notifType",
          	"sTitle": "Notification" },
          { "mData": "notifDesc",
          	"sTitle": "Notification Description" },
          { "mData": "sourceIP",
          	"sTitle": "Source IP/Name" },
          { "mData": "targetIP",
          	"sTitle": "Target IP/Name" },
          { "mData": "time",
          	"sTitle": "Timestamp",
          	render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            } 
          },
        ],
				createdRow: function( row, data, dataIndex ) {
					$(row).attr("id", data.idx)
				}
	    })
	  .end()
		.appendTo('#ajax-content')
		.end()
		.show()
		.addClass('animated')
		.addClass('fadeInUp')
	}

	var runDataTable_recentNotifs = function() {

		var notifTable;
		
		$.ajax({
			url: '../controller/cDashboard.php',
			dataType: 'json',
			data: {action: 'notifs'},
		})
		.success(function(data) {
			var notifTable = data.data;
			$('#recentNotifTable').dataTable( {
				"bFilter": false,
				"bPaginate": false,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 3, 'desc']],
				"aaData": notifTable,
	      "aoColumns": [
	          { "mData": "type" },
	          { "mData": "notifCnt" },
	          { "mData": "hostCnt" },
	          { "mData": "date" },
	          { "mData": "percentage" }
	        ]
	    }); 
		});
	};

	var runDataTable_freqNotifs = function() {

		var notifTable;
		
		$.ajax({
			url: '../controller/cDashboard.php',
			dataType: 'json',
			data: {action: 'notifs'},
		})
		.success(function(data) {
			var notifTable = data.data;
			$('#freqNotifTable').dataTable( {
				"bFilter": false,
				"bPaginate": false,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 4, 'desc']],
				"aaData": notifTable,
	      "aoColumns": [
	          { "mData": "type" },
	          { "mData": "notifCnt" },
	          { "mData": "hostCnt" },
	          { "mData": "date" },
	          { "mData": "percentage" }
	        ]
	    }); 
		});
	};

	runDataTable_recentNotifs();

});

	
			

			// alarmDetailsBusyIndicator.stop();
			
			//Create alarm detail table
			// if(rcvData.hasOwnProperty("error")) { //An error occurred
			// 	alert("Alarm Detail server error: " + rcvData.error);
			// 	return;
			// }

			// var hostIdx = rcvData.alarmTypeData.data.hostIdx;

			// var columns = {
			// 	"columnNames":["Alarm Type","Description","Time","Host","Severity","Host IPs","Rule Description","Rule Number"],
			// 	"columnMaps":["alarmType","alarmDesc","time","host","severity","hostIPs","ruleDesc","ruleNum"]
			// };

			// //Create alarm detail table
			// g_createInfoTable("id_alarmInfoTable", rcvData.alarmTypeData.data, columns);

			// //Create table row with Forensics button
			// var setupForensicsBtn = function() {
			// 	var newRow = d3.select("#id_alarmInfoTable").append("tr");
			// 	var newTH = newRow.append("th")
			// 		.attr("colspan", 2) 
			// 		.style("text-align", "center"); //To center the button
				
			// 	newTH.append("input")
			// 		.attr("type","button")
			// 		.attr("id", "id_btnForensics")
			// 		.attr("value", "Alarm Forensics Report");

			// 	$("#id_alarmInfoTable").on("click", "#id_btnForensics", function() {
			// 		var url =  window.location.origin + g_baseURI + "/view/vAlarmReport.php?idx=" + <?= $alarmIdx?>;
			// 		console.log("window.location = "+url); 
			// 	});
			// }();

			// // //Set host name text in Host Force Directed graph title
		 // //    $("#id_hostname")
		 // //    	.css("color", HostDirectedGraph.color(0))
		 // //    	.text(rcvData.alarmTypeData.data.host);

			// //When user selects a different hop level, destroy directed graph key table and redraw the graph
			// $("#id_directedGraphHopsSelect").change(function() {
			// 	$("#id_keyTable").DataTable().destroy();
			// 	$("#id_hostsvg").remove(); //Remove SVG element to start over
			// 	createForceDirectedGraph(hostIdx);
			// });
			
			// //Create force directed graph 
			// createForceDirectedGraph(hostIdx);

			// //Create alarm cluster graph
			// createAlarmClusterGraph(rcvData);

</script>