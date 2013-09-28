var map = function(){
  var map = {};
  var maps = {
    "0": "001-1",
    "1": "001-2",
    "2": "001-3",
    "3": "002-1",
    "4": "002-2",
    "5": "002-3",
    "6": "002-4",
    "7": "002-5",
    "8": "003-1",
    "9": "003-2",
    "10": "004-1",
    "11": "004-2",
    "12": "005-1",
    "13": "005-3",
    "14": "005-4",
    "15": "006-1",
    "16": "006-3",
    "17": "007-1",
    "18": "008-1",
    "19": "009-1",
    "20": "009-2",
    "21": "009-3",
    "22": "009-4",
    "23": "009-5",
    "24": "009-6",
    "25": "010-1",
    "26": "010-2",
    "27": "011-1",
    "28": "011-3",
    "29": "011-4",
    "30": "011-6",
    "31": "012-1",
    "32": "012-3",
    "33": "012-4",
    "34": "013-1",
    "35": "013-2",
    "36": "013-3",
    "37": "014-1",
    "38": "014-3",
    "39": "015-1",
    "40": "015-3",
    "41": "016-1",
    "42": "017-1",
    "43": "017-2",
    "44": "017-3",
    "45": "017-4",
    "46": "017-9",
    "47": "018-1",
    "48": "018-2",
    "49": "018-3",
    "50": "019-1",
    "51": "019-3",
    "52": "019-4",
    "53": "020-1",
    "54": "020-2",
    "55": "020-3",
    "56": "021-1",
    "57": "021-2",
    "58": "021-3",
    "59": "022-1",
    "60": "024-1",
    "61": "024-2",
    "62": "024-3",
    "63": "024-4",
    "64": "025-1",
    "65": "025-3",
    "66": "025-4",
    "67": "026-1",
    "68": "027-1",
    "69": "027-2",
    "70": "027-3",
    "71": "027-4",
    "72": "028-1",
    "73": "028-3",
    "74": "029-1",
    "75": "029-3",
    "76": "030-1",
    "77": "030-2",
    "78": "031-1",
    "79": "031-2",
    "80": "031-3",
    "81": "031-4",
    "82": "032-1",
    "83": "032-3",
    "84": "033-1",
    "85": "034-1",
    "86": "034-2",
    "87": "041-1",
    "88": "042-1",
    "89": "042-2",
    "90": "043-1",
    "91": "043-3",
    "92": "044-1",
    "93": "044-3",
    "94": "045-1",
    "95": "046-1",
    "96": "046-3",
    "97": "047-1",
    "98": "048-1",
    "99": "048-2",
    "100": "051-1",
    "101": "051-3",
    "102": "052-1",
    "103": "052-2",
    "104": "055-1",
    "105": "055-3",
    "106": "056-1",
    "107": "056-2",
    "108": "057-1",
    "109": "botcheck",
  };
  map.nameByServerID = function(serverID, date) {
    /* TODO: Merged output format suitable for converting records running under different data */
    /*
     * Now that the new server format simply outputs the human readable map name, this lookup is largely no longer required.
     * It is still preserved here for backwards compatability.
     */
    return serverID in maps ? maps[serverID] : serverID;
  }
  return map;
}();
