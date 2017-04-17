/**
 * This file contains the functions that the template.php depends on.
 * Putting the functions in this file so the code is hidden (doesn't spam)
 * in debugs/firebug/etc. File can be selected individually in these debuggers
 * to show code. Since this code would always be shown in all pages because template.php
 * is loaded for every page.
 */


/**
 * Brings up the change user password dialog box, via the SetPassword class
 * @param userObj (obj) - Contains user information
 *  userName (string)
 *  userIdx (integer)
 *  firstName (string)
 *  lastName (string)
 *  email (string)
 *  phone (string)
 */
function doUserPW(userObj) {
	var options = {
		"funcToCall": updatePW,
		"bDisplayCurPW": true,
		"disallowedPhrases": function() { //With some exceptions, put each object parameter's value in an array
			var retArray = [];
			$.each(userObj, function(param, value) {
				if (param.toLowerCase().indexOf("idx") < 0) { //Skip user id, other ids
					retArray.push(value);
				}
			});
			return retArray;
		}(),
		"title": "Change Password"
	};
	var setPWObj = new SetPassword(options);

	setPWObj.open();
	
	/**
	 * Sends AJAX request to update user password in the DB
	 */
	function updatePW() {
		var pwData = {
			curPWPost: hex_sha512(setPWObj.curPWVal()),
			newPWPost: hex_sha512(setPWObj.newPWVal())
		};
		
		//Now send an ajax request to the cAjaxCommon page
		$.ajax({  
			type: "POST", 
			dataType: 'json', 
		    url: g_getURLHeader() + '/controller/cAjax.php', 
		    data: {
		    	"action":"changeOwnPW",
		    	"data":pwData
		    },
		    success: function(res) { 
			    switch (res.result) {
			    	case AJAX_RESULT_OK: //Password changed
			    		setPWObj.close();
			    		alert("Password changed");
				    	break;
			    	case AJAX_RESULT_EXCEPTION: //Exception error
				    	alert("Exception error: " + res.thrown);
				    	break;
			    	case AJAX_RESULT_ERROR: //Invalid user and/or password
				    default:
				    	alert("Error: " + res.thrown);
				    	break;
			    } //End of switch
		    },
	    	error: function (res, error, thrown) { //Unanticipated error
	        	alert("Submit error: " + thrown);
	    	}
		}) //End of ajax call
	} //End of function updateDB
} //End of function doUserPW

/**
 * Loads the tUserProfile into the appropraite div and calls executeUserProfile
 * @param userObj (obj) - Contains user information - See 'executeUserProfile' function comments
 */
function doUserProfile(userObj) {
	if ($('#id_userProfileDiv').length == 0) {
		$("body").append("<div id='id_userProfileDiv' style='display:none;'></div>")
	}
	
	$("#id_userProfileDiv").load(g_baseURI + "/view//forms/tUserProfile.php",  function() {
		executeUserProfile(userObj);
	});
	
	/**
	 * Brings up the user profile dialog box and allows user to change info
	 * @param userObj (obj) - Contains user information
	 *  userName (string)
	 *  userIdx (integer)
	 *  firstName (string)
	 *  lastName (string)
	 *  email (string)
	 *  phone (string)
	 */
	function executeUserProfile(userObj) {
		var lastEmailValue = userObj.email;
		var iconGood = g_baseURI + "/images/icons/state/good.png";
		var iconBad = g_baseURI + "/images/icons/state/bad.png";	
		var iconQuestion = g_baseURI + "/images/icons/state/question.png";

		$("#id_firstNameTxt").val(userObj.firstName);
		$("#id_lastNameTxt").val(userObj.lastName);
		$("#id_emailTxt").val(userObj.email);
		$("#id_phoneTxt").val(userObj.phone);
		$("#id_userNameTxtDiv").html(userObj.userName);
		
		//Set up phone mask
		$("#id_phoneTxt").inputmask("(999) 999-9999",
		    {
				"onincomplete": function() { //User left phone field incomplete (including making it empty)
					$("#id_phone_profile_img").remove();
					if ($(this).inputmask('unmaskedvalue') != "") { //Field not empty - just incomplete
						$("#id_phoneIconDiv").append("<img id='id_phone_profile_img' class='state_icon' src='" + iconBad + "'/>");
					}
				},
				"oncleared": function() { //User cleared phone field
					$("#id_phone_profile_img").remove();
				},
				"oncomplete": function() { //User completely filled in phone field
					$("#id_phone_profile_img").remove();
					$("#id_phoneIconDiv").append("<img id='id_phone_profile_img' class='state_icon' src='" + iconGood + "'/>");
				}
			}
		);

		//jQuery UI dialog
		$("#id_userProfileDiv").dialog({
			width: 500,
			modal: true,
			resizable: false,
			title: "User Profile",
			position: { 
				my: "center center", 
				at: "center center"
			},			
			closeOnEscape: true,
			 buttons: {
				 "Okay": function() {
					 var changedInfoObj = {};
					 //Verify user input
					 if (verifyForm(changedInfoObj)) { //User input ok
						 //If we're changing any fields, update the database
						 if (!($.isEmptyObject(changedInfoObj))) { //Changing at least one field
							 updateDB(changedInfoObj); //
						 } else {
							 $(this).dialog("close");
						 }
					 }
				 },
				 Cancel: function() {
					 $(this).dialog("close");
				 }
			},		
			close: function( event, ui ) {
				$(this).remove(); //Remove dialog + div
			},
		});		
		
		$("#id_emailTxt").on('change keyup paste mouseup', function() {
			handleEmailChange($(this).val());
		});
		
		/**********************************************************************
		 * executeUserProfile inner functions
		 **********************************************************************/
		/**
		 * Checks for valid 'email'
		 * @param updatedEmail (string) - New value of text box
		 */
		function handleEmailChange(updatedEmail) {
			var bGood;
			
			if (updatedEmail == lastEmailValue) { //Value didn't change
				return;
			}
			
			bGood = g_validateEmail(updatedEmail);
			
			//Update lastNewPwValue
			lastEmailValue = updatedEmail;
			
			//To prevent bug where Firefox would fire “image corrupt or truncated” errors due to changing source of status images,
			//recreate the image tag
			$("#id_email_profile_img").remove();
			
			if (updatedEmail == "") { //user removed email adddres
				return;
			}
			
			$("#id_emailIconDiv").append("<img id='id_email_profile_img' class='state_icon' />");
			$("#id_email_profile_img").attr("src", bGood?iconGood:iconQuestion);
			
			$("#id_email_profile_img").qtip({
				id:"newEmail",
				content: bGood?"Valid Email":"This doesn't appear to be a valid email address",
				position: {
		        	my: 'left center',
			    	at: 'right center',
			    	adjust: {
			    		x: 5
			        }
		        },
			  	style: { 
					classes: 'tooltip-popup qtip-light',
					tip: {
				    	corner: 'left center'
					} 
				}	
		     });	
		} //End of function handleEmailChange

		/**
		 * Determines if the input fields are valid and informs user of errors
		 * @param changedInfoObj (obj) - Output parameter - Function will add fields that have changed as object properties
		 * @returns bool - true if form is validated correctly; false, otherwise
		 */
		function verifyForm(changedInfoObj) {
			$("#id_firstNameTxt, #id_lastNameTxt, #id_emailTxt").each(function() {
				var szTrim = $(this).val().trim();
				var szVal = (szTrim == "")?null:szTrim; //If value is empty, set to null
				var dbField = $(this).attr("dbField"); //Extract database field from dbField attribute
				var bChanged = (szVal != userObj[dbField]);
				
				//If field value changed, add to field/value to changedInfoObj object
				if (bChanged) {
					changedInfoObj[dbField] = szVal;
				}
			})
			
			var phoneDigits = $("#id_phoneTxt").inputmask('unmaskedvalue');
			if ((phoneDigits.length > 0) && (phoneDigits.length != 10)) {
				alert("Please enter a valid phone number");
				return false;
			}
			
			var handlePhone = function() {
				var dbField = $("#id_phoneTxt").attr("dbField"); //Extract database field from dbField attribute
				var bChanged = (phoneDigits != userObj[dbField]);
				
				//If field value changed, add to field/value to changedInfoObj object
				if (bChanged) { 
					changedInfoObj[dbField] = phoneDigits;
				}
				
			}();
			
			return true;
		} //End of function verifyForm
		
		/**
		 * Sends AJAX request to update DB
		 * @param changedInfoObj (obj - input param) - Object containing db field names and their new field values
		 */
		function updateDB(changedInfoObj) {
			var data = {};
			
			if ($.isEmptyObject(changedInfoObj)) { //not updating any fields
				return;
			}
			
			//Now send an ajax request to the cAjaxCommon page
			$.ajax({  
				type: "POST", 
				dataType: 'json', 
			    url: g_getURLHeader() + '/controller/cAjax.php', 
			    data: {
			    	"action":"changeUserInfo",
			    	"data": { 
			    		"idx" : userObj.userIdx,
			    		"changedInfo": changedInfoObj
			    	}
			    },
			    success: function(res) { 
				    switch (res.result) {
				    	case AJAX_RESULT_OK: //Password changed
				    		$("#id_userProfileDiv").dialog("close");
				    		alert("Profile updated");
					    	break;
				    	case AJAX_RESULT_EXCEPTION: //Exception error
					    	alert("Exception error: " + res.thrown);
					    	break;
				    	case AJAX_RESULT_ERROR: //Invalid user and/or password
					    default:
					    	alert("Error: " + res.thrown);
					    	break;
				    } //End of switch
			    },
		    	error: function (res, error, thrown) { //Unanticipated error
		        	alert("Submit error: " + thrown);
		    	}
			}) //End of ajax call
			
			return;
		} //End of function updateDB
	} //End of function executeUserProfile	
} //End of function doUserProfile


	