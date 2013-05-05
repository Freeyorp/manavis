var mv = function(mv) {
  mv.charts = {};
  var thinWidth = 250;
  var medWidth = 400;
  var wideWidth = Math.max(700, document.width - thinWidth - medWidth);
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
      mv.charts.pc = bar(monoGroup(wide(dc.barChart("#player-chart")), "pc"))
        .x(d3.scale.linear().domain([mv.heap.pc.dim.bottom(1)[0].pc, mv.heap.pc.dim.top(1)[0].pc]).nice())
        ;
      mv.charts.blvl = bar(monoGroup(med(dc.barChart("#blvl-chart")), "blvl"))
        .x(d3.scale.linear().domain([0, mv.heap.blvl.dim.top(1)[0].pcstat.blvl]))
        ;
      mv.charts.type = pie(monoGroup(dc.pieChart("#type-chart"), "type"))
        ;
      mv.charts.target = pie(monoGroup(dc.pieChart("#target-chart"), "target"))
        ;
      mv.charts.wpn = pie(monoGroup(dc.pieChart("#wpn-chart"), "wpn"))
        ;
      mv.charts.def = pie(monoGroup(dc.pieChart("#def-chart"), "def"))
        .label(function(d) { return defLevelVerbose(d.data.key); })
        .title(function(d) { return defLevelVerbose(d.data.key) + ": " + d.value; })
        .colorAccessor(function(d) { return d.data.key; })
        .colorCalculator(function(k) { switch(k) {
          case 0: return "#fd350d";
          case 1: return "#fdae6b";
          case 2: return "#6baed6";
          default: throw "Definition chart: Color access key out of range!";
        }})
        .filter(2)
        ;
      mv.charts.map = monoGroup(margined(wide(dc.bubbleChart("#map-chart"))), "map")
        .height(500)
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
      dc.renderlet(function() { mv.charts.stats(); });
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
    function defLevelVerbose(level) {
      switch (level) {
        case 0: return "Undefined";
        case 1: return "Mixed";
        case 2: return "Defined";
        default: console.log(d, d.data); throw "Unknown definedness case (" + d.data.key + "); this shouldn't happen";
      }
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
    return chart
      .height(130)
      ;
  }
  function margined(chart) {
    return chart
      .margins({left: 60, right: 18, top: 5, bottom: 30})
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
      .radius(90)
      .colorCalculator(d3.scale.category20c())
      ;
  }
  return mv;
}(mv || {});
