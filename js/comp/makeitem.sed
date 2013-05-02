#!/bin/sed -nf
# Usage: ./makeitem.sed < item.in > item.js
1i\
var item = function(){\
  var item = {};\
  var items = {
# /(?<!,0)[\t ]\+,[^,]\+,[^,]\+$/ {
s/^\([0-9]\+\),[\t ]\+\([^,]\+\).*/    \1:"\2",/p
# }
$i\
  };\
  item.nameByServerID = function(serverID) {\
    return serverID in items ? items[serverID] : "UNDEFINED";\
  }\
  return item;\
}();
