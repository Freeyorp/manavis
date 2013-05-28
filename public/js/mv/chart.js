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
      mv.charts.date.filterCompare = function(l, r) {
        return ((l instanceof Date) ? l : new Date(l))
            == ((r instanceof Date) ? r : new Date(r));
      };
      // Remember the old date filter
      // FIXME: Find a more elegant way to do this
      var innerDateFilter = mv.charts.date.filter;
      mv.charts.date.filter = function(_) {
        if (!arguments.length) return innerDateFilter();
        if (!_) return innerDateFilter(_);
        _ = _ instanceof Array
          ? _.map(function(d) { return d instanceof Date ? d : new Date(d); })
          : (_ instanceof Date ? _ : new Date(_));
        return innerDateFilter(_);
      }
      /* dc's default date format is M/D/Y, which is confusing and not ISO 8901 */
      dc.dateFormat = d3.time.format("%Y-%m-%d %H:%M");
      mv.charts.blvl = bar(monoGroup(med(dc.barChart("#blvl-chart")), "blvl"))
        .x(d3.scale.linear().domain([0, mv.heap.blvl.dim.top(1)[0].pcstat.blvl + 1]))
        .round(Math.round)
        ;
      mv.charts.type = pie(monoGroup(dc.pieChart("#type-chart"), "type"))
        ;
      mv.charts.target = pie(monoGroup(dc.pieChart("#target-chart"), "target"))
        ;
      mv.charts.wpn = pie(monoGroup(dc.pieChart("#wpn-chart"), "wpn"))
        ;
      mv.charts.numAttackers = bar(monoGroup(thin(dc.barChart("#num-attackers-chart")), "numAttackers"))
        .x(d3.scale.linear().domain([0, mv.heap.numAttackers.dim.top(1)[0].numAttackers + 1]))
        .round(Math.round)
        .elasticX(true)
        ;
      mv.charts.map = height(monoGroup(margined(wide(dc.bubbleChart("#map-chart")))
                                     , "map")
                           , 655)
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
      var attrs = ["str", "agi", "vit", "dex", "int", "luk"];
      mv.charts.stats = trellisChart("#stat-chart", attrs.map(function(d) { mv.heap[d].name = d; return mv.heap[d]; }));
      mv.charts.stats.filterCompare = function(l, r) {
        /* Compare each attribute in turn. FIXME: Duplicated code with connect.js */
        if (l == null && r == null)
          return true;
        if (l == null || r == null)
          return false;
        for (var key in attrs) {
          var attr = attrs[key];
          if (attr in l && attr in r) {
            if (l[attr] instanceof Array) {
              /* Range filter */
              if (!(r[attr] instanceof Array)
               || l[attr][0] != r[attr][0]
               || l[attr][1] != r[attr][1]) {
                return false;
              }
            } else if ((r[attr] instanceof Array) || l[attr] != r[attr]) {
              /* Exact filter */
              return false;
            }
          } else if (attr in l || attr in r) {
            return false;
          }
        }
        return true;
      }
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
