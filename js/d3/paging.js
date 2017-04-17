(function(globals) {
	
	globals.TablePage = function(data) {

		  // **********************************
		  //  Description of ALL pager options
		  // **********************************
		  var pagerOptions = {

		    // target the pager markup - see the HTML block below
		    container: $(".pager"),

		    // use this url format "http:/mydatabase.com?page={page}&size={size}&{sortList:col}"
		    ajaxUrl: null,

		    // modify the url after all processing has been applied
		    customAjaxUrl: function(table, url) { return url; },

		    // process ajax so that the data object is returned along with the total number of rows
		    // example: { "data" : [{ "ID": 1, "Name": "Foo", "Last": "Bar" }], "total_rows" : 100 }
		    ajaxProcessing: function(ajax){
		      if (ajax && ajax.hasOwnProperty('data')) {
		        // return [ "data", "total_rows" ];
		        return [ ajax.total_rows, ajax.data ];
		      }
		    },

		    // output string - default is '{page}/{totalPages}'
		    // possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
		    output: '{startRow} to {endRow} ({totalRows})',

		    // apply disabled classname to the pager arrows when the rows at either extreme is visible - default is true
		    updateArrows: true,

		    // starting page of the pager (zero based index)
		    page: 0,

		    // Number of visible rows - default is 10
		    size: 10,

		    // Save pager page & size if the storage script is loaded (requires $.tablesorter.storage in jquery.tablesorter.widgets.js)
		    savePages : true,
		    
		    //defines custom storage key
		    storageKey:'tablesorter-pager',

		    // if true, the table will remain the same height no matter how many records are displayed. The space is made up by an empty
		    // table row set to a height to compensate; default is false
		    fixedHeight: true,

		    // remove rows from the table to speed up the sort of large tables.
		    // setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
		    removeRows: false,

		    // css class names of pager arrows
		    cssNext: '.next', // next page arrow
		    cssPrev: '.prev', // previous page arrow
		    cssFirst: '.first', // go to first page arrow
		    cssLast: '.last', // go to last page arrow
		    cssGoto: '.gotoPage', // select dropdown to allow choosing a page

		    cssPageDisplay: '.pagedisplay', // location of where the "output" is displayed
		    cssPageSize: '.pagesize', // page size selector - select dropdown that sets the "size" option

		    // class added to arrows when at the extremes (i.e. prev/first arrows are "disabled" when on the first page)
		    cssDisabled: 'disabled', // Note there is no period "." in front of this class name
		    cssErrorRow: 'tablesorter-errorRow' // ajax error information row

		  };

		  $("#info-table")

		    // Initialize tablesorter
		    // ***********************
		    .tablesorter({
		      theme: 'blue',
		      widthFixed: true,
		      widgets: ['zebra']
		    })
/*
								    // bind to pager events
								    // *********************
								    .bind('pagerChange pagerComplete pagerInitialized pageMoved', function(e, c){
								      var msg = '"</span> event triggered, ' + (e.type === 'pagerChange' ? 'going to' : 'now on') +
								        ' page <span class="typ">' + (c.page + 1) + '/' + c.totalPages + '</span>';
								      $('#display')
								        .append('<li><span class="str">"' + e.type + msg + '</li>')
								        .find('li:first').remove();
								    })
*/
		    // initialize the pager plugin
		    // ****************************
		    .tablesorterPager(pagerOptions);

		    // Add two new rows using the "addRows" method
		    // the "update" method doesn't work here because not all rows are
		    // present in the table when the pager is applied ("removeRows" is false)
		    // ***********************************************************************
/*								    var r, $row, num = 50,
								      row = '<tr><td>Student{i}</td><td>{m}</td><td>{g}</td><td>{r}</td><td>{r}</td><td>{r}</td><td>{r}</td><td><button type="button" class="remove" title="Remove this row">X</button></td></tr>' +
								        '<tr><td>Student{j}</td><td>{m}</td><td>{g}</td><td>{r}</td><td>{r}</td><td>{r}</td><td>{r}</td><td><button type="button" class="remove" title="Remove this row">X</button></td></tr>';
								    $('button:contains(Add)').click(function(){
								      // add two rows of random data!
								      r = row.replace(/\{[gijmr]\}/g, function(m){
								        return {
								          '{i}' : num + 1,
								          '{j}' : num + 2,
								          '{r}' : Math.round(Math.random() * 100),
								          '{g}' : Math.random() > 0.5 ? 'male' : 'female',
								          '{m}' : Math.random() > 0.5 ? 'Mathematics' : 'Languages'
								        }[m];
								      });
								      num = num + 2;
								      $row = $(r);
								      $('table')
								        .find('tbody').append($row)
								        .trigger('addRows', [$row]);
								      return false;
								    });
*/
/*								    // Delete a row
								    // *************
								    $('table').delegate('button.remove', 'click' ,function(){
								      var t = $('table');
								      // disabling the pager will restore all table rows
								      // t.trigger('disable.pager');
								      // remove chosen row
								      $(this).closest('tr').remove();
								      // restore pager
								      // t.trigger('enable.pager');
								      t.trigger('update');
								      return false;
								    });
*/
		    // Destroy pager / Restore pager
		    // **************
		    $('button:contains(Destroy)').click(function(){
		      // Exterminate, annhilate, destroy! http://www.youtube.com/watch?v=LOqn8FxuyFs
		      var $t = $(this);
		      if (/Destroy/.test( $t.text() )){
		        $('table').trigger('destroy.pager');
		        $t.text('Restore Pager');
		      } else {
		        $('table').tablesorterPager(pagerOptions);
		        $t.text('Destroy Pager');
		      }
		      return false;
		    });

		    // Disable / Enable
		    // **************
		    $('.toggle').click(function(){
		      var mode = /Disable/.test( $(this).text() );
		      $('table').trigger( (mode ? 'disable' : 'enable') + '.pager');
		      $(this).text( (mode ? 'Enable' : 'Disable') + 'Pager');
		      return false;
		    });
		    $('table').bind('pagerChange', function(){
		      // pager automatically enables when table is sorted.
		      $('.toggle').text('Disable Pager');
		    });

		
	return data;
	}
}(window));
