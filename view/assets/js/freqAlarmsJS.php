<script>
$(document).ready(function(){

	$("#page-title").text("Frequent Alarms")
	$("#page-sub-title").text("Overview & Stats")

/*  $('#ajax-content').one( 'click', 'tbody tr', function (event) { //User clicked on a row
	var idx = $(this).attr("id");
	var url = g_baseURI + "/view/vAlarmDetails.php?idx=" + idx;
	ajaxContainer = $("#ajax-content");
    event.preventDefault();
    event.stopPropagation();
	ajaxLoader(url, ajaxContainer);
  });  
*/
	
  var freqAlarmsTable = function() { 
    $.getJSON(<?= $freqAlarmData ?>, function(data){
      // console.log(data)
      createFreqAlarmsPanel();
      createfreqAlarmsTable(data.data)
    })
  }
  freqAlarmsTable();

  function createfreqAlarmsTable(alarmData) {
    $('#freqAlarmsTable-full')
      .dataTable({
        autoWidth: false,
        data: alarmData,
        searching: true,
        paging: true,
        processing: true,
        info: false,
        dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        order: [ [ 5, "desc" ] ],
        columns: [
          { targets: 0,
            orderable: false,
            className: "select",
            render: function (data, type, full, meta){
              return '<i class="fa fa-square-o fa-fw"></i>'; 
            }
          },
          { title: "Alarm",
            data: "type",
            className: "type left" },
          { title: "Description",
            data: "desc",
            className: "desc left" },
          { title: "Associated Hosts",
            data: "hostCnt",
            className: "threatScore center" },
          { title: "Total Alarms",
            data: "alarmCnt",
            className: "threatScore center" },
          { title: "Percentage of All",
            data: "percentage",
            className: "threatScore center" },
          { title: "Last Connection",
            data: "date",
            className: "lastConnection center",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }
		  }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr("data-type", "alarm").addClass('seen');
        }
      })
    .end()
      .find('.dataTables_length').hide()
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  }
	  

  function createFreqAlarmsPanel() {
    $('.template').clone().removeClass('template').addClass('freqAlarms')
      .find('.panel-title .text-bold')
      .text('Frequent Alarms')
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table clickable" id="freqAlarmsTable-full"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  };
});

</script>