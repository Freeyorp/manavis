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

  /* Parameters. FIXME: Tightly coupled. */
  var cellWidth = 5;
  var radius = cellWidth / 2;
  var subChartLength = 57;
  var subChartUnpaddedLength = 50;
  var subChartPadding = 7;
  var chartLen = subChartLength * attrs.length - subChartPadding;
  /* Padding in pixels to pad the left side of the chart with to make room for the labels. */
  var labelPadding = 25;
  var filler = d3.scale.log().domain([1, 2]).range([0, 255]);
  /* FIXME: Screwy domain due to attr rounding */
  var domainMin = 0, domainMax = 100;
  /* By definition of a trellis chart, the same scale must be used for all subcharts. */
  var _scale = d3.scale.linear().domain([0, 10]).range([0, subChartUnpaddedLength]);
  var attrGroups = 10;
  var axisLabelHeight = 9;

  var margin = {top: 10, right: 10, bottom: 20, left: 10};
  var anchor = d3.select(anchor);
  var g = anchor.select("g");

  /* Main columns, one for each attr */
  var columns;
  var colBodies;

  var _chart = function() {
    if (g.empty()) {
      renderBase();
    }
    colBodies.each(redrawCells);
  }

  function renderBase() {
    /* Make stuff! */
    anchor.attr("class", "dc-chart");
    var svg = anchor.append("svg").attr("height", 400).attr("width", 400).attr("class", "mv-chart");
    /* Group of dimension labels. */
    /* Group of subcharts. */
    /* Adjust the translation by the radius of each circle - the origin of each circle is the middle. */
    /* This makes their starting position consistent with the rest of the graph. */
    /* Create this container first, so that the labels go over the top. */
    g = svg
      .append("g")
        .attr("transform", "translate(" + (margin.left + labelPadding + radius) + "," + (margin.top - radius) + ")")
      ;
    /* Label container. */
    var dimLabelsG = svg
      .append("g")
      .attr("transform", "translate(" + (margin.left + labelPadding) + "," + (margin.top) + ")")
    ;
    var dimLabels;
    /* Y axis labels and horizontal lines */
    dimLabels = dimLabelsG.selectAll("g.y-axis-dim-label")
      .data(monoGroups)
    ;
    /* Each label is shifted downwards by its distance from the origin. */
    /* Since the origin (0,0) in svg differs from the origin (0,0) in our charts, we must go backwards down the y axis here. */
    /* One instance of padding must be removed from this offset to get the correct distance, since this is working from the back. */
    dimLabels.enter().append("g").attr("class", "y-axis-dim-label")
      .attr("transform", function(d, i) { return "translate(0," + ((attrs.length - i) * subChartLength - subChartPadding) + ")"; })
      .each(function(d, i) {
        var t = d3.select(this);
        /* The -8 here is an insignificant offset to distinguish the dimension label from the domain labels. */
        t
          .append("text")
          .attr("transform", "translate(-8," + (-subChartUnpaddedLength / 2 + axisLabelHeight / 2) + ")")
          .attr("class", "dim-label")
          .text(d.name)
        ;
        /* Top subchart separators */
        t
          .append("line")
          .attr("x1", 0)
          .attr("x2", chartLen)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("class", "border-line")
        ;
        /* Bottom subchart separators */
        t
          .append("line")
          .attr("x1", 0)
          .attr("x2", chartLen)
          .attr("y1", -subChartUnpaddedLength)
          .attr("y2", -subChartUnpaddedLength)
          .attr("class", "border-line")
        ;
        /* Y Domain markers */
        t
          .append("text")
          .attr("transform", "translate(0," + (-subChartUnpaddedLength + axisLabelHeight) + ")")
          .text(domainMax)
        ;
        t
          .append("text")
          .attr("transform", "translate(0,0)")
          .text(domainMin)
        ;
      })
    ;
    /* X axis labels and vertical lines */
    dimLabels = dimLabelsG.selectAll("g.x-axis-dim-label")
      .data(monoGroups)
    ;
    dimLabels.enter().append("g").attr("class", "x-axis-dim-label")
      .attr("transform", function(d, i) { return "translate(" + (i * subChartLength) + "," + chartLen + ")"; })
      .each(function(d, i) {
        var t = d3.select(this);
        /* The dimension label is placed at a y level directly after the domain labels. */
        t
          .append("text")
          .attr("transform", "translate("+ (subChartUnpaddedLength / 2) + "," + (axisLabelHeight * 2) + ")")
          .attr("class", "dim-label")
          .text(d.name)
        ;
        /* Left subchart separators */
        t
          .append("line")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", 0)
          .attr("y2", -chartLen)
          .attr("class", "border-line")
        ;
        /* Right subchart separators */
        t
          .append("line")
          .attr("x1", subChartUnpaddedLength)
          .attr("x2", subChartUnpaddedLength)
          .attr("y1", 0)
          .attr("y2", -chartLen)
          .attr("class", "border-line")
        ;
        /* X Domain markers */
        t
          .append("text")
          .attr("transform", "translate(" + subChartUnpaddedLength + "," + axisLabelHeight + ")")
          .style("text-anchor", "end")
          .text(domainMax)
        ;
        t
          .append("text")
          .attr("transform", "translate(0," + axisLabelHeight + ")")
          .style("text-anchor", "start")
          .text(domainMin)
        ;
      })
    ;
    dimLabelsG.selectAll("g.brush-container")
      .data(monoGroups)
      .enter().append("g").attr("class", "brush-container")
      .attr("transform", function(d, i) { return "translate(" + (i * subChartLength) + ",0)"; })
      .each(function (d, i) {
        d.id = i;
        d.brush = d3.svg.brush();
        d.filter = function(_) {
          if (!arguments.length) return d._filter;
          d.dim.filter(_);
          d._filter = _;
          return d;
        };
      })
      .each(renderBrush)
    ;
    /* Group first into columns for each stat. We have one column for each of the stat monoGroups. */
    /* Columns only need to be created once; one for each monoGroup. The top level monoGroups shouldn't change after rendering, anyway. */
    /*
    * monoGroups is an array of each stat dimension. We can consider each column to have data in the following format:
    *  { group: function, dim: function, name: stat }
    */
    columns = g.selectAll(".column")
      .data(monoGroups);
    var colE = columns.enter().append("g").attr("class", "column")
      
      .attr("transform", function(d) { return "translate(" + (d.id * subChartLength) + ",0)"; })
    ;
    colBodies = columns.selectAll(".chartBody")
      .data(function(d) { return [d]; }).enter().append("g")
      .attr("class", "chartBody")
      .each(function(d, i, j) { console.log("Created chart body", d, i, j); })
    ;
  }

  function redrawCells() {
    /* Each stat has an array for its value. Group these to find the x position. */
    /*
    * The function transforms the data to take the grouping. We can consider each x position grouping to have data in the following format:
    *  { key: position, value: [{[stat] -> [y pos] -> count}] }
    */
    var colposg = d3.select(this).selectAll(".colpos")
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
        .attr("transform", function(d, i) { return "translate(0," + ((attrGroups-i) * cellWidth) + ")"; })
      ;
    cells
      .exit()
        .remove()
      ;
  }

  function renderBrush(d, i) {
    var columnG = d3.select(this);
    var brushG = columnG.select(".brush");

    d.brush
      .on("brushstart", function() {})
      .on("brush", function () {
        var extent = extendBrush(d, brushG);

        redrawBrush(d, i, brushG);

        if (brushIsEmpty(extent, d.brush)) {
          dc.events.trigger(function () {
            d.filter(null);
            dc.redrawAll();
          });
        } else {
          dc.events.trigger(function () {
            d.filter([extent[0], extent[1]]);
            dc.redrawAll();
          }, dc.constants.EVENT_DELAY);
        }
      })
      .on("brushend", function() {})
    ;

    if (brushG.empty()) {
      brushG = columnG.append("g").attr("class", "brush")
        .call(d.brush.x(_scale))
      ;
      brushG.selectAll("rect").attr("height", chartLen);
      brushG.selectAll(".resize").append("path").attr("d", resizeHandlePath);
    }
  }

  function redrawBrush(d, i, brushG) {
    if (d.filter() && d.brush().empty())
      d.brush.extent(d.filter());

    brushG.call(d.brush.x(_scale));
    brushG.selectAll("rect").attr("height", chartLen);

    // TODO: fade the deselected area
  }

  // FIXME: Consistent interface
  _chart.round = Math.round;

  function extendBrush(d, brushG) {
    var extent = d.brush.extent();
    if (_chart.round) {
      extent = extent.map(_chart.round);
      brushG.call(d.brush.extent(extent));
    }
    return extent;
  };

  function brushIsEmpty(extent, brush) {
      return brush.empty() || !extent || extent[1] <= extent[0];
  };

  function resizeHandlePath(d) {
    var e = +(d == "e"), x = e ? 1 : -1, y = chartLen / 3;
    return "M" + (.5 * x) + "," + y
         + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
         + "V" + (2 * y - 6)
         + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
         + "Z"
         + "M" + (2.5 * x) + "," + (y + 8)
         + "V" + (2 * y - 8)
         + "M" + (4.5 * x) + "," + (y + 8)
         + "V" + (2 * y - 8);
  }

  _chart.filter = function(_) {
    /*
     * TODO:
     * This is going to be interesting. As the chart is not charting a single
     * monogroup, and most code is built around this assumption, this might
     * well end up being a messy special case.
     */
    if (!arguments.length) {
      return null;
    }
    return _chart;
  }

  return _chart;
}
