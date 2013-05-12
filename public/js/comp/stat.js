/**
 * Make computations about tmwAthena's stat requirements.
 *
 * Amongst other things, this can be used to derive a minimum base level for a stat configuration.
 */
var stat = function(){
  var stat = {};
  var statpoint = [
    48,
    52,
    56,
    60,
    64,
    69,
    74,
    79,
    84,
    90,
    96,
    102,
    108,
    115,
    122,
    129,
    136,
    144,
    152,
    160,
    168,
    177,
    186,
    195,
    204,
    214,
    224,
    234,
    244,
    255,
    266,
    277,
    288,
    300,
    312,
    324,
    336,
    349,
    362,
    375,
    388,
    402,
    416,
    430,
    444,
    459,
    474,
    489,
    504,
    520,
    536,
    552,
    568,
    585,
    602,
    619,
    636,
    654,
    672,
    690,
    708,
    727,
    746,
    765,
    784,
    804,
    824,
    844,
    864,
    885,
    906,
    927,
    948,
    970,
    992,
    1014,
    1036,
    1059,
    1082,
    1105,
    1128,
    1152,
    1176,
    1200,
    1224,
    1249,
    1274,
    1299,
    1324,
    1350,
    1376,
    1402,
    1428,
    1455,
    1482,
    1509,
    1536,
    1564,
    1592
  ];
  /* If a character is using a certain number of status points, what is the lowest level it could be? */
  stat.minLevelForStatusPoints = function(statusPoints) {
    /*
     * tmwAthena status points for a level are described by the following recurrence relation:
     *  p(1) = 48
     *  p(l) = p(l - 1) + floor((l + 14) / 4)
     * For whatever reason, the server also loads a cached copy from a file of all places - db/statpoint.txt.
     * If this is out of sync with the equation, fun things can happen.
     * For now, naively assume that statpoint.txt is correct and shamelessly dump it here (see above).
     */
    return crossfilter.bisect.left(statpoint, statusPoints, 0, statpoint.length) + 1;
  };
  var statusPointInc = [0, 0]
  stat.statusPointsForStat = function(v) {
    if (isNaN(v)) {
      throw "Invalid input";
    }
    /* First, convert the absolute stat to terms of increments. */
    /* This is as simple as removing the starting value - 1 - from it. */
    /*
     * The status points needed to increase from a stat with value v can be calculated as follows:
     *  floor((v + 9) / 10) + 1
     */
    if (statusPointInc.length > v) {
      return statusPointInc[v];
    }
    var i = stat.statusPointsForStat(v - 1) + Math.floor(((v - 1) + 9) / 10) + 1;
    statusPointInc.push(i);
    return i;
  }
  /* If a character has a certain arrangement of attributes, how many status points are required for this configuration? */
  stat.statusPointsForStats = function(str, agi, vit, dex, int, luk) {
    return stat.statusPointsForStat(str) +
           stat.statusPointsForStat(agi) +
           stat.statusPointsForStat(vit) +
           stat.statusPointsForStat(dex) +
           stat.statusPointsForStat(int) +
           stat.statusPointsForStat(luk);
  };
  /* Helper function currying minLevelForStatusPoints and stat.statusPointsForStats */
  stat.minLevelForStats = function(str, agi, vit, dex, int, luk) {
    return stat.minLevelForStatusPoints(stat.statusPointsForStats(str, agi, vit, dex, int, luk));
  };
  return stat;
}();
