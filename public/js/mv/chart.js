"use strict";
var mv = function(mv) {
  mv.charts = {};
  var thinWidth = 250;
  var medWidth = 400;
  var wideWidth = Math.max(700, document.documentElement.clientWidth - thinWidth - medWidth);
  mv.charter = function() {
    var charter = {};
    charter.init = function() {
      mv.charts.date = bar(monoGroup(wide(dc.barChart("#date-chart")), "date"))
        .centerBar(true)
        .elasticX(true)
        .x(d3.time.scale().domain([mv.heap.date.dim.bottom(1)[0].date, mv.heap.date.dim.top(1)[0].date]).nice(d3.time.hour))
        .xUnits(d3.time.hours)
        .xAxisPadding(2)
        ;
      mv.charts.blvl = bar(monoGroup(med(dc.barChart("#blvl-chart")), "blvl"))
        .x(d3.scale.linear().domain([0, mv.heap.blvl.dim.top(1)[0].pcstat.blvl + 0.5]))
        ;
      mv.charts.type = pie(monoGroup(dc.pieChart("#type-chart"), "type"))
        ;
      mv.charts.target = pie(monoGroup(dc.pieChart("#target-chart"), "target"))
        ;
      mv.charts.wpn = pie(monoGroup(dc.pieChart("#wpn-chart"), "wpn"))
        ;
      mv.charts.numAttackers = bar(monoGroup(thin(dc.barChart("#num-attackers-chart")), "numAttackers"))
        .x(d3.scale.linear().domain([0, mv.heap.numAttackers.dim.top(1)[0].numAttackers + 0.5]))
        .elasticX(true)
        ;
      mv.charts.map = height(monoGroup(margined(wide(dc.bubbleChart("#map-chart")))
                                     , "map")
                           , 500)
        .colorCalculator(d3.scale.category20c())
        /* X */
        .keyAccessor(function(d) { return d.value.e + 1; })
        /* Y */
        .valueAccessor(function(d) { return d.value.j + 1; })
        /* R */
        .radiusValueAccessor(function(d) { return Math.sqrt(d.value.r); })
        .maxBubbleRelativeSize(0.045)
        .x(d3.scale.log().domain([1, 100000]))
        .y(d3.scale.log().domain([1, 300000]))
        .axisPixelPadding({left:5, top: 10, right: 15, bottom: 5})
        .elasticX(true)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .title(function(d) { return "Map " + d.key + ":" + d.value.r; })
        .renderTitle(true)
        ;
      mv.charts.stats = trellisChart("#stat-chart", ["str", "agi", "vit", "dex", "int", "luk"].map(function(d) { mv.heap[d].name = d; return mv.heap[d]; }));
      mv.charts.type.filter("KILLXP");
      var killxpShown = true;
      var killxpCharts = d3.select("#killxp-charts");
      dc.renderlet(function() {
        mv.charts.stats();
        if (killxpShown) {
          if (mv.charts.type.filter() != "KILLXP") {
            /* Hide killxp charts */
            killxpCharts.style("display", "none");
            mv.charts.target.filterAll();
            mv.charts.wpn.filterAll();
            mv.charts.numAttackers.filterAll();
            killxpShown = false;
          }
        } else {
          if (mv.charts.type.filter() == "KILLXP") {
            /* Show killxp charts */
            killxpCharts.style("display", "block");
            killxpShown = true;
          }
        }
      });
      dc.renderAll();
    }
    charter.filters = function() {
      var r = {}, f;
      for (var k in mv.charts) {
        f = mv.charts[k].filter();
        if (f != null) {
          r[k] = f;
        }
      }
      return r;
    }
    return charter;
  }();
  function wide(chart) {
    return chart
      .width(wideWidth)
    ;
  }
  function med(chart) {
    return chart
      .width(medWidth)
    ;
  }
  function thin(chart) {
    return chart
      .width(thinWidth)
    ;
  }
  function short(chart) {
    return height(chart, 130);
  }
  function height(chart, size) {
    chart.root()
      .selectAll(".y-axis-label")
      .style("top", (size / 2 + 25) + "px")
    ;
    chart.root()
      .selectAll(".x-axis-label")
      .style("top", (size - 15) + "px")
    ;
    return chart
      .height(size)
    ;
  }
  function margined(chart) {
    return chart
      .margins({left: 60, right: 18, top: 5, bottom: 30})
    ;
  }
  function monoGroup(chart, name) {
    return chart
      .dimension(mv.heap[name].dim)
      .group(mv.heap[name].group)
      .transitionDuration(500)
    ;
  }
  function bar(chart) {
    return margined(short(chart))
      .elasticY(true)
      .gap(1)
      .renderHorizontalGridLines(true)
      .title(function(d) { return d.key + ": " + d.value; })
      .brushOn(true)
    ;
  }
  function pie(chart) {
    return thin(chart)
      .radius(80)
      .height(165)
      .colorCalculator(d3.scale.category20c())
    ;
  }
  return mv;
}(mv || {});
