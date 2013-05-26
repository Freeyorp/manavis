"use strict";
var mv = function(mv) {
  mv.loader = {
    /* Callbacks */
    onbulkstart: onbulkstart,
    onloadstart: onloadstart,
    onprogress: onprogress,
    onabort: onabort,
    onerror: onerror,
    /* File state accessors */
    numfiles: function() { return numfiles; },
    filenames: function() { return filenames; },
    curfile: function() { return curfile; },
    /* Callback */
    setname: function(n) {},
    /* Initialise the loader module */
    init: init,
  }
  /* Set up handlers for file selector */
  var numfiles = 0;
  var filenames = [];
  var curfile = 0;
  var files;
  function onbulkstart(fevt) {}
  function onloadstart(evt) {}
  function onprogress(evt) {}
  function onabort(evt) {
    alert('File load aborted!');
  }
  function onerror(evt) {
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
  function init(input, each, after) {
    input.on('change', function() {
      files = d3.event.target.files;
      numfiles = files.length;
      filenames = Array.prototype.map.call(files, function(d) { return d.name; });
      curfile = 0;
      var reader = new FileReader();
      mv.loader.onbulkstart();
      reader.onerror = function() { mv.loader.onerror.apply(null, arguments) };
      reader.onprogress = function(evt) { if (evt.lengthComputable) { mv.loader.onprogress(evt.loaded, evt.total) } };
      reader.onabort = function() { mv.loader.onabort.apply(null, arguments) };
      reader.onloadstart = function() { mv.loader.onloadstart.apply(null, arguments) };
      reader.onload = function(evt) {
        each(reader.result, filenames[curfile], function() {
          ++curfile;
          if (curfile == numfiles) {
            after();
          } else {
            nextFile();
          }
        });
      };
      function nextFile() {
        var file = files[curfile];
        mv.loader.onloadstart();
        if (file.name.indexOf(".zip", name.length - 4) != -1) {
          zip.createReader(new zip.BlobReader(file), function(zipReader) {
            zipReader.getEntries(function(entries) {
              entries.forEach(function(d, i) {
                mv.loader.setname(file.name + "'; unzipping '" + d.filename + " (" + (i + 1) + "/" + entries.length + ")");
                d.getData(new zip.BlobWriter(), function(blob) {
                  mv.loader.setname(d.filename);
                  reader.readAsBinaryString(blob);
                }, mv.loader.onprogress);
              });
            }, mv.loader.onerror);
          }, mv.loader.onerror);
        } else {
          mv.loader.setname(file);
          reader.readAsBinaryString(file);
        }
      }
      nextFile();
    }, false);
  };
  return mv;
}(mv || {});
