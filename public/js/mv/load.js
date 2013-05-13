"use strict";
var mv = function(mv) {
  mv.loader = function() {
    /* Set up handlers for file selector */
    var numfiles = 0;
    var filenames = [];
    var curfile = 0;
    var loader = {};
    loader.onbulkstart = function(fevt) {};
    loader.onloadstart = function(evt) {};
    loader.onprogress = function(evt) {};
    loader.onabort = function(evt) {
      alert('File load aborted!');
    };
    loader.onerror = function(evt) {
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
    };
    loader.numfiles = function() { return numfiles; };
    loader.filenames = function() { return filenames; };
    loader.curfile = function() { return curfile; };
    loader.init = function(each, after) {
      document.getElementById('input').addEventListener('change', function(fevt) {
        numfiles = fevt.target.files.length;
        filenames = Array.prototype.map.call(fevt.target.files, function(d) { return d.name; });
        curfile = 0;
        var reader = new FileReader();
        loader.onbulkstart(fevt);
        reader.onerror = function() { loader.onerror.apply(null, arguments) };
        reader.onprogress = function() { loader.onprogress.apply(null, arguments) };
        reader.onabort = function() { loader.onabort.apply(null, arguments) };
        reader.onloadstart = function() { loader.onloadstart.apply(null, arguments) };
        reader.onload = function(evt) {
          each(reader.result, curfile, numfiles);
          ++curfile;
          if (curfile == numfiles) {
            after();
          } else {
            nextFile();
          }
        };
        function nextFile() {
          reader.readAsBinaryString(fevt.target.files[curfile]);
        }
        nextFile();
      }, false);
    };
    return loader;
  }();
  return mv;
}(mv || {});
