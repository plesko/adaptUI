<script>
$(document).ready(function(){
	$("#page-title").text("Notification Details")
	$("#page-sub-title").text("Overview & Stats")
	
  	var notificationDetailsTable = function() { 
    	$.getJSON(<?= $notifDetailsData ?>, function(data){
      		createNotificationDetailsPanel();
      		createNotificationDetailsTable(data)
          // console.log(data);   

          stateSet = [
           {
             "entityType":"notif",
             "cadaptIdx": data.data.idx,
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
    	})
  	}(); //Run immediately

  	/*****************************
  		Functions
  	******************************/
	function createNotificationDetailsTable(notifData) {
		var notifyTypeIdx = notifData.data["notifyListIdx"];

		//Convert date from UTC time to user local time
		notifData.data["time"] = g_convertFromUTC(notifData.data["time"]);
		
        var fieldNames = function() {
            switch (notifyTypeIdx) {
                case 26: //ICMP Overlarge size
                case 27: //ICMP Invalid Time to Live
                case 28: //ICMP Illegal Type
                case 29: //ICMP Illegal Code
                    //Same fields for all ICMP notifications
	                return [
	                    "notifType",
	                    "notifDesc",
	                    "initHostName",
	                    "initIp",
	                    "respHostName",
	                    "respIp",
	                    "icmpTTL",
	                    "icmpSize",
	                    "icmpType",
	                    "icmpCode",		                    
	                    "time"
		            ];
		            break;
    	        case 51: //DNS Error
	                return [
	                    "notifType",
	                    "notifDesc",
	                    "initIp",
	                    "initHostName",
	                    "url",
	                    "dnsErrorCode",
	                    "dnsErrorName",
	                    "dnsErrorDesc",
	                    "initMac",
	                    "time"
	                ];
	                break;
	            default:
	                return [
	                    "notifType",
	                    "notifDesc",
	                    "initHostName",
	                    "initIp",
	                    "initPort",
	                    "respHostName",
	                    "respIp",
	                    "respPort",
	                    "time"
	                ];
	                break;
			} //End of switch
        }(); //End of fieldNames function

        //Map field names to column names
      	var columnNames = fieldNames.map(function(fieldName) {
			var colName = "";
          	switch (fieldName) {
        		case "idx":
                	colName = "Notification Idx";
                	break;
              	case "notifyListIdx":
                	colName = "Notification Type Idx";
                	break;
              	case "notifType":
                	colName = "Notification Type";
                	break;
              	case "notifDesc":
                	colName = "Notification Description";
                	break;
              	case "initIp":
                	colName = "Source Host IP";
                	break;
              	case "respIp":
                	colName = "Target Host IP";
                	break;
              	case "initPort":
        	        colName = "Source Port";
                	break;
              	case "respPort":
        	        colName = "Target Port";
                	break;
              	case "initMac":
        	        colName = "Source MAC Address";
                	break;
              	case "respMac":
        	        colName = "Target MAC Address";
                	break;
              	case "errorSeen":
                	break;
              	case "len":
                	break;
              	case "url":
                  	switch (notifyTypeIdx) {
                  	    case 51: //DNS
                      	    colName = "DNS Name being Requested";
                      	    break;
                      	default:
                          	break;
                  	} 
                	break;
        	      case "icmpTTL":
                	colName = "ICMP Time to Live";
                	break;
              	case "icmpSize": 
        	        colName = "ICMP Packet Size";
            	    break;
              	case "icmpType":
        	        colName = "ICMP Type";
                	break;
              	case "icmpCode":
        	        colName = "ICMP Code";
                	break;
              	case "time":
        	        colName = "Timestamp";
                	break;
              	case "initHostName":
        	        colName = "Source Host Name";
                	break;
              	case "respHostName":
        	        colName = "Target Host Name";
                	break;
              	case "dnsErrorCode":
                  	colName = "DNS Response Code";
                  	break;
              	case "dnsErrorName":
                  	colName = "DNS Response Name";
                  	break;
              	case "dnsErrorDesc":	
                	colName = "DNS Response Description";
                	break;		
				default:
					colName = "";
	              	break;
          	} //End of switch
          	return colName;
		}); //End of mapping

		var columns = {
        	"columnNames":columnNames,
            "columnMaps":fieldNames
        };
        g_createInfoTable('notificationDetailsTable', notifData.data, columns);
	}; //End of createNotificationDetailsTable function 

	function createNotificationDetailsPanel() {
    	$('.template').clone().removeClass('template').addClass('notifDetails')
		.find('.panel-title .text-bold')
  		.text('Notification Details')
		.end()
  		.find('.panel-body')
  		.html( '<table cellpadding="0" cellspacing="0" border="0" class="display table clickable" style="width:40em;" id="notificationDetailsTable"></table>' )
		.end()
  		.appendTo('#ajax-content')
		.end()
		.show()
		.addClass('animated')
		.addClass('fadeInUp');
	};
});

</script>