"use strict";
function trellisChart(anchor, monoGroups) {
  /*
   * FIXME: There is a lot of hardcoding going on in here.
   */
  /* attr -> {dim, group} key -> str amount, value -> { str, agi, vit, dex, int, luk } */
  /* Array of all attribute names */
  var attrs = monoGroups.map(function(d) { return d.name; });
  var attrsIdByName = {};
  monoGroups.forEach(function(d, i) { attrsIdByName[d.name] = i; });

  /* Parameters. FIXME: Tightly coupled magic numbers everywhere. */
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
      var svg = anchor.append("svg").attr("height", 400);
      /* Group of dimension labels. */
      var dimLabelsG = svg
        .append("g")
        .attr("transform", "translate(" + (margin.left + 25 + 2) + "," + (margin.top) + ")")
      ;
      var dimLabels;
      /* Subchart separators */
      var sepOrigin = -cellWidth
        , sepLineLen = subChartLength * attrs.length - subChartPadding
      ;
      dimLabels = dimLabelsG.selectAll("g.yAxisDimLabel")
        .data(attrs)
      ;
      dimLabels.enter().append("g").attr("class", "yAxisDimLabel")
        .attr("transform", function(d, i) { return "translate(0," + (attrs.length - i) * subChartLength + ")"; })
        .each(function(d, i) {
          var t = d3.select(this);
          t
            .append("text")
            .attr("transform", "translate(-25," + (-subChartUnpaddedLength / 2) + ")")
            .text(d)
          ;
          /* Top subchart separators */
          t
            .append("line")
            .attr("x1", sepOrigin)
            .attr("x2", sepOrigin + sepLineLen)
            .attr("y1", sepOrigin)
            .attr("y2", sepOrigin)
            .attr("class", "border-line")
          ;
          /* Bottom subchart separators */
          t
            .append("line")
            .attr("x1", sepOrigin)
            .attr("x2", sepOrigin + sepLineLen)
            .attr("y1", sepOrigin - subChartUnpaddedLength)
            .attr("y2", sepOrigin - subChartUnpaddedLength)
            .attr("class", "border-line")
          ;
        })
      ;
      dimLabels = dimLabelsG.selectAll("g.xAxisDimLabel")
        .data(attrs)
      ;
      dimLabels.enter().append("g").attr("class", "xAxisDimLabel")
        .attr("transform", function(d, i) { return "translate(" + (i * subChartLength) + "," + (attrs.length * subChartLength) + ")"; })
        .each(function(d, i) {
          var t = d3.select(this);
          t
            .append("text")
            .attr("transform", "translate("+ (subChartUnpaddedLength / 2 - 12) + ",8)")
            .text(d)
          ;
          /* Left subchart separators */
          t
            .append("line")
            .attr("x1", sepOrigin)
            .attr("x2", sepOrigin)
            .attr("y1", sepOrigin)
            .attr("y2", sepOrigin - sepLineLen)
            .attr("class", "border-line")
          ;
          /* Right subchart separators */
          t
            .append("line")
            .attr("x1", sepOrigin + subChartUnpaddedLength)
            .attr("x2", sepOrigin + subChartUnpaddedLength)
            .attr("y1", sepOrigin)
            .attr("y2", sepOrigin - sepLineLen)
            .attr("class", "border-line")
          ;
        })
      ;
      /* Group of subcharts. */
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
