<script>
$(document).ready(function(){

	$("#page-title").text("Frequent Hosts")
	$("#page-sub-title").text("Overview & Stats")

  $('#ajax-content').one( 'click', 'tbody tr', function (event) { //User clicked on a row
	var idx = $(this).attr("id");
	var url = g_baseURI + "/view/vHostDetails.php?idx=" + idx;
	ajaxContainer = $("#ajax-content");
    event.preventDefault();
    event.stopPropagation();
	// ajaxLoader(url, ajaxContainer);
  });
	
  var freqHostsTable = function() { 
    $.getJSON(<?= $hostData ?>, function(data){
      // console.log(data)
      createFreqHostsPanel();
      createFreqHostsTable(data.data)
    })
  }
  freqHostsTable();

  function createFreqHostsTable(hostData) {
    $('#freqHostsTable-full')
      .dataTable({
        autoWidth: false,
        data: hostData,
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
          { title: "Host",
            data: "host",
            className: "host left" },
          { title: "Asset Criticality",
            data: "assetCrit",
            className: "assetCrit center" },
          { title: "Total Alarms",
             data: "alarmCnt",
            className: "totalAlarms center" },
          { title: "Time & Date",
            data: "date",
            className: "lastConnection center",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            }
          },
          { title: "Percentage of All",
            data: "percentage",
            className: "percentage center" }
        ],
        createdRow: function( row, data, dataIndex ) {
          $(row).attr("id", data.idx).attr("data-type", "host").addClass('seen')
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
	  

  function createFreqHostsPanel() {
    $('.template').clone().removeClass('template').addClass('freqAlarms')
      .find('.panel-title .text-bold')
      .text('Frequent Hosts')
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table clickable" id="freqHostsTable-full"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  };
});

</script>