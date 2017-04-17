<script>
$(document).ready(function(){
  var reportData;
  var reportIdxUserReport = <?= $reportIdx ?>;
  // console.log("reportIdxUserReport is: " +reportIdxUserReport);   
  $("#page-title").text("User Report")
  $("#page-sub-title").text("Overview & Stats")

  // Need to switch from add to report to remove from report
  // $("#item-actions").find('.edit-report-toggle').html('<i class="fa fa-minus"></i>Remove from Report</a>').parent('li').removeClass('dropdown')

  // $('#ajax-content').one('click', '#recentAlarmTable tbody tr', function(event) {
  //   console.log($(this).attr('id'))
  //   event.preventDefault()
  //   event.stopPropagation()
  //   var url = '<?= $_SESSION["baseURI"] ?>/view/vAlarmDetails.php?idx='+$(this).attr('id')
  //   // ajaxLoader(url, ajaxContainer)
  // })
  
  var getReportData = function() { 
    $.ajax({  
      type: "GET", 
      dataType: 'json', 
        url: g_getURLHeader() + '/controller/cAjax.php', 
        data: {
          "action":"retrieveEntitiesReport",
          "data": {"reportIdx": reportIdxUserReport}
        },
        success: function(res) { 
          // console.log(res);
          switch (res.result) {
            case AJAX_RESULT_OK: 
              // console.log("OK!");
              reportData = res.data;
              initPage(res.data);
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
  }
  getReportData();

  function initPage(reportData) {
    var alarmEntities = [], notifEntities = [], hostEntities = []
    $.each(reportData.entities, function(index, val) {
      // console.log(val);
      if (val.entityType == "alarm") {
        alarmEntities.push(val.cadaptIdx)
      } else if (val.entityType == "notif") {
        notifEntities.push(val.cadaptIdx)
      } else if (val.entityType == "host") {
        hostEntities.push(val.cadaptIdx)
      }
    });
    if (alarmEntities.length > 0) {
      createUserReportPanel("alarm", "Alarms")
      getEntityDetails("alarm", alarmEntities)
    }
    if (notifEntities.length > 0) {
      createUserReportPanel("notif", "Notifications")
      getEntityDetails("notif", notifEntities)
      // createUserReportTable("Notifications", notifEntities)
    }
    if (hostEntities.length > 0) {
      createUserReportPanel("host", "Hosts")
      getEntityDetails("host", hostEntities)
      // createUserReportTable("Hosts", hostEntities)
    }
    $("#page-title").text(reportData.name)
    $("#page-sub-title").text(reportData.notes)
  }

  function getEntityDetails(type, entities) {
    // console.log(entities);
    $.ajax({  
      type: "GET", 
      dataType: 'json', 
      url: g_getURLHeader() + '/controller/cAjax.php', 
      data: {
        "action": "retrieveEntityDetails",
        "data": { "entityType": type, 
          "cadaptIdxs": entities }
      },
      success: function(res) { 
        switch (res.result) {
          case AJAX_RESULT_OK: 
            createUserReportTable(type, res.data)
            break;
          case AJAX_RESULT_EXCEPTION: //Exception error
            console.log("Exception error: " + res.thrown);
            break;
          case AJAX_RESULT_ERROR:
          default:
            console.log("Error: " + res.thrown);
            break;
        } //End of switch
      },
      error: function (res, error, thrown) { //Unanticipated error
          console.log("Unknown server error: " + thrown);
      }
    }) //End of ajax call
  }

  function createUserReportTable(catype, entities) {
    
    if (catype == "alarm") {
      $('#userReport'+catype+'Table')
        .dataTable({
          autoWidth: false,
          data: entities,
          searching: true,
          paging: true,
          pagingType: "simple",
          order: [[1, "asc"]],
          dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
               "<'row'<'col-sm-12'tr>>" +
               "<'row'<'col-sm-5'i><'col-sm-7'p>>",
          info: false,
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
          }
        })
      .end()
        .find('.dataTables_length').hide()
      .end()
    } else if (catype == "notif") {
      $('#userReport'+catype+'Table')
        .dataTable({
          autoWidth: false,
          data: entities,
          searching: true,
          paging: true,
          pagingType: "simple",
          order: [[1, "asc"]],
          dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
               "<'row'<'col-sm-12'tr>>" +
               "<'row'<'col-sm-5'i><'col-sm-7'p>>",
          info: false,
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
    } else if (catype == "host") {
      $('#userReport'+catype+'Table')
        .dataTable({
          autoWidth: false,
          data: entities,
          searching: true,
          paging: true,
          pagingType: "simple",
          order: [[1, "asc"]],
          dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
               "<'row'<'col-sm-12'tr>>" +
               "<'row'<'col-sm-5'i><'col-sm-7'p>>",
          info: false,
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
              render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
                return g_convertFromUTC(data);
              },
              className: "lastConnection" },
            { title: "Percentage of All",
              data: "percentage",
              className: "percentage",
              visible: false
             }
          ],
          createdRow: function( row, data, dataIndex ) {
            $(row).attr("id", data.idx).attr('data-type', 'host');
          }
        })
      .end()
        .find('.dataTables_length').hide()
      .end()
    }
  }

  function createUserReportPanel(type, title) {
    $('.template').clone().removeClass('template').addClass('user-report-panel')
      .find('.panel-title .text-bold')
      .text(title)
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table clickable top-align" id="userReport'+type+'Table"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  }

  //*********************************
  //*Report meta-data modal box
  //*********************************/
  $(document).on("click", ".submitUpdateReportMeta", function() {   
    submitUpdateReportMeta();
  });

  $(".main-wrapper").on('click', '#report-config', function(event) {
    var currentName = reportData.name;
    var currentNotes = reportData.notes;
        
    var $el = $("#panel-config").find('.modal-footer .btn-primary').removeClass().addClass("btn btn-primary submitUpdateReportMeta").end().find('.toggle-content').addClass('hidden').end().find(".modal-title").text('Update Report').end().find('.update-report').removeClass('hidden').end();

    $(".update-report input[id='report-name']").val(currentName);
    $(".update-report textarea[id='report-notes']").val(currentNotes);
    
    event.preventDefault();
    $el.modal();
  });
  
  //**
  //* Function to save new report meta-data (name/notes)
  //*
  function submitUpdateReportMeta() {
    var newName = $(".update-report input[id='report-name']").val().trim();
    var newNotes = $(".update-report textarea[id='report-notes']").val().trim(); //Tag removal takes place just on server side for now
    var data = {"reportIdx":reportIdxUserReport};
    var bNameChanged = bNotesChanged = false;
    
    if (newName == "") { //Empty string
      alert("Please provide a name for this report");
      return;     
    }

    if (newName != reportData.name) { //Name is changing
      data["newName"] = newName.replace(/<[^>]+>/g,""); //Remove tags for name - so new name will display on sidebar properly
      bNameChanged = true;
    } 
    
    if (newNotes != reportData.notes) { //Notes is changing
      //Notes is not displayed anywhere else (on sidebar or on current page) so we don't need to remove 
      //tags here (they will be removed on server side) 
      data["newNotes"] = newNotes;
      bNotesChanged = true;
    } 
    
    if (!bNameChanged && !bNotesChanged ) { //No info is changing
      alert("No fields have been modified from their original values");
      return;
    }

    $.ajax({  
        type: "POST", 
        dataType: 'json', 
          url: g_getURLHeader() + '/controller/cAjax.php', 
          data: {
            "action":"updateEntitiesReport",
            "data": data
           },
           success: function(res) { 
            // console.log(res);
            switch (res.result) {
              case AJAX_RESULT_OK: 
                // console.log("Report details changed!");
                if (bNameChanged) {
                    //Change name in the side-bar (text and title)           
                    $(".main-navigation-menu li.user-report").find("a[id='"+ reportIdxUserReport + "']").parent("li").html('<a id="'+reportIdxUserReport+'" href="#" title="'+data["newName"]+'"><i class="fa fa-file-text-o fa-fw icon"></i> '+data["newName"]+'<i class="fa fa-remove action delete"></i></a>');

                    //$("li .user-report a[id='"+ reportIdxUserReport + "']").text(data["newName"]);  
                    //$("li .user-report a[id='"+ reportIdxUserReport + "']").prop("title", data["newName"]);
                }
                hideModal();
                var url = '<?= $_SESSION["baseURI"] ?>/view/vUserReport.php?idx='+reportIdxUserReport; //Reload user report page (to reset vars)
                ajaxLoader(url, ajaxContainer);
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

    return;
  } //End of function submitUpdateReportMeta

  //Hides the modal and removes the specific class
  function hideModal() {
    var $panel= $("#panel-config").find('.submitUpdateReportMeta');
//    $panel.removeClass("submitUpdateReportMeta");
    $("#panel-config").modal("hide");
  } //End of function hideModal()       
  
});

</script>