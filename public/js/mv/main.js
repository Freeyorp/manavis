"use strict";
var mv = function(mv) {
  mv.init = function() {
    console.log("Initialising");
    var loadbar = progress('loadbar');
    var filesbar = progress('filesbar');
    var lbase = loadbar.label;
    loadbar.label = function() {
      return lbase() == '100%' ? "Loaded '" + mv.loader.filenames()[mv.loader.curfile()]+ "' - Done!" : "Loading '" + mv.loader.filenames()[mv.loader.curfile()] + "' - " + lbase();
    };
    var fbase = filesbar.label;
    filesbar.label = function () {
      return fbase() == '100%' ? "Loaded " + mv.loader.numfiles() + " file(s) - Done!" : "Loading file " + mv.loader.curfile() + " of " + mv.loader.numfiles() + " - " + fbase();
    }
    mv.loader.onbulkstart = function(fevt) {
      loadbar.show();
      filesbar.show();
    };
    mv.loader.onloadstart = function(evt) {
      filesbar.update(mv.loader.curfile(), mv.loader.numfiles());
      loadbar.reset();
    };
    mv.loader.onprogress = function(evt) {
      if (evt.lengthComputable) {
        loadbar.update(evt.loaded, evt.total);
      }
    };
    mv.loader.init(handleFile, postLoading);
    function handleFile(data, curFileNum, numFiles) {
      loadbar.complete();
      if (mv.loader.filenames()[curFileNum].indexOf("scrubbed") != -1) {
        /* Scrubbed data! */
        mv.parser.parseScrubbed(data);
      } else {
        /* Raw logs. */
        mv.parser.parseRecords(data);
      }
    }
    function postLoading() {
      filesbar.complete();
      /* TODO: This is still a total mess that doesn't really transition properly */
      setTimeout(function() {
        loadbar.hide();
      }, 2000);
      mv.parser.postProcessing();
      mv.heap.init();
      setTimeout(function() {
        filesbar.hide();
        d3.select("#mask")
          .transition()
          .style("opacity", 0)
          .remove();
        d3.selectAll(".vis-hide")
          .style("display", "inline")
          .transition()
          .style("opacity", 1)
          ;
        mv.charter.init();
        console.log(document.getElementById("connect-option").checked);
        if (document.getElementById("connect-option").checked) {
          mv.socket.connect();
        }
      }, 2000);
    }
  };
  return mv;
}(mv || {});
