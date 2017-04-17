/*
 * d3 table sort
 * (c) Ilkka Huotari 2013, http://ilkkah.com
 * Inspired by: http://devforrest.com/examples/table/table.php
 * License: MIT
 */

(function(globals) {

    var sort_column = -1, // don't sort any column by default
        sort_order = 1; // desc

    // utility functions. does d3 have these?
    var isArray = Array.isArray || function(arr) {
            return toString.call(arr) == '[object Array]';
        };

    var isObject = function(a) {
        return (!!a) && (a.constructor === Object);
    };
    
    globals.DetailTable = function(table, json, title, isNotification )
    {
    	 var dimensions = dimensions || { width: '500px', height: '300px' };

         var dim = {
                 w: dimensions.width,
                 h: dimensions.height,
                 tablew: dimensions.width,
                 divh: (parseFloat(dimensions.height) - 60) + "px",
                 divw: (parseFloat(dimensions.width) + 20) + "px",
                 cell_widths: []
             },
             outerTable,
             innerTable,
             tbody,
             rows;
         
         var dataset = json.data.rowData;
         
         for (var i = 0; i < json.data.rowData.length; i++)
         {
        	 
         var tdData = function() {
             return json.columns.columnData.map(function(column) {
                 return {column: column, value: json.data.rowData[i][column], idx: json.data.rowData[i].idx};
             }); 
         };
         
         outerTable = ((typeof table === 'string')? d3.select(table): table)
         
         var tempTable;
         
         if(i == 0)
    	 {
        	 tempTable = outerTable.html("<h1>" + title + "<h1>").append("table").attr("id", "info-table").attr("class", "detailtablesorter");
    	 }
         else
         {
        	 tempTable = outerTable.append("table").attr("id", "info-table").attr("class", "detailtablesorter");
         }
         var rows = tempTable
 //            .append("thead").attr("class", "header-table")
             .selectAll("tr")
             .data( tdData)
             .enter()
             .append("tr");
 	        rows.append("th")
 	        	.attr("width", "35%")
 	            .text(function(d) { return d.column; })
 	            .on("mouseover", function(d) {
 					d3.select(this)
 						.style("background", "YellowGreen");
 	            })
 	            .on("mouseout", function(d) {
 					d3.select(this)
 						.style("background", null);
 	            })
 	            .on("click", function(d) {
 	            	if(isNotification)
            		{
			        	if (!window.location.origin)
			        		window.location.origin = window.location.protocol+"//"+window.location.host;
			        	var url = window.location.origin + g_baseURI + "/view/vNotifDetails.php?idx=" + d.idx;
			        	window.location = url;
            		}
 	            });
 	        rows.append("td")
 	        .text(function(d) { return d.value; })
 	        .attr("class", function(d) {var temp = "c" + d.value; temp = temp.replace(/[^\w]/gi, ''); return temp;})
 	        .on("mouseover", function(d) {
 				var className = d3.select(this).attr("class");
 				d3.selectAll(".body-table td")
 					.filter("." + className)
 					.style("background", "YellowGreen");
 				d3.selectAll("rect")
 					.filter("." + className)
 					.attr("fill", "YellowGreen");
 	        })
 	        .on("mouseout", function(d) {
 	        	var className = "." + d3.select(this).attr("class");
 				d3.selectAll(".body-table td")
 					.filter(className)
 					.style("background", null);
 				d3.selectAll("rect")
 					.filter(className)
 					.attr("fill", "SlateGray");
 	        })
 	       .on("click", function(d) {
            	if(isNotification)
            	{
		        	if (!window.location.origin)
		        		window.location.origin = window.location.protocol+"//"+window.location.host;
		        	var url = window.location.origin + g_baseURI + "/view/vNotifDetails.php?idx=" + d.idx;
		        	window.location = url;
            	}
            });
 	        outerTable.append("br");
         }
     };

    globals.TableSort = function(table, json, dimensions) {
    	if (json == null) {
    		return;
    	}
    	
		if ($("#id_trunc").length > 0) { //There's a text type element that explains row limit
			if (json.data.rowData.length == g_rowLimit) {
    			$("#id_trunc").show();
    		} else {
    			$("#id_trunc").hide();    			
    		}
    	}
    	
        dimensions = dimensions || { width: '500px', height: '300px' };

        var dim = {
                w: dimensions.width,
                h: dimensions.height,
                tablew: dimensions.width,
                divh: (parseFloat(dimensions.height) - 60) + "px",
                divw: (parseFloat(dimensions.width) + 20) + "px",
                cell_widths: []
            },
            outerTable,
            innerTable,
            tbody,
            rows;

        function sort(d, tmp, i) {
            var sort,
                sort_btn = d3.select(d3.event.toElement || d3.event.target),
                is_desc = sort_btn.classed('sort_desc');

            sort_order = is_desc? -1: 1;
            sort_btn.classed('sort_desc', !is_desc).classed('sort_asc', is_desc);
            sort_column = i;
            tbody.selectAll("tr").sort(function(a, b) { return d.sort(isArray(a)? a[sort_column]: a.data[sort_column], isArray(b)? b[sort_column]: b.data[sort_column], sort_order); } );
        }

        outerTable = ((typeof table === 'string')? d3.select(table): table).html(null).append("table").attr("id", "info-table").attr("class", "tablesorter");
        outerTable
            .append("thead").attr("class", "header-table")
            .append("tr")
            .selectAll("th")
	        .data(json.columns.columnData)
	        .enter()
	        .append("th")
	            .text(function(column) { return column; })
	            .on("mouseover", function(d) {
					d3.select(this)
						.style("background", "YellowGreen");
	            })
	            .on("mouseout", function(d) {
					d3.select(this)
						.style("background", null);
	            })
            .selectAll('span')
            .data(function(d, i) { if (d.sort_column && sort_column === -1) { sort_column = i; } return d.sort? [d]: ''; }).enter()
            .append('span')
            .classed('sort_indicator sort_desc', true)
            //.on('click', sort);

        tbody = outerTable.append("tbody").attr("class", "body-table");

        // Create a row for each object in the data and perform an intial sort.
        rows = tbody.selectAll("tr")
        .data(json.data.rowData)
        .enter()
        .append("tr")
        .attr("class", function(d,i) {
	        if(i % 2 == 0) { return "odd"}
	        else {return "even"};
        })
	    .on("mouseover", function() {
			d3.select(this)
				.style("background", "Silver");
	    })
	    .on("mouseout", function() {
			d3.select(this)
				.style("background", null);
	    });
/*
        // initial sort
        if (sort_column >= 0 && columns[sort_column].sort) {
            tbody.selectAll('tr').sort(function(a, b) { return columns[sort_column].sort(isArray(a)? a[sort_column]: a.data[sort_column], isArray(b)? b[sort_column]: b.data[sort_column], sort_order); })
        }
 */       
        // Create a cell in each row for each column
        rows.selectAll("td")
            .data(function(row) {
	            return json.columns.columnData.map(function(column) {
	                return {column: column, value: row[column]};
	            });
	        })
	        .enter()
	        .append("td")
	        .html(function(d) { return d.value; })
	        .attr("class", function(d) {var temp = "c" + d.value; temp = temp.replace(/[^\w]/gi, ''); return temp;})
	        .on("mouseover", function(d) {
				var className = d3.select(this).attr("class");
				d3.selectAll(".body-table td")
					.filter("." + className)
					.style("background", "YellowGreen");
				d3.selectAll("rect")
					.filter("." + className)
					.attr("fill", "YellowGreen");
	        })
	        .on("mouseout", function(d) {
	        	var className = "." + d3.select(this).attr("class");
				d3.selectAll(".body-table td")
					.filter(className)
					.style("background", null);
				d3.selectAll("rect")
					.filter(className)
					.attr("fill", "SlateGray");
	        });

    };
    
    globals.HistTableSort = function(table, json, dimensions) {

        dimensions = dimensions || { width: '500px', height: '300px' };

        var dim = {
                w: dimensions.width,
                h: dimensions.height,
                tablew: dimensions.width,
                divh: (parseFloat(dimensions.height) - 60) + "px",
                divw: (parseFloat(dimensions.width) + 20) + "px",
                cell_widths: []
            },
            outerTable,
            innerTable,
            tbody,
            rows;

        function sort(d, tmp, i) {
            var sort,
                sort_btn = d3.select(d3.event.toElement || d3.event.target),
                is_desc = sort_btn.classed('sort_desc');

            sort_order = is_desc? -1: 1;
            sort_btn.classed('sort_desc', !is_desc).classed('sort_asc', is_desc);
            sort_column = i;
            tbody.selectAll("tr").sort(function(a, b) { return d.sort(isArray(a)? a[sort_column]: a.data[sort_column], isArray(b)? b[sort_column]: b.data[sort_column], sort_order); } );
        }

        outerTable = ((typeof table === 'string')? d3.select(table): table).html(null).append("table").attr("id", "info-table").attr("class", "tablesorter");
        var headers = outerTable
            .append("thead").attr("class", "header-table")
            .append("tr");
        headers.selectAll("th")
	        .data(json.columns.columnData)
	        .enter()
	        .append("th")
	            .text(function(column) { return column; })
	            .on("mouseover", function(d) {
					d3.select(this)
						.style("background", "YellowGreen");
	            })
	            .on("mouseout", function(d) {
					d3.select(this)
						.style("background", null);
	            })
            .selectAll('span')
            .data(function(d, i) { if (d.sort_column && sort_column === -1) { sort_column = i; } return d.sort? [d]: ''; }).enter()
            .append('span')
            .classed('sort_indicator sort_desc', true);
            //.on('click', sort);
        headers
        	.selectAll("th")
        	.data(function(){
        		var tempArr =[];
        		for(var i = 0; i < json.columns.columnData.length; i++)
        		{
        			tempArr.push("");
        		}
        		tempArr.push("Percent");
        		return tempArr; 
        	})
        	.enter()
        	.append("th")
        		.text(function(column) { return column; })
	            .on("mouseover", function(d) {
					d3.select(this)
						.style("background", "YellowGreen");
	            })
	            .on("mouseout", function(d) {
					d3.select(this)
						.style("background", null);
	            });

        tbody = outerTable.append("tbody").attr("class", "body-table");

        // Create a row for each object in the data and perform an intial sort.
        rows = tbody.selectAll("tr")
        .data(json.data.rowData)
        .enter()
        .append("tr")
        .attr("class", function(d,i) {
	        if(i % 2 == 0) { return "odd"}
	        else {return "even"};
        })
	    .on("mouseover", function() {
			d3.select(this)
				.style("background", "Silver");
	    })
	    .on("mouseout", function() {
			d3.select(this)
				.style("background", null);
	    });
/*
        // initial sort
        if (sort_column >= 0 && columns[sort_column].sort) {
            tbody.selectAll('tr').sort(function(a, b) { return columns[sort_column].sort(isArray(a)? a[sort_column]: a.data[sort_column], isArray(b)? b[sort_column]: b.data[sort_column], sort_order); })
        }
 */       
        // Create a cell in each row for each column
        rows.selectAll("td")
            .data(function(row) {
	            return json.columns.columnData.map(function(column) {
	                return {column: column, value: row[column]};
	            });
	        })
	        .enter()
	        .append("td")
	        .html(function(d) { return d.value; })
	        .attr("class", function(d) {return d.value;})
	        .on("mouseover", function(d) {
				var className = d3.select(this).attr("class");
				d3.selectAll(".body-table td")
					.filter(function(d) { return (d.value == className);})
					.style("background", "Khaki");
	        })
	        .on("mouseout", function(d) {
	        	var className = d3.select(this).attr("class");
				d3.selectAll(".body-table td")
					.filter(function(d) {return (d.value == className);})
					.style("background", null);
	        });
       
        var w = 200;
        var h = 10;
		var yScale = d3.scale.ordinal()
        .domain(d3.range(json.graphing.length))
        .rangeRoundBands([0,h], 0.00);
        
		var xScale = d3.scale.linear()
                        .domain([0, d3.max(json.graphing, function(d){ return d.y;})])
                        .range([0, w]);
       
		var newTD = rows.selectAll("td")
       		.data(function(d,j){
        		var tempArr =[];
        		for(var i = 0; i < json.columns.columnData.length; i++)
        		{
        			tempArr.push("");
        		}
        		tempArr.push(json.graphing[j].y);
        		return tempArr; 
        	})
        	.enter()
	        .append("td")
			.append("svg")
	        .attr("width", w)
	        .attr("height", h)
	        .attr("display", "block")
	   //Create bars
	           .append("rect")
	           .attr("x", 0)
	           .attr("y", 0)
	           .attr("width", function(d) { return xScale(d); })
	           .attr("height", h)
	           .attr("fill", "SlateGray")
	           .on("mouseover", function(d) {
	                d3.select(this)
	                .transition()
	                .duration(100)
	                .attr("fill","YellowGreen");
	           }) 
	           .on("mouseout", function(d) {
	                d3.select(this)
	                .transition()
	                .duration(100)
	                .attr("fill", "SlateGray");
	           })
	           .on("click", function() {
	                    sortBars();
	                });

    };
    
    globals.TableSort.alphabetic = function(a, b, sort_order) { return sort_order * a.localeCompare(b); };
    globals.TableSort.numeric = function(a, b, sort_order) { return sort_order * (parseFloat(b) - parseFloat(a)); };

}(window));