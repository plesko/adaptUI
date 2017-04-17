<script>
$(document).ready(function(){

	$("#page-title").text("Frequent Notifications")
	$("#page-sub-title").text("Overview & Stats")

  // $('#ajax-content').on('click', '#freqNotifTable-full tbody tr', function(event) {
  //   console.log($(this).attr('id'))
  //   event.preventDefault()
  //   event.stopPropagation()
  //   var url = '<?= $_SESSION["baseURI"] ?>/view/vNotifDetails.php?idx='+$(this).attr('id')
  //   console.log(url);
  //   // ajaxLoader(url, ajaxContainer)
  // })
  
  var freqNotifTable = function() { 
    $.getJSON(<?= $freqNotifData ?>, function(data){
      // console.log(data)
      createFreqNotifPanel();
      createFreqNotifTable(data.data);
    })
  }
  freqNotifTable();

  function createFreqNotifTable(freqNotifData) {
    $('#freqNotifTable-full')
      .dataTable({
        autoWidth: false,
        data: freqNotifData,
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
          { title: "Notification",
            data: "type",
            className: "type left" },
          { title: "Description",
            data: "desc",
            className: "desc left" },
          { title: "Associated Hosts",
            data: "hostCnt",
            className: "threatScore center" },
          { title: "Total Notifications",
            data: "notifCnt",
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
          $(row).attr("id", data.idx).attr("data-type", "notif").addClass('seen');
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

  function createFreqNotifPanel() {
    $('.template').clone().removeClass('template').addClass('freqNotifs')
      .find('.panel-title .text-bold')
      .text('Frequent Notifications')
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table top-align" id="freqNotifTable-full"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  }
});

</script>