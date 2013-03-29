"use strict";
/*
 * Globals accessible via the agent console for debugging purposes
 */
var mv = {};
/*
 * Processing
 */
(function() {
  /* Set up handlers for file selector */
  document.getElementById('input').addEventListener('change', function(fevt) {
    var reader = new FileReader();
    var loadbar = progress('loadbar');
    var filesbar = progress('filesbar');

    reader.onerror = function(evt) {
      switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
      case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
      default:
        alert('An error occurred reading this file.');
      };
    }
    reader.onprogress = function(evt) {
      if (evt.lengthComputable) {
        loadbar.update(evt.loaded, evt.total);
      }
    }
    reader.onabort = function(evt) {
      alert('File load aborted!');
    }
    reader.onloadstart = function(evt) {
      loadbar.reset();
    }
    reader.onload = function(evt) {
      loadbar.complete();
      ++cur;
      parseRecords(reader.result);
      if (cur == fevt.target.files.length) {
        filesbar.complete();
        /* TODO: Make this fade out nicely? */
        setTimeout(function() {
          loadbar.hide();
        }, 2000);
        makeHeap();
        setTimeout(function() {
          filesbar.hide();
        }, 2000);
        makeCharts();
      } else {
        filesbar.update(cur, fevt.target.files.length);
        nextFile();
      }
    }
    var cur = 0;
    var lbase = loadbar.label;
    loadbar.label = function() {
      return lbase() == '100%' ? "Loaded '" + fevt.target.files[cur].name + "' - Done!" : "Loading '" + fevt.target.files[cur].name + "' - " + lbase();
    };
    var fbase = filesbar.label;
    filesbar.label = function () {
      return fbase() == '100%' ? "Loaded " + fevt.target.files.length + " file(s) - Done!" : "Loading file " + (cur + 1) + " of " + fevt.target.files.length + " - " + fbase();
    }
    loadbar.show();
    filesbar.show();
    function nextFile() {
      reader.readAsBinaryString(fevt.target.files[cur]);
    }
    nextFile();
  }, false);
  var records = [];
  function parseRecords(data) {
    var spl = data.split(/\r?\n/);
    spl.forEach(function(e) {
      var d = e.match(/^(\d+\.\d+) PC(\d+) (\d+):(\d+),(\d+) GAINXP (\d+) (\d+) (\w+)/);
      if (d == null) {
        return;
      }
      var ts = new Date(0);
      ts.setUTCSeconds(d[1]);
      records.push({
        date: ts,
        pc:   parseInt(d[2]),
        map:  parseInt(d[3]),
        x:    parseInt(d[4]),
        y:    parseInt(d[5]),
        e:    parseInt(d[6]),
        j:    parseInt(d[7]),
        type: d[8]
      });
    });
    console.log(records.length);
  }
  var cfdata, all, dateDim, dateGroup, pcDim, pcGroup, mapDim, mapGroup;
  /* The record files are set, do everything */
  function makeHeap() {
    function a(p, d) { return { e: p.e + d.e, j: p.j + d.j, r: p.r + 1 }; }
    function s(p, d) { return { e: p.e - d.e, j: p.j - d.j, r: p.r - 1 }; }
    function z(p, d) { return { e: 0, j: 0, r: 0 }; }
    cfdata = crossfilter(records);
    all = cfdata.groupAll().reduce(a, s, z);
    dateDim = cfdata.dimension(function(d) { return d3.time.hour.round(d.date); });
    dateGroup = dateDim.group().reduceCount();
    pcDim = cfdata.dimension(function(d) { return d.pc; });
    pcGroup = pcDim.group().reduceCount();
    mapDim = cfdata.dimension(function(d) { return d.map; });
    mapGroup = mapDim.group().reduce(a, s, z);
    /*
     * The viewport is the bubble frame.
     * - K: Map
     * - X: Exp
     * - Y: JExp
     * - r: Record count
     */
  }
  function makeCharts() {
    d3.select("#mask")
      .transition()
      .style("opacity", 0)
      .remove();
    d3.selectAll(".chart-root")
      .style("display", "inline")
      .transition()
      .style("opacity", 1)
      ;
    mv.dateChart = dc.barChart("#date-chart")
      .width(630)
      .height(130)
      .margins({left: 60, right: 18, top: 5, bottom: 30})
      .dimension(dateDim)
      .group(dateGroup)
      .centerBar(true)
      .gap(1)
      .elasticY(true)
      .elasticX(true)
      .x(d3.time.scale().domain([dateDim.bottom(1)[0].date, dateDim.top(1)[0].date]).nice(d3.time.hour))
      .xUnits(d3.time.hours)
      .xAxisPadding(2)
    //     .renderVerticalGridLines(true)
      .renderHorizontalGridLines(true)
      .title(function(d) { return d.key + ": " + d.value; })
      .brushOn(true)
      ;
    console.log([pcDim.bottom(1)[0], pcDim.top(1)[0]])
    mv.pcChart = dc.barChart("#player-chart")
      .width(630)
      .height(130)
      .margins({left: 60, right: 18, top: 5, bottom: 30})
      .dimension(pcDim)
      .group(pcGroup)
      .gap(1)
//       .elasticX(true)
      .elasticY(true)
      .x(d3.scale.linear().domain([pcDim.bottom(1)[0].pc, pcDim.top(1)[0].pc]).nice())
      .renderHorizontalGridLines(true)
      .title(function(d) { return d.key + ": " + d.value; })
      .brushOn(true)
      ;
    mv.mapChart = dc.bubbleChart("#map-chart")
      .width(700)
      .height(500)
      .margins({left: 60, right: 18, top: 5, bottom: 30})
      .dimension(mapDim)
      .group(mapGroup)
      .colorDomain(function(d) { return [mapDim.bottom(1)[0].map, mapDim.top(1)[0].map]; })
      .colorAccessor(function(d, i){ return d.key; })
      /* X */
      .keyAccessor(function(d) { return d.value.e + 1; })
      /* Y */
      .valueAccessor(function(d) { return d.value.j + 1; })
      /* R */
      .radiusValueAccessor(function(d) { return Math.log(d.value.r + 1); })
      .x(d3.scale.log().domain([1, 100000]))
      .y(d3.scale.log().domain([1, 300000]))
      .elasticX(true)
      .elasticY(true)
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .title(function(d) { return "Map " + d.key; })
      .renderTitle(true)
      ;
    dc.renderAll();
  }
})();
