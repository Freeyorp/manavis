"use strict";
var mv = function(mv) {
  mv.loader = {
    /* Callbacks */
    onbulkstart: nullFunc,
    onloadstart: nullFunc,
    onprogress: nullFunc,
    onabort: onabort,
    onerror: onerror,
    /* File state accessors */
    numfiles: function() { return numfiles; },
    filenames: function() { return filenames; },
    curfile: function() { return curfile; },
    /* Callback */
    setname: function(n) {},
    /* Use an array of URLs for loading, via d3.xhr */
    use: use,
    /* Initialise the loader module */
    init: init,
  }
  /* Set up handlers for file selector */
  var numfiles = 0;
  var filenames = [];
  var curfile = 0;
  /* Function to handle the loading of the next file - should invoke loadBlobable */
  var nextFile;
  /* Function to be called after all loading */
  var postLoadAll;
  /* The reader used to handle files once the request is complete */
  var reader;
  /* Dummy function */
  function nullFunc() {};
  /* Basic error functions - you probably want to override these */
  /* TODO: Make the defaults a little more sensible */
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
  function use(urllist) {
    /* Load files using d3's xhr requests */
    numfiles = urllist.length
    filenames = urllist;
    nextFile = function() {
      mv.loader.setname(urllist[curfile] + "'; 'Downloading");
      var req = d3.xhr(urllist[curfile])
        .on('progress', function(d, i) { reader.onprogress(d3.event); })
        .on('load', function(d) {
          loadBlobable(d.response, urllist[curfile]);
        })
        .responseType("blob")
        .get()
      ;
    };
    startLoading();
  }
  function init(input, each, after) {
    reader = new FileReader();
    postLoadAll = after;
    input.on('change', function() {
      /* Load files using the file selector */
      var files = d3.event.target.files;
      numfiles = files.length;
      filenames = Array.prototype.map.call(files, function(d) { return d.name; });
      nextFile = function() {
        loadBlobable(files[curfile], files[curfile].name);
      }
      startLoading();
    }, false);
    /* General callbacks */
    reader.onerror = function() { mv.loader.onerror.apply(null, arguments) };
    reader.onprogress = function(evt) { if (evt.lengthComputable) { mv.loader.onprogress(evt.loaded, evt.total) } };
    reader.onabort = function() { mv.loader.onabort.apply(null, arguments) };
    reader.onloadstart = function() { mv.loader.onloadstart.apply(null, arguments) };
    /* Logic for finishing or moving on once a file has finished loading */
    reader.onload = function(evt) {
      each(reader.result, filenames[curfile], function() {
        ++curfile;
        if (curfile >= numfiles) {
          /* We're done */
          postLoadAll();
        } else {
          /* Go to the next file, as determined by the current nextFile function */
          nextFile();
        }
      });
    };
  };
  function startLoading() {
    curfile = 0;
    mv.loader.onbulkstart();
    nextFile();
  }
  function loadBlobable(blobable, name) {
    mv.loader.onloadstart();
    if (name.indexOf(".zip", name.length - 4) != -1) {
      zip.createReader(new zip.BlobReader(blobable), function(zipReader) {
        zipReader.getEntries(function(entries) {
          entries.forEach(function(d, i) {
            mv.loader.setname(name + "'; 'Unzipping " + d.filename + " (" + (i + 1) + "/" + entries.length + ")");
            d.getData(new zip.BlobWriter(), function(blob) {
              mv.loader.setname(d.filename);
              reader.readAsBinaryString(blob);
            }, mv.loader.onprogress);
          });
        }, mv.loader.onerror);
      }, mv.loader.onerror);
    } else {
      mv.loader.setname(name);
      reader.readAsBinaryString(blobable);
    }
  }
  return mv;
}(mv || {});
