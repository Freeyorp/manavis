function progress(root) {
  var _progress = {};
  var container = document.getElementById(root);
  var _percent = '0%';
  var bar = document.querySelector('#' + root + ' .percent');
  _progress.label = function() {
    return _percent;
  }
  /* Updates the progress bar to display a specific percentage. No range checking performed. */
  _progress.setPercent = function(percent) {
    _percent = percent;
    bar.style.width = _percent;
    bar.textContent = _progress.label();
  }
  /* Updates the progress bar to display a percentage based on the current proportion of items done. */
  _progress.update = function(current, total) {
    var percentLoaded = Math.min(100, Math.round((current / total) * 100));
    _progress.setPercent(percentLoaded + '%');
  };
  /* Resets the progress bar to display nothing done. */
  _progress.reset = function() {
    _progress.setPercent('0%');
  }
  /* Resets the progress bar to display everything done. */
  _progress.complete = function() {
    _progress.setPercent('100%');
  }
  /* Shows the progress bar. */
  _progress.show = function() {
    container.className += ' loading';
  }
  /* Hides the progress bar */
  _progress.hide = function() {
    container.className = container.className.replace(/\bloading\b/, '');
  }
  return _progress;
}
