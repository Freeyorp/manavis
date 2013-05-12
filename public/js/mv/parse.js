var mv = function(mv) {
  mv.parser = function() {
    var parser = {};
    /* The most recent information of a pc's stat */
    var pcstat = {};
    /*
     * The first recorded state of a pc's stat.
     * This is saved for a second pass, in which instances unknown at the time can have the pc's stat applied.
     */
    var firstpcstat = {};
    /*
     * The time stamp of the last unknown instance.
     */
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
            target: "UNKNOWN",
            dmg: -1010,
            wpn: "UNKNOWN",
            atktype: "UNKNOWN"
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
                rec.target = mob.nameByServerID(d[7]);
                softAssert(rec.target, "Unknown target!")
                rec.dmg = parseInt(d[8]);
                rec.wpn = item.nameByServerID(d[9]);
                rec.atktype = "Physical";
              } else {
                /* Not weapon damage, perhaps it was spell damage? */
                d = spl[i - 2].match(/^(\d+\.\d+) PC(\d+) (\d+):(\d+),(\d+) SPELLDMG MOB(\d+) (\d+) FOR (\d+) BY ([^ ]+)/);
                if (d) {
                  rec.target = mob.nameByServerID(d[7]);
                  rec.dmg = parseInt(d[8]);
                  rec.wpn = d[9];
                  rec.atktype = "Magical";
                }
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
                rec.atktype = clone.atktype; /* FIXME: Take into account what the assists used */
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
          if (!(d[1] in firstpcstat)) {
            firstpcstat = s;
          }
          pcstat[d[1]] = s;
          return;
        }
      });
    };
    parser.postProcessing = function() {
      /* Scrub reference to pc id, and scan up until the fully defined cutoff line, assigning the pcstat from those that logged off */
      var i = 0;
      /* This name has way too many warts; suggestions for a replacement welcome! */
      var postProcessedfullyDefinedCutoff = 0;
      for (; i != parser.records.length && parser.records[i].date <= fullyDefinedCutoff; ++i) {
        /* See if we've found out what the stats were from information logged after the record. */
        if (parser.records[i].pc in firstpcstat) {
          parser.records[i].pcstat = firstpcstat[parser.records[i].pc];
        } else {
          /* If not, adjust the fully defined cutoff. */
          postProcessedfullyDefinedCutoff = parser.records[i].date;
        }
        /* Remove references to pc from these records. */
        delete parser.records[i].pc;
      }
      /* Remove references to pc from the remaining records. */
      for (; i != parser.records.length; ++i) {
        delete parser.records[i].pc;
      }
      fullyDefinedCutoff = postProcessedfullyDefinedCutoff;
    }
    function softAssert(expr, msg) {
      if (!expr) {
        console.error("SOFTASSERT FAILURE: " + msg);
      }
    }
    parser.createBlobLink = function() {
      /* Make the scrubbed data available for download as a blob. */
      var blob = new Blob(JSON.stringify(parser.records));
      var a = d3.select('body').append('a');
      a
        .text("Scrubbed records")
        .attr("download", "map.scrubbed")
        .attr("href", window.URL.createObjectURL(blob))
      ;
    }
    parser.parseScrubbed = function(scrubbedRecords) {
      scrubbedRecords = JSON.parse(scrubbedRecords);
      console.log(scrubbedRecords, scrubbedRecords.length);
      /*
       * The work is mostly all done for us. Just scan through to see if there
       * are any undefined records, and update the pointer if so.
       */
      /*
       * Note that because we do not have the IDs, we cannot do a second pass
       * to see if there is any information outside of the file that would
       * tell us what the stats are, because we do not have that information.
       * We can only get as good as what we were given!
       */
      for (var i = 0; i != scrubbedRecords.length; ++i) {
        scrubbedRecords[i].date = new Date(scrubbedRecords[i].date);
        if (scrubbedRecords[i].pcstat == undefined && (!fullyDefinedCutoff || scrubbedRecords[i].date > fullyDefinedCutoff)) {
          fullyDefinedCutoff = scrubbedRecords[i].date;
        }
      }
      /* It's simple when everything's already been done. */
      parser.records = parser.records.concat(scrubbedRecords);
    }
    return parser;
  }();
  return mv;
}(mv || {});
