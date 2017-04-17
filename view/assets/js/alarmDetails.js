var alarmDetails = function() {
	"use strict";

	$.getJSON("../controller/cIntervalForensics.php?idxs=75587_556227", function(data){
		
		console.log(data);
		var alarms = [];
		$.each(data, function(index, val) {
			 console.log(val.alarmTypeData.data);
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
	}); //End of d3.json function call

	return;

}();
