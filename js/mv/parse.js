var mv = function(mv) {
  mv.parser = function() {
    var parser = {};
    var pcstat = {};
    var fullyDefinedCutoff = 0;
    parser.records = [];
    parser.fullyDefinedCutoff = function() { return fullyDefinedCutoff; };
    parser.parseRecords = function(data) {
      var spl = data.split(/\r?\n/);
      spl.forEach(function(e, i) {
        var d;
        d = e.match(/^(\d+\.\d+) PC(\d+) (\d+):(\d+),(\d+) GAINXP (\d+) (\d+) (\w+)/);
        if (d) {
          var mapSID = parseInt(d[3]);
          var ts = new Date(0);
          ts.setUTCSeconds(d[1]);
          var rec = {
            date: ts,
            pc:   parseInt(d[2]),
            map:  map.nameByServerID(parseInt(d[3]), ts),
            x:    parseInt(d[4]),
            y:    parseInt(d[5]),
            e:    parseInt(d[6]),
            j:    parseInt(d[7]),
            type: d[8],
            pcstat: pcstat[d[2]],
            target: -1010,
            dmg: -1010,
            wpn: -1010
          };
          if (pcstat[d[2]] == undefined && (!fullyDefinedCutoff || ts > fullyDefinedCutoff)) {
            fullyDefinedCutoff = ts;
          }
          /* XXX: Fragile horrible and unstructured, this whole thing needs a rewrite really */
          if (i >= 2 && rec.type == "KILLXP") {
            d = spl[i - 1].match(/^(\d+\.\d+) MOB(\d+) DEAD/);
            if (d) {
              var mID = parseInt(d[2]);
              /* There's a massive wealth of data that can be collected from this. Number of assailants, weapons used, the relationships with the assailants... this can't be done with a simple lookbehind. For now, just extract what mob it was, and what the killing weapon used was. */
              d = spl[i - 2].match(/^(\d+\.\d+) PC(\d+) (\d+):(\d+),(\d+) WPNDMG MOB(\d+) (\d+) FOR (\d+) WPN (\d+)/);
              if (d) {
                softAssert(mID == parseInt(d[6]), "Integrity error: MOB ID mismatch!");
  //               softAssert(rec.pc == parseInt(d[2]), "Integrity error: PC ID mismatch!");
                rec.target = parseInt(d[7]);
                softAssert(rec.target, "Unknown target!")
                rec.dmg = parseInt(d[8]);
                rec.wpn = parseInt(d[9]);
              } else {
//                 console.error("No match (deathblow):", spl[i - 2]);
              }
            } else {
              d = spl[i - 1].match(/^(\d+\.\d+) PC(\d+) (\d+):(\d+),(\d+) GAINXP (\d+) (\d+) (\w+)/);
              if (d) {
                var clone = parser.records[parser.records.length - 1];
                softAssert(rec.map == clone.map, "Integrity error: MAP ID mismatch!");
                rec.target = clone.target;
                softAssert(rec.target, "Unknown (cloned) target!");
                rec.dmg = clone.dmg; /* FIXME: Take into account actual assist damage */
                rec.wpn = clone.wpn;
              } else {
//                 console.error("No match (clone):", spl[i - 1]);
              }
            }
          }
          parser.records.push(rec);
          return;
        }
        d = e.match(/^(?:\d+\.\d+) PC(\d+) (?:\d+):(?:\d+),(?:\d+) STAT (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) /);
        if (d) {
          var s = {
            str: parseInt(d[2]),
            agi: parseInt(d[3]),
            vit: parseInt(d[4]),
            int: parseInt(d[5]),
            dex: parseInt(d[6]),
            luk: parseInt(d[7])
          };
          s.blvl = stat.minLevelForStats(s.str, s.agi, s.vit, s.int, s.dex, s.luk);
          s.str = Math.floor(s.str / 10);
          s.agi = Math.floor(s.agi / 10);
          s.vit = Math.floor(s.vit / 10);
          s.int = Math.floor(s.int / 10);
          s.dex = Math.floor(s.dex / 10);
          s.luk = Math.floor(s.luk / 10);
          pcstat[d[1]] = s;
          return;
        }
      });
    };
    function softAssert(expr, msg) {
      if (!expr) {
        console.error("SOFTASSERT FAILURE: " + msg);
      }
    }
    return parser;
  }();
  return mv;
}(mv || {});
