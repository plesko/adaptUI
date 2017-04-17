<script>
$(document).ready(function(){

	$("#page-title").text("Recent Alarms")
	$("#page-sub-title").text("Overview & Stats")
  
  var recentAlarmTable = function() { 
    $.getJSON(<?= $recentAlarmData ?>, function(data){
      // console.log(data)
      createRecentAlarmPanel();
      createRecentAlarmTable(data.data)
    })
  }
  recentAlarmTable();

  function createRecentAlarmTable(intervalAlarmData) {
    $('#recentAlarmTable')
      .dataTable({
        autoWidth: false,
        data: intervalAlarmData,
        searching: true,
        paging: true,
        order: [[6, "desc"]],
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
          { title: "Alarm",
            data: "type",
            className: "type left",
            render: function (data, type, full, meta){
              return '<a class="alarmDetailsLink" data-idx="'+full.idx+'" href="#" title="View Alarm Details">'+data+'</a>'; 
            }
          },
          { title: "Alarm Description",
            data: "desc",
            className: "desc left",
            visible: false },
          { title: "Host",
            data: "hostName",
            className: "host left",
            render: function (data, type, full, meta){
              return '<a class="hostDetailsLink" data-idx="'+full.hostIdx+'" href="#" title="View Host Details">'+data+'</a>'; 
            }
          },
          { title: "Host Idx",
            data: "hostIdx",
            visible: false },
          { title: "Asset Criticality",
            data: "assetCrit" },
          { title: "Timestamp",
            data: "date",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }
          },
          { title: "Rule Idx",
            data: "ruleIdx",
            visible: false },
          { title: "Severity",
            data: "severity" },
          { title: "Threat Score",
            data: "threatScore" },
          { title: "Alarm Idx",
            data: "idx",
            visible: false }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr("data-type", "alarm").addClass('seen')
        }
      })
    .end()
      .find('.dataTables_length').hide()
    .end()
  }

  function createRecentAlarmPanel() {
    $('.template').clone().removeClass('template').addClass('recentAlarms')
      .find('.panel-title .text-bold')
      .text('Recent Alarms')
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table" id="recentAlarmTable"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  }
});

</script>