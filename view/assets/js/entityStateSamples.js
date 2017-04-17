$("header").append("<div><h1><a href='#' id='id_tempSetState'>entity state set!!</a></h1></div>");
$("header").append("<div><h1><a href='#' id='id_tempGetState'>state retrieve!!</a></h1></div>");
$("header").append("<div><h1><a href='#' id='id_tempDelState'>state delete!!</a></h1></div>");
$("header").append("<div><h1><a href='#' id='id_tempChangeHostName'>change host name!!!</a></h1></div>");

      stateDelete =
      [
      	{ //Index 0
      		"entityType":"host",
      		"cadaptIdx":"54"
      	}
      ];

      stateSet = [
           {
      	     "entityType":"notif",
      	     "cadaptIdx":"1",
      	     "newState":"seen"
           }
           ,{
      	     "entityType":"host",
      	     "cadaptIdx":"123",
      	     "newState":"unseen"
           }
      ];

      stateRetrieve = [
      	{
      		"entityType":"notif",
      		"cadaptIdx":"1",
      	}
      	,{
      		"entityType":"alarm",
      		"cadaptIdx":"54",
      	}
      ];

      $("header").on("click", "a[id='id_tempDelState']", function() {
      	$.ajax({  
      		type: "POST", 
      		dataType: 'json', 
      	    url: g_getURLHeader() + '/controller/cAjax.php', 
      	    data: {
      	    	"action":"deleteEntitiesStates",
      	    	"data": stateDelete
      	    },
      	    success: function(res) { 
      		    console.log(res);
      		    switch (res.result) {
      		    	case AJAX_RESULT_OK: 
      		    		console.log("OK!");
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
      });


      $("header").on("click", "a[id='id_tempSetState']", function() {
      	$.ajax({  
      		type: "POST", 
      		dataType: 'json', 
      	    url: g_getURLHeader() + '/controller/cAjax.php', 
      	    data: {
      	    	"action":"updateEntitiesStates",
      	    	"data":stateSet
      	    },
      	    success: function(res) { 
      		    console.log(res);
      		    switch (res.result) {
      		    	case AJAX_RESULT_OK: 
      		    		console.log("OK!");
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
      });

      $("header").on("click", "a[id='id_tempGetState']", function() {
      	$.ajax({  
      		type: "GET", 
      		dataType: 'json', 
      	    url: g_getURLHeader() + '/controller/cAjax.php', 
      	    data: {
      	    	"action":"retrieveEntitiesStates",
      	    	"data": stateRetrieve
      	    },
      	    success: function(res) { 
      		    console.log(res);
      		    switch (res.result) {
      		    	case AJAX_RESULT_OK: 
      		    		console.log("OK!");
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
      });

      $("header").on("click", "a[id='id_tempChangeHostName']", function() {
      	$.ajax({  
      		type: "POST", 
      		dataType: 'json', 
      	    url: g_getURLHeader() + '/controller/cAjax.php', 
      	    data: {
      	    	"action":"setHostName",
      	    	"data":{ newName: "Scott wuz here", hostIdx: 4}
      	    },
      	    success: function(res) { 
      		    console.log(res);
      		    switch (res.result) {
      		    	case AJAX_RESULT_OK: 
      		    		console.log("OK!");
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
      });
