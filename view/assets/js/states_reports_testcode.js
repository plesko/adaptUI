//Temp 'report' test elements
$("header").append("<div><h1><a href='#' id='id_tempCreateReport'>Create Report!!</a></h1></div>");
$("header").append("<div><h1><a href='#' id='id_tempRetrieveReport'>Retrieve Report!!</a></h1></div>");
$("header").append("<div><h1><a href='#' id='id_tempDeleteReport'>Delete Report!!</a></h1></div>");
$("header").append("<div><h1><a href='#' id='id_tempUpdateReport'>Update Report!!</a></h1></div>");

//Temp 'state' test elements
//$("header").append("<div><h1><a href='#' id='id_tempSetState'>entity state set!!</a></h1></div>");
//$("header").append("<div><h1><a href='#' id='id_tempGetState'>state retrieve!!</a></h1></div>");
//$("header").append("<div><h1><a href='#' id='id_tempDelState'>state delete!!</a></h1></div>");

//----------------------------------------    
//Temporary Report testing code
//----------------------------------------    
  	var reportCreate = 	{
		"name":"First report",
		"notes":"This be my first report!!",
		"entities": [
		    {
     			"entityType":"notif",
       		 	"cadaptIdx":"1"
		    }
		    ,{
     			"entityType":"alarm",
       		 	"cadaptIdx":"1543"
		    }
		    ,{
     			"entityType":"host",
       		 	"cadaptIdx":"12"
		    }
        ]
    };  

    $("header").on("click", "a[id='id_tempCreateReport']", function() {
    	$.ajax({  
    		type: "POST", 
    		dataType: 'json', 
    	    url: g_getURLHeader() + '/controller/cAjax.php', 
    	    data: {
    	    	"action":"createEntitiesReport",
    	    	"data": reportCreate
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
            	alert("Unknown server error: " + thrown);
        	}
    	}) //End of ajax call	
    });	

    $("header").on("click", "a[id='id_tempRetrieveReport']", function() {
    	$.ajax({  
    		type: "GET", 
    		dataType: 'json', 
    	    url: g_getURLHeader() + '/controller/cAjax.php', 
    	    data: {
    	    	"action":"retrieveEntitiesReport",
    	    	"data": {"reportIdx":3}
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
            	alert("Unknown server error: " + thrown);
        	}
    	}) //End of ajax call	
    });	        

    $("header").on("click", "a[id='id_tempDeleteReport']", function() {
    	$.ajax({  
    		type: "POST", 
    		dataType: 'json', 
    	    url: g_getURLHeader() + '/controller/cAjax.php', 
    	    data: {
    	    	"action":"deleteEntitiesReport",
    	    	"data": {"reportIdx":2}
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
            	alert("Unknown server error: " + thrown);
        	}
    	}) //End of ajax call	
    });	        

    var updateReport = {
        "reportIdx":1,
        "entities": [
 		    {
      			"entityType":"notif",
				"cadaptIdx":"10"
 		    }
 		    ,{
      			"entityType":"alarm",
        		"cadaptIdx":"10201"
 		    }
 		    ,{
      			"entityType":"host",
        		"cadaptIdx":"12"
 		    }
		]        
    };   

    $("header").on("click", "a[id='id_tempUpdateReport']", function() {
    	$.ajax({  
    		type: "POST", 
    		dataType: 'json', 
    	    url: g_getURLHeader() + '/controller/cAjax.php', 
    	    data: {
    	    	"action":"updateEntitiesReport",
    	    	"data": updateReport
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
            	alert("Unknown server error: " + thrown);
        	}
    	}) //End of ajax call	
    });	
//----------------------------------------    
//Temporary state testing code
//----------------------------------------    
    stateDelete =
    [
    	{ //Index 0
    		"entityType":"host",
    		"cadaptIdx":"12345"
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
    	     "cadaptIdx":"12345",
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
