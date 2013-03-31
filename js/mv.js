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
  var pcstat = {};
  var fullyDefinedCutoff = false;
  function defLevelVerbose(level) {
    switch (level) {
      case 0: return "Undefined";
      case 1: return "Mixed";
      case 2: return "Defined";
      default: console.log(d, d.data); throw "Unknown definedness case (" + d.data.key + "); this shouldn't happen";
    }
  }
  function Stat(str, agi, vit, int, dex, luk) {
    this.str = str;
    this.agi = agi;
    this.vit = vit;
    this.int = int;
    this.dex = dex;
    this.luk = luk;
    this.blvl = stat.minLevelForStats(str, agi, vit, int, dex, luk);
  }
  Stat.prototype.valueOf = function() { return this.str * 1e15 + this.agi * 1e12 + this.vit * 1e9 + this.int * 1e6 + this.dex * 1e3 + this.luk; };
  var nullstat = new Stat(0,0,0,0,0,0);
  function parseRecords(data) {
    var spl = data.split(/\r?\n/);
    spl.forEach(function(e) {
      var d;
      d = e.match(/^(\d+\.\d+) PC(\d+) (\d+):(\d+),(\d+) GAINXP (\d+) (\d+) (\w+)/);
      if (d) {
        var mapSID = parseInt(d[3]);
        var ts = new Date(0);
        ts.setUTCSeconds(d[1]);
        records.push({
          date: ts,
          pc:   parseInt(d[2]),
          map:  map.nameByServerID(parseInt(d[3]), ts),
          x:    parseInt(d[4]),
          y:    parseInt(d[5]),
          e:    parseInt(d[6]),
          j:    parseInt(d[7]),
          type: d[8],
          pcstat: pcstat[d[2]] ? pcstat[d[2]] : nullstat
        });
        if (pcstat[d[2]] == undefined && (!fullyDefinedCutoff || ts > fullyDefinedCutoff)) {
          fullyDefinedCutoff = ts;
        }
        return;
      }
      d = e.match(/^(?:\d+\.\d+) PC(\d+) (?:\d+):(?:\d+),(?:\d+) STAT (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) /);
      if (d) {
        pcstat[d[1]] = new Stat(parseInt(d[2]), parseInt(d[3]), parseInt(d[4]), parseInt(d[5]), parseInt(d[6]), parseInt(d[7]));
        return;
      }
    });
  }
  var attrs = ["str", "agi", "vit", "int", "dex", "luk"];
  var cfdata, all,
    dateDim, dateGroup,
    pcDim, pcGroup,
    mapDim, mapGroup,
    blvlDim, blvlGroup,
    attrDims, attrGroups,
    /*
     * How well defined a record is.
     *  0 -> Record contains undefined data
     *  1 -> Record is defined, but undefined records follow and may impede validity of findings
     *  2 -> Record and all succeeding records are well defined
     */
    defDim, defGroup;
  /* The record files are set, do everything */
  function makeHeap() {
    cfdata = crossfilter(records);
    mv.all = all = cfdata.groupAll().reduceCount();
    dateDim = cfdata.dimension(function(d) { return d3.time.hour.round(d.date); });
    dateGroup = dateDim.group().reduceCount();
    pcDim = cfdata.dimension(function(d) { return d.pc; });
    pcGroup = pcDim.group().reduceCount();
    mapDim = cfdata.dimension(function(d) { return d.map; });
    mapGroup = mapDim.group().reduce(
      function(p, d) { return { e: p.e + d.e, j: p.j + d.j, r: p.r + 1 }; },
      function(p, d) { return { e: p.e - d.e, j: p.j - d.j, r: p.r - 1 }; },
      function(p, d) { return { e: 0, j: 0, r: 0 }; }
    );
    blvlDim = cfdata.dimension(function(d) { return d.pcstat != nullstat ? d.pcstat.blvl : 0; });
    blvlGroup = blvlDim.group().reduceCount();
    mv.attrDims = attrDims = {};
    mv.attrGroups = attrGroups = {};
    for (var y = 0; y != attrs.length - 1; ++y) {
      attrDims[attrs[y]] = {};
      attrGroups[attrs[y]] = {};
      for (var x = y + 1; x != attrs.length; ++x) {
        attrDims[attrs[y]][attrs[x]] = cfdata.dimension(function(h, l) { return function(d) { return Math.floor(d.pcstat[h] / 7) * 7 * 1e3 + Math.floor(d.pcstat[l] / 7) * 7; } }(attrs[y], attrs[x]));
        attrGroups[attrs[y]][attrs[x]] = attrDims[attrs[y]][attrs[x]].group().reduceCount();
      }
    }
    defDim = cfdata.dimension(function(d) { if (d.pcstat == nullstat) { return 0; } if (d.date <= fullyDefinedCutoff) { return 1; } return 2; });
    defGroup = defDim.group().reduceCount();
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
    mv.blvlChart = dc.barChart("#blvl-chart")
      .width(630)
      .height(130)
      .margins({left: 60, right: 18, top: 5, bottom: 30})
      .dimension(blvlDim)
      .group(blvlGroup)
      .gap(1)
      .elasticY(true)
      .x(d3.scale.linear().domain([0, blvlDim.top(1)[0].pcstat.blvl]))
      .renderHorizontalGridLines(true)
      .title(function(d) { return d.key + ": " + d.value; })
      .brushOn(true)
      ;
    mv.defChart = dc.pieChart("#def-chart")
      .width(630)
      .height(130)
      .radius(60)
      .dimension(defDim)
      .group(defGroup)
      .label(function(d) { return defLevelVerbose(d.data.key); })
      .title(function(d) { return defLevelVerbose(d.data.key) + ": " + d.value; })
      .colorAccessor(function(d) { return d.data.key; })
      .colorCalculator(function(k) { switch(k) {
        case 0: return "#fd350d";
        case 1: return "#fdae6b";
        case 2: return "#6baed6";
        default: throw "Definition chart: Color access key out of range!";
      }})
      ;
    mv.mapChart = dc.bubbleChart("#map-chart")
      .width(700)
      .height(500)
      .margins({left: 60, right: 18, top: 5, bottom: 30})
      .dimension(mapDim)
      .group(mapGroup)
      .colorCalculator(d3.scale.category20c())
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
    mv.defChart.filter(2);
    var c = function(v) { return "rgb(" + 25 * v + "," + 15 * v + "," + 3 * v + ")"; };
    c.range = function() { return { length: 11 }; };
    mv.attrCharts = {};
    for (var y = 0; y != attrs.length - 1; ++y) {
      mv.attrCharts[attrs[y]] = {};
      for (var x = y + 1; x != attrs.length; ++x) {
        mv.attrCharts[attrs[y]][attrs[x]] = dc.bubbleChart("#" + attrs[x] + "-" + attrs[y])
          .width(100)
          .height(100)
          .margins({left: 0, right: 0, top: 0, bottom: 0})
          .dimension(attrDims[attrs[y]][attrs[x]])
          .group(attrGroups[attrs[y]][attrs[x]])
          .colors(c)
          .colorAccessor(function(d, i){ return d.value; })
          .keyAccessor(function(k) { return function(d) { return d.key % 1e3; }; }(attrs[x]))
          .valueAccessor(function(k) { return function(d) { return Math.floor(d.key / 1e3); }; }(attrs[y]))
          .radiusValueAccessor(function(d) { return 3; })
          .x(d3.scale.linear().domain([1, 99]))
          .y(d3.scale.linear().domain([1, 99]))
          .r(d3.scale.identity())
          .renderLabel(false)
          ;
      }
    }
    dc.renderAll();
  }
})();
