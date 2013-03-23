"use strict";
/*
 * Globals accessible via the agent console for debugging purposes
 */

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
        filesbar.complete();
        setTimeout(function() {
          filesbar.hide();
        }, 2000);
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
      records.push({
        time: d[1],
        pc: d[2],
        map: d[3],
        x: d[4],
        y: d[5],
        e: d[6],
        j: d[7],
        type: d[8]
      });
    });
  }

  /* The record files are set, do everything */
  function makeHeap() {
    /* TODO */
  }
})();
