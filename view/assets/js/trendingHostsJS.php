<script>
$(document).ready(function(){

	$("#page-title").text("Trending Hosts")
	$("#page-sub-title").text("Overview & Stats")

  // $('#ajax-content').one('click', '#trendingHostsTable tbody tr', function(event) {
  //   console.log($(this).attr('id'))
  //   event.preventDefault()
  //   event.stopPropagation()
  //   var url = '<?= $_SESSION["baseURI"] ?>/view/vHostDetails.php?idx='+$(this).attr('id')
  //   ajaxLoader(url, ajaxContainer)
  // })
  
  var trendingHostsTable = function() { 
    $.getJSON(<?= $hostData ?>, function(data){
      // console.log(data)
      createTrendingHostsPanel();
      createTrendingHostsTable(data.data)
    })
  }
  trendingHostsTable();

  function createTrendingHostsTable(hostData) {
    $('#trendingHostsTable-full')
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
            className: "hostName" },
          { title: "Asset Criticality",
            data: "assetCrit",
            className: "assetCrit" },
          { title: "Alarm Count",
             data: "alarmCnt",
            className: "alarmCnt" },
          { title: "Timestamp",
            data: "date",
            className: "timestamp",
            render: function ( data, type, full, meta ) { //Convert date from UTC time to user local time 
              return g_convertFromUTC(data);
            } 
          },
          { title: "Percentage of All",
            data: "percentage",
            className: "percentage" }
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

  function createTrendingHostsPanel() {
    $('.template').clone().removeClass('template').addClass('trendingHosts')
      .find('.panel-title .text-bold')
      .text('Trending Hosts')
    .end()
      .find('.panel-body')
      .html( '<table cellpadding="0" cellspacing="0" border="0" class="display table clickable" id="trendingHostsTable-full"></table>' )
    .end()
      .appendTo('#ajax-content')
    .end()
    .show()
    .addClass('animated')
    .addClass('fadeInUp')
  }
});

</script>