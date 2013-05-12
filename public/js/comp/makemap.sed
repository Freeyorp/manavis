#!/bin/sed -nf
# Usage: ./makemap.sed < map.in > map.js
1i\
var map = function(){\
  var map = {};\
  var maps = {
/^Loading Maps/,/^Maps Loaded/ {
  s/^Loading Maps \[\([0-9]\+\)\/[0-9]\+\]: data\\\(.*\)\.gat/    "\1": "\2",/p;
}
$i\
  };\
  map.nameByServerID = function(serverID, date) {\
    /* TODO: Merged output format suitable for converting records running under different data */\
    return maps[serverID];\
  }\
  return map;\
}();
