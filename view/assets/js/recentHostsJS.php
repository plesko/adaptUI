<script>
$(document).ready(function(){

	$("#page-title").text("Recent Hosts")
	$("#page-sub-title").text("Overview & Stats")

  // $('#ajax-content').one('click', '#recentHostsTable tbody tr', function(event) {
  //   console.log($(this).attr('id'))
  //   event.preventDefault()
  //   event.stopPropagation()
  //   var url = '<?= $_SESSION["baseURI"] ?>/view/vHostDetails.php?idx='+$(this).attr('id')
  //   ajaxLoader(url, ajaxContainer)
  // })
  
  var recentHostsTable = function() { 
    $.getJSON(<?= $hostData ?>, function(data){
      // console.log(data)
      createRecentHostsPanel();
      createRecentHostsTable(data.data)
    })
  }
  recentHostsTable();

  function createRecentHostsTable(hostData) {
    $('#recentHostsTable-full')
      .dataTable({
        autoWidth: false,
        data: hostData,
        searching: true,
        paging: true,
        processing: true,
        dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        info: false,
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
          { title: "Host",
            data: "host",
            className: "host left",
            render: function (data, type, full, meta){
              return '<a class="hostDetailsLink" data-idx="'+full.idx+'" href="#" title="View Host">'+data+'</a>'; 
            }
          },
          { title: "Asset Criticality",
            data: "assetCrit",
            className: "assetCrit center" },
          { title: "Total Alarms",
             data: "alarmCnt",
            className: "totalAlarms center" },
          { title: "Last Connection",
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
          $(row).attr("id", data.idx).attr("data-type", "host").addClass('seen');
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

  function createRecentHostsPanel() {
    $('.template').clone().removeClass('template').addClass('recentHosts')
      .find('.panel-title .text-bold')
      .text('Recent Hosts')
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table clickable" id="recentHostsTable-full"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  }
});

</script>