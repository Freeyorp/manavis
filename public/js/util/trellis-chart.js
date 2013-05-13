"use strict";
function trellisChart(anchor, monoGroups) {
  /* attr -> {dim, group} key -> str amount, value -> { str, agi, vit, dex, int, luk } */

  var attrs = monoGroups.map(function(d) { return d.name; });
  var attrsIdByName = {};
  monoGroups.forEach(function(d, i) { attrsIdByName[d.name] = i; });

  var cellWidth = 5;
  var radius = cellWidth / 2;
  var subChartLength = 57;
  var subChartUnpaddedLength = 50;
  var subChartPadding = 7;
  var filler = d3.scale.log().domain([1, 2]).range([0, 255]);

  var margin = {top: 10, right: 10, bottom: 20, left: 10};
  var anchor = d3.select(anchor);
  var g = anchor.select("g");

  var _chart = function() {
    if (g.empty()) {
      /* Make stuff! */
      var svg = anchor.append("svg");
      g = svg
        .append("g");
      attrs.forEach(function(d, i) {
        g
          .append("text")
          .attr("transform", function(d) { return "translate(0," + ((attrs.length - i) * subChartLength + 10 - subChartLength / 2) + ")"; })
          .text(d)
        ;
        g
          .append("text")
          .attr("transform", function(d) { return "translate(" + (i * subChartLength + 25 + 22) + "," + (attrs.length * subChartLength + 18) + ")"; })
          .text(d)
        ;
      })
      g = svg
        .append("g")
          .attr("transform", "translate(" + (margin.left + 25) + "," + (margin.top) + ")");
    }
    /* Group first into columns for each stat. We have one column for each of the stat monoGroups. */
    /*
     * monoGroups is an array of each stat dimension. We can consider each column to have data in the following format:
     *  { group: function, dim: function, name: stat }
     */
    var columns = g.selectAll(".column")
        .data(monoGroups);
    var colE = columns
      .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d) { return "translate(" + (attrsIdByName[d.name] * subChartLength) + ",0)"; })
      ;
    colE
      .append("line")
        .attr("x1", -cellWidth)
        .attr("x2", -cellWidth)
        .attr("y1", -cellWidth)
        .attr("y2", subChartLength * attrs.length - subChartPadding)
        .attr("class", "border-line")
      ;
    colE
      .append("line")
        .attr("x1", subChartUnpaddedLength)
        .attr("x2", subChartUnpaddedLength)
        .attr("y1", -cellWidth)
        .attr("y2", subChartLength * attrs.length - subChartPadding)
        .attr("class", "border-line")
      ;
    /* Each stat has an array for its value. Group these to find the x position. */
    /*
     * The function transforms the data to take the grouping. We can consider each x position grouping to have data in the following format:
     *  { key: position, value: [{[stat] -> [y pos] -> count}] }
     */
    var colposg = columns.selectAll(".colpos")
        .data(function(d, i) {
//           console.log("Incoming colposg format:", d, i, "Transformed to:", d.group.all().map(function(d2) { d2.name = d.name; return d2; }));
          return d.group.all().map(function(d2) { d2.name = d.name; return d2; });
        }, function(d) { return d.key; });
    colposg
      .enter().append("g")
        .attr("class", "colpos")
        .attr("transform", function(d) { return "translate(" + (d.key * cellWidth) + ",0)"; })
      ;
    /* Next, split up each x position grouping into its y stat grouping. */
    /*
     * We can consider each y stat grouping to have data in the following format:
     *  v[y pos] -> count; v.name -> name
     */
    var rows = colposg.selectAll(".row")
        .data(function(d, i) {
//           console.log("Incoming row format:", d, i, "Transformed to:", attrs.map(function(d2) { return { name: d2, data: d.value[d2] }; }));
          return attrs.map(function(d2) { return { name: d2, data: d.value[d2] }; });
        });
    rows
      .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d) { return "translate(0," + ((attrs.length - attrsIdByName[d.name] - 1) * subChartLength) + ")"; })
      ;
    /* Finally, split up each y stat grouping into x. */
    var vmax = 0;
    var cells = rows.selectAll(".cell")
        .data(function(d, i) {
//           console.log("Incoming cells format:", d, i, "Transformed to:", d.data);
          return d.data;
        });
    cells
      .enter().append("circle")
        .attr("class", "cell")
        .attr("r", radius)
      ;
    cells
        .each(function(d) {
          if (d > vmax) vmax = d;
        })
      ;
    filler.domain([1, vmax + 1]);
    cells
        .attr("fill", function(d) {
          return d ? d3.rgb(255 - filler(d + 1), 255 - filler(d + 1) / 2, 255 - filler(d + 1) / 3) : "white";
        })
        .attr("transform", function(d, i) { return "translate(0," + ((10-i) * cellWidth) + ")"; })
      ;
    cells
      .exit()
        .remove()
      ;
  }

  _chart.filter = function() {
    /*
     * TODO:
     * This is going to be interesting. As the chart is not charting a single
     * monogroup, and most code is built around this assumption, this might
     * well end up being a messy special case.
     */
    return null;
  }

  return _chart;
}
