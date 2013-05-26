"use strict";
var mv = function(mv) {
  /* Set up common variables for the loading bars */
  var loadbar = progress('loadbar');
  var filesbar = progress('filesbar');
  var lbase = loadbar.label;
  var fbase = filesbar.label;
  var name = "";
  loadbar.label = function() {
    return lbase() == '100%' ? "Loaded '" + name + "' - Done!" : "Loading '" + name + "' - " + lbase();
  };
  filesbar.label = function () {
    return fbase() == '100%' ? "Loaded " + mv.loader.numfiles() + " file(s) - Done!" : "Loading file " + mv.loader.curfile() + " of " + mv.loader.numfiles() + " - " + fbase();
  };
  /* Initialise modules that require initialisation */
  mv.init = function() {
    /* Loader module */
    /* Callbacks for loading files from the filesystem */
    mv.loader.onbulkstart = function(fevt) {
      loadbar.show();
      filesbar.show();
    };
    mv.loader.onloadstart = function(evt) {
      filesbar.update(mv.loader.curfile(), mv.loader.numfiles());
      loadbar.reset();
    };
    mv.loader.onprogress = function(current, total) {
      loadbar.update(current, total);
    };
    mv.loader.init(handleFile, postLoading);
    mv.loader.setname = function(n) { name = n; };
    /* Set zip.js worker path */
    zip.workerScriptsPath = "/js/zip/WebContent/";
  };
  /* When a file has finished loading, handle it. */
  function handleFile(data, name, after) {
    loadbar.complete();
    if (name.indexOf("scrubbed") != -1) {
      /* Scrubbed data! */
      mv.parser.parseScrubbed(data);
    } else {
      /* Raw logs. */
      mv.parser.parseRecords(data);
    }
    after();
  }
  /* When everything has finished loading, handle that, then show everything. */
  function postLoading() {
    filesbar.complete();
    /* TODO: This is still a total mess that doesn't really transition properly */
    setTimeout(function() {
      loadbar.hide();
    }, 2000);
    /* Second pass to apply future information to previously unascertainable records */
    mv.parser.postProcessing();
    /* Start up crossfilter */
    mv.heap.init();
    /* Give the UI space to catch up for a bit. May need a few more of these breaks. */
    setTimeout(function() {
      filesbar.hide();
      /* Remove the mask hiding the chart view */
      d3.select("#mask")
        .transition()
        .style("opacity", 0)
        .remove();
      /* Show the chart view */
      d3.selectAll(".vis-hide")
        .style("display", "inline")
        .transition()
        .style("opacity", 1)
        ;
      /* Render the charts */
      mv.charter.init();
      /* If the user wishes to connect, then connect them. */
      if (document.getElementById("connect-option").checked) {
        mv.connect.connect();
      }
    }, 2000);
  }
  return mv;
}(mv || {});
