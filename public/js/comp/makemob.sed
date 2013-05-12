#!/bin/sed -nf
# Usage: ./makemob.sed < mob.in > mob.js
1i\
var mob = function(){\
  var mob = {};\
  var mobs = {
s/^\([0-9]\+\),[\t ]\+\([^\t ]\+\),.*/    \1:"\2",/p
$i\
  };\
  mob.nameByServerID = function(serverID) {\
    return serverID in mobs ? mobs[serverID] : "UNDEFINED";\
  }\
  return mob;\
}();
