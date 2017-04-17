<script>
$(document).ready(function(){

	$("#page-title").text("Recent Notifications")
	$("#page-sub-title").text("Overview & Stats")

  // $('#ajax-content').on('click', 'tbody tr .select i', function(event) {
  //   event.stopPropagation()
  //   event.preventDefault();
  //   if ($(this).hasClass('fa-circle')) {
  //     $(this).removeClass('fa-circle').addClass('fa-check-square-o');
  //     $('#item-actions').addClass('slideOut').addClass('animate');
  //   } else if ($(this).hasClass('fa-square-o')) {
  //     $(this).removeClass('fa-square-o').addClass('fa-check-square-o');
  //     $('#item-actions').addClass('slideOut').addClass('animate');
  //   } else if ($(this).hasClass('fa-check-square-o')) {
  //     $(this).removeClass('fa-check-square-o').addClass('fa-square-o');
  //     if($(".select i").hasClass("fa-check-square-o")) {
  //       // other checked boxes still
  //     } else {
  //       $('#item-actions').removeClass('slideOut').addClass('animate');
  //     }
  //   }
  //   var url = '<?= $_SESSION["baseURI"] ?>/view/vNotifDetails.php?idx='+$(this).parent("tr").attr('id')
  //   // ajaxLoader(url, ajaxContainer)
  // })
  
  var recentNotifTable = function() { 
    $.getJSON(<?= $recentNotifData ?>, function(data){
      // console.log(data)
      createRecentNotifPanel();
      createRecentNotifTable(data.data)
    })
  }
  recentNotifTable();

  function createRecentNotifTable(recentNotifData) {
    $('#recentNotifTable-full')
      .dataTable({
        autoWidth: false,
        data: recentNotifData,
        searching: true,
        paging: true,
        pageLength: 10,
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
          $(row).attr("id", data.idx).attr("data-type", "notif").addClass('seen')
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

  function createRecentNotifPanel() {
    $('.template').clone().removeClass('template').addClass('recentNotifs')
      .find('.panel-title .text-bold')
      .text('Recent Notifications')
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table top-align" id="recentNotifTable-full"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  }
});

</script>