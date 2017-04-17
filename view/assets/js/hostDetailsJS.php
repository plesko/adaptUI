<script>
$(document).ready(function(){
	var alarmData = [], notifData = [], hostData = [];
	var hostIdx = <?= $hostIdx ?>;
	var mainHostDetailsURL = <?= $hostDataURL ?>;
	var commHostDetailsURL = <?= $hostCommDataURL ?>;
	var hopLevel = 1;
	var hostDirectedGraph;
	var initialStart = g_getStartTimeStampForDays(<?= $hostDetailsInitialDaysToUse ?>);

	var loadData = $.getJSON(<?= $hostDataURL ?>, function(data){
		$.each(data, function(i, v) {
			$.each(v.hostData, function(key, val) {
				 hostData.push(val)
			});
			$.each(v.notifData.notifs, function(key, val) {				
				 notifData.push(val)
			});
			$.each(v.alarmData.alarms, function(key, val) {
				 alarmData.push(val)
			});
		});
		initPage(hostData, notifData, alarmData);
	});

	loadData.done(function() {
		$("#ajax-content").addClass('fadeIn')
		$('.toolbar.row').addClass('fadeIn')

		//Get communications data
		$.getJSON(commHostDetailsURL, function(commData){
			if(commData.hasOwnProperty("error")) { //An error occurred
				alert("Host Communication Details server error: " + commData.error);
				return;
			}

			if ((!(commData.hasOwnProperty("data"))) || (!(commData.data.hasOwnProperty("commData")))) {
				alert("No communications data found");
				return;
			}

			createCommTable(commData.data.commData);
			// hostPanel = createHostTable(hostData);
			alarmPanel = createAlarmTable(alarmData);
			notifPanel = createNotifTable(notifData);
		});

		// hostPanel = createHostTable(hostData);
		// alarmPanel = createAlarmTable(alarmData);
		// notifPanel = createNotifTable(notifData);
	})

	function initPage(hostData, notifData, alarmData){
		$("#page-title").text("Host Details: ")
		$("#host-name").val(hostData[0].name)
		$("#host-title").text(hostData[0].name)
		$("#host-IP").text(hostData[0].ip)
		$("#host-MAC").text(hostData[0].macAddr)
		$(".historical .chart.notifications .host .number").text(hostData[0].notifCount)
		$(".historical .chart.alarms .host .number").text(hostData[0].alarmInfo.alarmCount)
		$(".breadcrumb li").last().append('<a href="#" class="config" id="host-config"><i class="fa fa-cog"></i></a>')
		$("#host-config").attr('data-idx', hostData[0].idx)
		$("#host-config").attr('href', g_baseURI + "/view/vHostDetails.php?idx=" + hostData[0].idx)
		updateOriginatingHost(hostData)

		stateSet = [
           {
      	     "entityType":"host",
      	     "cadaptIdx": hostData[0].idx,
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
	}

	function updateOriginatingHost(hostData) {
		// console.log(hostData[0]);
		
		// Set Asset Criticality
		if (hostData[0].assetCrit == 1) {
			$(".host-meta").find('.criticality').addClass('green').find(".number").text("1");
		} else if (hostData[0].assetCrit == 2) {
			$(".host-meta").find('.criticality').addClass('yellow').find(".number").text("2");
		} else if (hostData[0].assetCrit == 3) {
			$(".host-meta").find('.criticality').addClass('red').find(".number").text("3");
		} else {
			$(".host-meta").find('.criticality').addClass('red').find(".number").text(hostData[0].assetCrit);
		}

		// Set Highest Severity
		if (hostData[0].alarmInfo.highestSeverity == 1) {
			$(".host-meta").find('.severity').addClass('green').find(".number").text("1");
		} else if (hostData[0].alarmInfo.highestSeverity == 2) {
			$(".host-meta").find('.severity').addClass('yellow').find(".number").text("2");
		} else if (hostData[0].alarmInfo.highestSeverity == 3) {
			$(".host-meta").find('.severity').addClass('red').find(".number").text("3");
		} else {
			$(".host-meta").find('.severity').addClass('red').find(".number").text(hostData[0].alarmInfo.highestSeverity);
		}

		// Set Threat Score
		if (hostData[0].threatScore == 1) {
			$(".host-meta").find('.threat').addClass('green').find(".number").text("1");
		} else if (hostData[0].threatScore == 2) {
			$(".host-meta").find('.threat').addClass('yellow').find(".number").text("2");
		} else if (hostData[0].threatScore == 3) {
			$(".host-meta").find('.threat').addClass('red').find(".number").text("3");
		} else {
			$(".host-meta").find('.threat').addClass('red').find(".number").text(hostData[0].threatScore);
		}
	}

	function createHostTable(hostData) {
		$('.template').clone().removeClass('template').addClass('origHost')
			.find('.panel-title .text-bold')
			.text("Originating Host")
		.end()
			.find('.panel-body')
			.html( '<table cellpadding="0" cellspacing="0" border="0" class="display top-align" id="hostTable"></table>' )
		.end()
			.find('#hostTable').addClass('table')
			.dataTable( {
				"bFilter": false,
				"bPaginate": false,
				"bInfo": false,
				"bSearchable": true,
				dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
		             "<'row'<'col-sm-12'tr>>" +
		             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
		        "bProcessing": false,
		        "aaSorting": [[ 4, 'desc']],
				"aaData": hostData,
	      "aoColumns": [
	          { "mData": "name",
	          	"sTitle": "Name" },
	          { "mData": "assetCrit",
	          	"sTitle": "Asset Criticality" },
	          { "mData": "alarmInfo.highestSeverity",
	          	"sTitle": "Highest Severity" },
          	{ "mData": "threatScore",
	          	"sTitle": "Threat Score" },
	          { "mData": "notifCount",
	          	"sTitle": "Total Notifications" },
	          { "mData": "alarmInfo.alarmCount",
	          	"sTitle": "Total Alarms" },
	        ]
	    })
	  .end()
		.appendTo('#ajax-content')
		.end()
		.show()
		.addClass('animated')
		.addClass('fadeInUp')
	}

	function createAlarmTable(alarmData) {
		$('.template').clone().removeClass('template').addClass('alarmDetails')
			.find('.panel-title .text-bold')
			.text("Alarms Triggered by Host")
		.end()
			.find('.panel-body')
			.html( '<table cellpadding="0" cellspacing="0" border="0" class="display top-align" id="alarmTable"></table>' )
		.end()
			.find('#alarmTable').addClass('table')
			.dataTable( {
				"bFilter": true,
				"bPaginate": true,
				"pagingType": "simple",
				"bInfo": true,
				"bSearchable": true,
				dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
		             "<'row'<'col-sm-12'tr>>" +
		             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
		        "bProcessing": false,
		        "aaSorting": [[ 5, 'desc']],
				"aaData": alarmData,
				"aoColumns": [
					{ targets: 0,
			            orderable: false,
						className: "select",
						render: function (data, type, full, meta) {
							if (full.state == "seen") {
							return '<i class="seen fa fa-square-o fa-fw"></i>';
							} else if (full.state == "unseen") {
							return '<i class="unseen fa fa-circle fa-fw"></i>';
							} else if (full.state == "inreport") {
							return '<i class="inreport fa fa-file-text-o fa-fw"></i>';
							}
						}
					},
					{ "mData": "alarmName",
						"sTitle": "Alarm",
						className: "type left auto-width",
			            render: function (data, type, full, meta){
			            	// console.log(full);
			              return '<a class="alarmDetailsLink" data-idx="'+full.alarmIdx+'" href="#" title="View Alarm Details">'+data+'</a>';
			            } 
			        },
					{ "mData": "alarmDesc",
						"sTitle": "Description",
						className: "desc left"
					},
					{ "mData": "severity",
						"sTitle": "Highest Severity",
						className: "severity center"
					},
					{ "mData": "threatScore",
						"sTitle": "Threat Score",
						className: "threatScore center"
					},
					{ "mData": "timeStamp",
						"sTitle": "Time & Date",
						className: "lastConnection cneter",
						render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
					      return g_convertFromUTC(data);
					  	}
					},
				],
				"createdRow": function( row, data, dataIndex ) {
			    	$(row).attr("id", data.alarmIdx).attr("data-type", "alarm")
			  	}
		    })
		.end()
			.appendTo('#ajax-content')
		.end()
			.show()
			.addClass('animated')
			.addClass('fadeInUp')
	}

	function createNotifTable(notifData) {
		$('.template').clone().removeClass('template').addClass('notifDetails')
			.find('.panel-title .text-bold')
			.text("Associated Notification Types")
		.end()
			.find('.panel-body')
			.html( '<table cellpadding="0" cellspacing="0" border="0" class="display top-align" id="notifTable"></table>' )
		.end()
			.find('#notifTable').addClass('table')
			.dataTable( {
				"bFilter": false,
				"bPaginate": false,
				"bInfo": false,
				"bSearchable": false,
        "bProcessing": false,
        "aaSorting": [[ 2, 'desc']],
				"aaData": notifData,
				dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
		             "<'row'<'col-sm-12'tr>>" +
		             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
	      "aoColumns": [
	          { "mData": "notifTypeName",
	          	"sTitle": "Notification",
	          	className: "type left auto-width"
		      },
	          { "mData": "notifTypeDesc",
	          	"sTitle": "Notification Description",
		        className: "desc left auto-width"
		      	},
	          { "mData": "notifTypeCnt",
	          	"sTitle": "Count",
	          	className: "totalNotifs center" 
	          }
	       ],
	      "createdRow": function( row, data, dataIndex ) {
					//Create id attribute, putting hostIdx in it
					$(row).attr("id", data.notifIdx).attr("data-type", "notif");
		    }
			})
	  .end()
			.appendTo('#ajax-content')
		.end()
			.show()
			.addClass('animated')
			.addClass('fadeInUp')
	}

	function createCommTable(commData) {
		$('.template').clone().removeClass('template').addClass('commDetails')
			.find('.panel-title .text-bold')
			.text("Communication Partners")
		.end()
			.find('.panel-body')
			.html( '<table cellpadding="0" cellspacing="0" border="0" class="display top-align" id="commTable"></table>' )
		.end()
			.find('#commTable').addClass('table')
			.dataTable( {
				autoWidth: false,
				pageLength: 10,
				"bFilter": false,
				"bPaginate": true,
				"bInfo": false,
				"bSearchable": true,
        "bProcessing": false,
        "aaSorting": [[ 5, 'desc']],
				"aaData": commData.tableData,
				dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
		             "<'row'<'col-sm-12'tr>>" +
		             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
	      "aoColumns": [
	      		{ targets: 0,
            orderable: false,
	            className: "select",
	            render: function (data, type, full, meta) {
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
	          { "mData": "hostName",
	          	"sTitle": "Host",
	          	className: "type left auto-width",
				render: function (data, type, full, meta){
					return '<a class="hostDetailsLink" data-idx="'+full.hostIdx+'" href="#" title="View Host Details">'+data+'</a>';
				}
             },
	          { "mData": "assetCrit",
	          	"sTitle": "Asset Criticality",
	          	className: "assetCrit center" 
	          },
	          { "mData": "threatScore",
	          	"sTitle": "Threat Score",
	          	className: "threatScore center" 
	          },
	          { "mData": "alarmTotals",
	          	"sTitle": "Alarm Totals",
	          	className: "totalAlarms center" 
	          },
	          { "mData": "notifTotals",
	          	"sTitle": "Notification Totals",
	          	className: "totalNotifs center" 
	          }
	      ],
	      "createdRow": function( row, data, dataIndex ) {
				//Create id attribute, putting hostIdx in it
				$(row).attr("id", data.hostIdx).attr("data-type", "host");
		  }

	   })
	  .end()
		.appendTo('#ajax-content')
		.end()
		.show()
		.addClass('animated')
		.addClass('fadeInUp');

		$('#commTable').on( 'click', 'tbody tr', function (event) { //User clicked on a row
			// var idx= $(this).attr("id").split('__')[1]; //Host IDX is in the second element of the split array

			// if (idx < g_monitoredStartIdx) { //Unmonitored, Broadcast, or Multicast address
			// 	if (typeof commData.unmonIPs[idx] !== undefined) {
			// 		//Create new geoLocationIP object and call its execute function
			// 		var geoLocationIPObj = new GeoLocationIP(commData.unmonIPs[idx], $(".commDetails"));
			// 		geoLocationIPObj.execute();
			// 	} else { //We shouldn't get here because there should have been at least one IP
			// 		alert("No IPs found");
			// 	}
			// } else {
			// 	 //Go to desired host details page
			// 	 var url = g_baseURI + "/view/vHostDetails.php?idx=" + idx;
			// 	 ajaxContainer = $("#ajax-content");
			// 	 ajaxLoader(url, ajaxContainer);
			// }
		});


	} //End of function createCommTable

	//*********************************
	//*Host meta-data modal box
	//*********************************/
	//Add Host meta data dialog box
	$(document).one("click", ".submitHostConfig", function() {
	  submitHostConfig();
	});

  $(".main-wrapper").on('click', '#host-config', function(event) {
    var currentCrit = $(".host-meta").find('.criticality').find(".number").text();
    var $el = $("#panel-config").find('.modal-footer .btn-primary').removeClass().addClass("btn btn-primary submitHostConfig").end().find('.toggle-content').addClass('hidden').end().find(".modal-title").text('Host Configuration').end().find('.host-config').removeClass('hidden').end();
	$("input[name='asset-criticality'][value='" + currentCrit + "']").iCheck('check');
	$("input[id='host-type']").val((hostData[0].hostType != null)?hostData[0].hostType:"");

	for (var iCustomCount = 1; iCustomCount <= 4; ++iCustomCount) {
	  var curId = "host-customfield-" + iCustomCount;
	  var value = (hostData[0]["field"+iCustomCount] == null)?"":hostData[0]["field"+iCustomCount];
	  $("input[id='" + curId + "']").val(value);
	}
    event.preventDefault();
	$el.modal();
  });	
	
	//**
	//* Function to save new host meta-data (name/asset criticality/etc)
	//*
	function submitHostConfig() {
		var newName = $("#host-name").val().trim();
		var data = {"idx":hostData[0].idx};
		var bNamedChanged = bAssetCritChanged = bOtherInfoChanged = false;

		if (newName == "") { //Empty string
			alert("Please provide a name for this host");
			return;			
		}

		if (newName != $("#host-title").text()) { //Name is changing
			data["name"] = newName;
			bNamedChanged = true;
		} 

		var newAssetCrit = $("input[name=asset-criticality]:checked").val();	
		var oldAssetCrit = 	$(".host-meta").find('.criticality').find(".number").text();
		if (newAssetCrit != oldAssetCrit) { //Asset criticality is changing
			data["assetCrit"] = newAssetCrit;
			bAssetCritChanged = true;
		} 

		var newHostType = $("#host-type").val().trim();
		if (hostData[0].hostType != newHostType) {
			data["hostType"] = newHostType;
			bOtherInfoChanged = true;
		}

		for (var iCustomCount = 1; iCustomCount <= 4; ++iCustomCount) {
			var newFieldVal = $("input[id='host-customfield-" + iCustomCount + "']").val().trim();
			var oldFieldVal = hostData[0]["field" + iCustomCount];
			if (oldFieldVal != newFieldVal) { //Custom field value is changing
				data["field"+iCustomCount] = newFieldVal;
				bOtherInfoChanged = true;
			}
		}

		if (!bAssetCritChanged && !bNamedChanged && !bOtherInfoChanged) { //No info is changing
			alert("No fields have been modified from their original values");
			$("#panel-config").modal("hide");
			return;
		}
        
		$.ajax({  
	  		type: "POST", 
	  	 	dataType: 'json', 
	  	    url: g_getURLHeader() + '/controller/cAjax.php', 
	  	    data: {
	  	     	"action":"setHostInfo",
	  	     	"data": data
	  	     },
	  	     success: function(res) { 
	  	 	    switch (res.result) {
	  	 	    	case AJAX_RESULT_OK: 
	  	 	    		// console.log("Host details changed!");
	  	 	    		if (bAssetCritChanged) { //Reload page via ajax for now
	  	 	    		 	$("#panel-config").modal("hide");
	  	 	    			var url = '<?= $_SESSION["baseURI"] ?>/view/vHostDetails.php?idx='+hostIdx;
	  	 	    			ajaxLoader(url, ajaxContainer);		  	 	    		
	  	 	    		} else {
	  	 	    			if (bNamedChanged) {
		  	 	 				$(".breadcrumb li").last().find('a').first().text(newName);
	  	 	    			}
		  	 	  			$("#panel-config").modal("hide");
	  	 	    		}
	  	 		    	break;
	  	 	    	case AJAX_RESULT_EXCEPTION: //Exception error
	  	 		    	alert("Exception error: " + res.thrown);
	  	 		    	break;
	  	 	    	case AJAX_RESULT_ERROR:
	  	 		    default:
	  	 		    	alert("Error: " + res.thrown);
	  	 		    	break;
	  	 	    } //End of switch
	  	 	   $("#panel-config").modal("hide");
	  	     },
	       	error: function (res, error, thrown) { //Unanticipated error
	           	alert("Unknown server error: " + thrown);
	           	$("#panel-config").modal("hide");
	       	}
	  	 }) //End of ajax call			
		
		return;
	} //End of function submitHostConfig
});
</script>
