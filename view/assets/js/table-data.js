var TableData = function() {
	"use strict";
	//function to initiate DataTable
	//DataTable is a highly flexible tool, based upon the foundations of progressive enhancement,
	//which will add advanced interaction controls to any HTML table
	//For more information, please visit https://datatables.net/
	var runDataTable_offendingHosts = function() {

		var hostTable;
		
		$.ajax({
				url: '../controller/cDashboard.php',
				dataType: 'json',
				data: {action: 'hosts'},
			})
			.success(function(data) {
				var hostTable = data.data;
				$('#freqHosts').dataTable( {
					"bFilter": false,
					"bPaginate": false,
					"bInfo": false,
					"bSearchable": false,
					"aaSorting": [[ 4, 'desc']],
	        "bProcessing": false,
					"aaData": hostTable,
		      "aoColumns": [
		          { "mData": "host" },
		          { "mData": "alarmCnt" },
		          { "mData": "avgSeverity" },
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

	var runDataTable_freqAlarms = function() {

		var alarmTable;
		
		$.ajax({
			url: '../controller/cDashboard.php',
			dataType: 'json',
			data: {action: 'alarms'},
		})
		.success(function(data) {
			var alarmTable = data.data;
			$('#freqAlarmTable').dataTable( {
				"bFilter": false,
				"bPaginate": false,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 4, 'desc']],
				"aaData": alarmTable,
	      "aoColumns": [
	          { "mData": "type" },
	          { "mData": "severity" },
	          { "mData": "alarmCnt" },
	          { "mData": "hostCnt" },
	          { "mData": "date" },
	          { "mData": "percentage" }
	        ]
	    }); 
		});
	};

	var runDataTable_recentAlarms = function() {

		var alarmTable;
		
		$.ajax({
			url: '../controller/cRecentAlarms.php',
			dataType: 'json'
		})
		.success(function(data) {
			var alarmTable = data.data.rowData;
			// console.log(alarmTable);
			$('#recentAlarmTable').dataTable( {
				"bFilter": false,
				"bPaginate": true,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 0, 'desc']],
				"aaData": alarmTable,
				"fnInitComplete": function () {
            $(this).one('click', 'tr', function(event) {
            	event.preventDefault();
            	console.log($('td').eq(1).text());
            	$.ajax({
            		url: 'vAlarmDetails.php',
            		dataType: 'html',
            		data: {idx: $('td').eq(1).text()},
            	})
            	.success(function(data) {
            		$('#ajax-content').html(data);
            	});
            	
            });
        },
	      "aoColumns": [
	          { "mData": "Date" },
	          { "mData": "Alarm ID" },
	          { "mData": "Type" },
	          { "mData": "Host" },
	          { "mData": "Severity" }
	        ]
	    }); 
		});
	};

	var runDataTable_freqAlarmsByHost = function() {

		var alarmTable;
		
		$.ajax({
			url: '../controller/cFreqAlarmsByHost.php',
			dataType: 'json'
		})
		.success(function(data) {
			var alarmTable = data.data.rowData;
			// console.log(alarmTable);
			$('#freqAlarmsByHost').dataTable( {
				"bFilter": false,
				"bPaginate": true,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 2, 'desc']],
				"aaData": alarmTable,
	      "aoColumns": [
	          { "mData": "Host Name" },
	          { "mData": "Host Priority" },
	          { "mData": "Number of Alarms" },
	          { "mData": "Highest Severity" }
	        ]
	    }); 
		});
	};

	var runDataTable_freqNotifsByType = function() {

		var alarmTable;
		
		$.ajax({
			url: '../controller/cFreqNotifsByType.php',
			dataType: 'json'
		})
		.success(function(data) {
			var alarmTable = data.data.rowData;
			// console.log(alarmTable);
			$('#freqNotifsByType').dataTable( {
				"bFilter": false,
				"bPaginate": true,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 1, 'desc']],
				"aaData": alarmTable,
	      "aoColumns": [
	          { "mData": "Notification Type" },
	          { "mData": "Count" }
	        ]
	    }); 
		});
	};

	// var runDataTable_freqOffendersByNotif = function() {

	// 	var alarmTable;
		
	// 	$.ajax({
	// 		url: '../controller/cFreqNotifsByHost.php',
	// 		dataType: 'json',
	// 		data: {type: 0},
	// 	})
	// 	.success(function(data) {
	// 		var alarmTable = data.data.rowData;
	// 		// console.log(alarmTable);
	// 		$('#freqOffendersByNotif').dataTable( {
	// 			"bFilter": false,
	// 			"bPaginate": true,
	// 			"bInfo": false,
	// 			"bSearchable": false,
 //        "bProcessing": true,
 //        "aaSorting": [[ 2, 'desc']],
	// 			"aaData": alarmTable,
	//       "aoColumns": [
	//           { "mData": "Host Name" },
	//           { "mData": "Host Priority" },
	//           { "mData": "Number of Notifications"}
	//         ]
	//     }); 
	// 	});
	// };

	// var runDataTable_freqTargetsByNotif = function() {

	// 	var alarmTable;
		
	// 	$.ajax({
	// 		url: '../controller/cFreqNotifsByHost.php',
	// 		dataType: 'json',
	// 		data: {type: 1},
	// 	})
	// 	.success(function(data) {
	// 		var alarmTable = data.data.rowData;
	// 		// console.log(alarmTable);
	// 		$('#freqTargetsByNotif').dataTable( {
	// 			"bFilter": false,
	// 			"bPaginate": true,
	// 			"bInfo": false,
	// 			"bSearchable": false,
 //        "bProcessing": true,
 //        "aaSorting": [[ 2, 'desc']],
	// 			"aaData": alarmTable,
	//       "aoColumns": [
	//           { "mData": "Host Name" },
	//           { "mData": "Host Priority" },
	//           { "mData": "Number of Notifications"}
	//         ]
	//     }); 
	// 	});
	// };

	return {
		//main function to initiate template pages
		init : function() {
			runDataTable_offendingHosts();
			runDataTable_recentNotifs();
			runDataTable_freqNotifs();
			runDataTable_freqAlarms();
			runDataTable_recentAlarms();
			runDataTable_freqAlarmsByHost();
			runDataTable_freqNotifsByType();
			runDataTable_freqOffendersByNotif();
			runDataTable_freqTargetsByNotif();
		}
	};
}();
