/**
 * This file contains the definition for the adAPT Password class
 * It loads the 'change'/'set' password form and handles the input
 * See constructor for public and private members
 *
 * Public methods (function properties):
 *   SetPassword - constructor
 *   open - Opens the set/change password dialog box
 *   
 *
 * Private methods (function properties):
 *   
 */

/**
 * Constructor
 * @param (obj) options - Object containing function parameters:
 * 	funcToCall (function obj) (required) - Which function to call when OK button is pressed
 *  bDisplayCurPW (bool) (optional) - Whether to display the "Current Password" box (default: true)
 *  disallowedPhrases (array) (optional) - Array of phrases/words to disallow for the password (default: empty/[])
 *  title (string) (optional) - Dialog title to use (default: "Change Password")
 */
function SetPassword(options) {
	this._funcToCall = (typeof options.funcToCall == "undefined")?this._errNoFunc:options.funcToCall;
	this._bDisplayCurPW = (typeof options.bDisplayCurPW == "undefined")?true:options.bDisplayCurPW;
	this._disallowedPhrases = (typeof options.disallowedPhrases == "undefined")?[]:options.disallowedPhrases;
	this._title = (typeof options.title == "undefined")?"Change Password":options.title;
}

/***************************
 * Public Non-Static/Instance methods
 ****************************/

/**
 * Displays the set/change password dialog box and handles input
 * when user clicks ok and everything is validated, the object's _funcToCall function is called
 */
SetPassword.prototype.open = function() {
	var curObj = this;
	
	if ($('#id_userPasswordDiv').length == 0) {
		$("body").append("<div id='id_userPasswordDiv' style='display:none;'></div>")
	}
	
	$("#id_userPasswordDiv").load(g_baseURI + "/view//forms/tChangePwd.php",  function() {
		curObj._execute();
	});
} //End of SetPassword.prototype.open function

/**
 * Closes the form 
 */
SetPassword.prototype.close = function() {
	$("#id_userPasswordDiv").dialog("close");	
}

/**
 * Returns the text in the current password text box
 * @returns string
 */
SetPassword.prototype.curPWVal = function() {
	return $("#id_curPwTxt").val();
}

/**
 * Returns the text in the new password text box
 * @returns string
 */
SetPassword.prototype.newPWVal = function() {
	return $("#id_newPwTxt").val();
}

/*************************************
 * Private Non-Static/Instance methods
 *************************************/
SetPassword.prototype._execute = function() {
	var curObj = this;
	var iconGood = g_baseURI + "/images/icons/state/good.png";
	var iconBad = g_baseURI + "/images/icons/state/bad.png";	
	var iconQuestion = g_baseURI + "/images/icons/state/question.png";
	var curPWGood = (curObj._bDisplayCurPW == false)?true:false; //If we're not displaying current password, initialize curPWGood to true; false, otherwise
	var newPWGood = false;
	var retypePWGood = false;
	
	if (!curObj._bDisplayCurPW) { //If we're not supposed to display current password box, hide it
		$("#id_pwdDiv__cur").hide();
	}
	
	//jQuery UI dialog
	$("#id_userPasswordDiv").dialog({
		width: 500,
		modal: true,
		resizable: false,
		title: curObj._title,
		position: { 
			my: "center center", 
			at: "center center"
		},			
		closeOnEscape: true,
		open: function() { //Disable submit button on form load
			$("#id_btnSubmit").button("disable");
		},
		buttons: {
			 "Submit": {
				 id: "id_btnSubmit",
				 text: "Submit",
				 click: function() {
					 //Verify user input
					 if (verifyForm()) { //User input ok
						 curObj._funcToCall();
					 } //End of if
				 } //End of 'click' property
			 },
			 Cancel: function() {
				 $(this).dialog("close");
			 }
		},		
		close: function( event, ui ) {
			$(this).remove(); //Remove dialog + div
		},
	});		
	
	//When the new password box changes, check for valid password and update password status tooltip table
	$("#id_newPwTxt").on('change keyup paste mouseup', function() {
		handleNewPwdChange($(this).val());
		updateSubmitBtnState();
	});

	//When the retype password box changes, check to make sure it matches with new password box
	$("#id_retypePwTxt").on('change keyup paste mouseup', function() {
		handleRetypePwdChange($(this).val());
		updateSubmitBtnState();
	});
	
	//When the current password box changes, set state of 'Update' button
	$("#id_curPwTxt").on('change keyup paste mouseup', function() {
		handleCurrentPwdChange($(this).val());
		updateSubmitBtnState();
	});
	
	/**********************************************************************
	 * execute inner functions
	 **********************************************************************/
	/**
	 * Enables Submit button if all pw text box values are valid; disables, otherwise
	 */
	function updateSubmitBtnState() {
		if (curPWGood && newPWGood && retypePWGood) { //All pw boxes are valid. Enable submit button
			$("#id_btnSubmit").button("enable");
		} else { //At least one pw box value is invalid. Disable submit button
			$("#id_btnSubmit").button("disable");
		}
	} //End of function updateSubmitBtnState

	/**
	 * Checks for valid 'new' password
	 * @param updatedNewPW (string) - New value of text box
	 */
	function handleNewPwdChange(updatedNewPW) {
		var scoreMap = function(score, displayTime) {
			//If display time is 'centuries', mark score as 5; else leave as is
			if (displayTime.indexOf("centuries") >= 0) {
				score = 5;
			}
			
			var colors = ["5c0000", "f91500", "fffb31", "a0f600", "6fd400", "FFD700"];
			var texts = ["very weak", "weak", "fair", "good", "excellent", "superb"];
			var percentages = [5, 25, 45, 70, 90, 100];
			return {color: colors[score], text: texts[score], percentage: percentages[score]};
		};

		//Get entropy of new password, disallowing user info such as phone, email, username, and first/last name
		var pwResults = zxcvbn(updatedNewPW, curObj._disallowedPhrases);
		
		/*
		console.log("Entropy: " + pwResults.entropy + ", Crack Time: " + pwResults.crack_time_display + ", Score: " + pwResults.score + 
				", color/text: " + scoreMap(pwResults.score).color + "/" + scoreMap(pwResults.score).text);		
		*/
		
    	//Destroy any previous qtips
		$("[id^='qtip']").remove();

		//To prevent bug where Firefox would fire “image corrupt or truncated” errors due to changing source of status images,
		//recreate the image tag
		$("#id_new_pw_profile_img").remove();
		$("#id_retype_pw_profile_img").remove();
		
		if (updatedNewPW.length == 0) { //Empty text box now'
			newPWGood = false;
			
			//Hide gradiant and password strength texts
			$("#id_pwStrengthSection").hide();
			
			//See if the 'retype password' box is also blank
			if ($("#id_retypePwTxt").val().length == 0) { //It is, just remove the 'retype password' good/bad icon image holder
				$("#id_retype_pw_profile_img").remove();
			} else { //retype password box is not blank, so we don't have a match, use 'bad' icon
				retypePWGood = false;
				$("#id_pwIconDiv__retype").append("<img id='id_retype_pw_profile_img' class='state_icon' />");
				$("#id_retype_pw_profile_img").attr("src", iconBad);
			}
			return;
		}

		var mappedScore = scoreMap(pwResults.score, pwResults.crack_time_display.toLowerCase());
		//Set background to single color gradiant, for partial fill of strength bar
		//From: http://stackoverflow.com/questions/12021233/css-to-set-the-background-color-for-just-a-percentage-of-the-width-of-a-table-ro
	    var col1="#" + mappedScore.color;
	    var col2="#FFFFFF";
		var t=document.getElementById("id_pwgradiant");
		t.style.background = "-webkit-gradient(linear, left top,right top, color-stop("+mappedScore.percentage+"%,"+col1+"), color-stop("+mappedScore.percentage+"%,"+col2+"))";
		t.style.background = "-moz-linear-gradient(left center,"+col1+" "+mappedScore.percentage+"%, "+col2+" "+mappedScore.percentage+"%)";
		t.style.background = "-o-linear-gradient(left,"+col1+" "+mappedScore.percentage+"%, "+col2+" "+mappedScore.percentage+"%)";
		t.style.background = "linear-gradient(to right,"+col1+" "+mappedScore.percentage+"%, "+col2+" "+mappedScore.percentage+"%)";

		$("#id_pwGradText").html(mappedScore.text);
		$("#id_crackTimeTxt").html(pwResults.crack_time_display);
				
		newPWGood = (pwResults.score >= 3);
		
    	//Attach 'new password' status icon.  Assign it either good/bad image source 
		$("#id_pwIconDiv__new").append("<img id='id_new_pw_profile_img' class='state_icon' />");
		$("#id_new_pw_profile_img").attr("src", newPWGood?iconGood:iconBad);

		$("#id_new_pw_profile_img").qtip({
			id:"newPW",
			content: newPWGood?"Password strength acceptable!":"Password strength must be 'good', 'excellent', or 'superb'",
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
		
		//Also update 'retype password' status icon - good = 'new' and 'retype' password boxes match; bad = no match
		retypePWGood = updatedNewPW == $("#id_retypePwTxt").val();
		$("#id_retype_pw_profile_img").remove();
		$("#id_pwIconDiv__retype").append("<img id='id_retype_pw_profile_img' class='state_icon' />");
		$("#id_retype_pw_profile_img").attr("src", retypePWGood?iconGood:iconBad);
		doRetypePWStatusTip(retypePWGood); //Create new 'retype password' status tooltip
		$("#id_pwStrengthSection").show();
	} //End of inner function handleNewPwdChange
	
	/**
	 * Checks for valid 'retype' password
	 * @param updatedRetypePW (string) - New value of text box
	 */
	function handleRetypePwdChange(updatedRetypePW) {
    	//Destroy any previous qtips
		$("[id^='qtip']").remove();
		
		//To prevent bug where Firefox would fire “image corrupt or truncated” errors due to changing source of status images,
		//recreate the image tag
		$("#id_retype_pw_profile_img").remove();
		
		if (updatedRetypePW.length == 0) { //Empty text box now
			var newPwVal = $("#id_newPwTxt").val();
			if (newPwVal.length != 0) { //The new password box is not empty, so there's still no match. use 'bad' icon
				retypePWGood = false;
				$("#id_pwIconDiv__retype").append("<img id='id_retype_pw_profile_img' class='state_icon' />");
				$("#id_retype_pw_profile_img").attr("src", iconBad);
			}
			return;
		}
		
		//Retype pw box is valid if its value matches that of the 'new password' box
		retypePWGood = (updatedRetypePW == $("#id_newPwTxt").val());
		$("#id_pwIconDiv__retype").append("<img id='id_retype_pw_profile_img' class='state_icon' />");
		$("#id_retype_pw_profile_img").attr("src", retypePWGood?iconGood:iconBad);
		
		doRetypePWStatusTip(retypePWGood);
	} //End of function handleRetypePwdChange
	
	/**
	 * Creates the 'retype password' good/bad icon tooltip
	 * @param bMatch (bool) - Whether the passwords matched
	 */
	function doRetypePWStatusTip(bMatch) {
		//retype pw icon tooltip. This will explain the good/bad icon statuses
		$("#id_retype_pw_profile_img").qtip({
			content: bMatch?"Passwords match":"New password fields do not match",
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
	} //End of function doRetypePWStatusTip

	/**
	 * Handles changing of the current password box
	 * @param updatedCurPW (string) - New value of text box
	 */
	function handleCurrentPwdChange(updatedCurPW) {
		//curPWGood is true if the text box isn't empty; false, otherwise
		curPWGood = (updatedCurPW != "")?true:false;
	} //End of function handleCurrentPwdChange
	
	/**
	 * Makes sure the password fields have valid data
	 * @returns bool - true if form is validated correctly; false, otherwise
	 */
	function verifyForm() {
		//Double check to make sure all required fields are filled in:
		//New and Retype: required
		//Current: MAY not be required
		//If current pw is required and is empty, or if either the new or retype password text box is empty, then return false 
		if (((curObj._bDisplayCurPW) && ($("#id_curPwTxt").val() == "")) || ($("#id_newPwTxt").val() == "") || ($("#id_retypePwTxt").val() == "")) {
			alert("All fields must be filled in");
			return false;
		}
		
		if ($("#id_retypePwTxt").val() != $("#id_newPwTxt").val()) {
			alert("New Password and Retype Password fields must match");
			return false;				
		}
		
		return true;
	} //End of function verifyForm
} //End of SetPassword.prototype._execute function 

SetPassword.prototype._errNoFunc = function() {
	alert("No handler function found");
	$("#id_userPasswordDiv").dialog("close");
} //End of SetPassword.prototype._errNoFunc function