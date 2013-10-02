"use strict";
var mv = function(mv) {
  mv.parser = {
    records: [],
    fullyDefinedCutoff: function() { return fullyDefinedCutoff; },
    parseRecords: parseRecords,
    parseScrubbed: parseScrubbed,
    postProcessing: postProcessing,
    createBlobLink: createBlobLink
  };
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
  /*
   * 0: No mob just died
   * Positive: A mob just died, this is its ID.
   */
  var killedMobID = 0;
  /*
   * mob ID -> { mobClass, numAttackers, player IDs -> { total, weapon names -> { sum damage } } }
   */
  var combat = {};
  function combatPerformed(mobClass, target, pc, wpn, damage) {
      /* Update combat state */
    var mobData = combat[target] || (combat[target] = { mobClass: mobClass });
    var pcData;
    if (pc in mobData) {
      pcData = mobData[pc];
    } else {
      (++mobData.numAttackers) || (mobData.numAttackers = 1);
      pcData = mobData[pc] = {};
    }
    (pcData[wpn] += damage) || (pcData[wpn] = damage);
    (pcData.total += damage) || (pcData.total = damage);
  }
  function freeMob() {
    /* We no longer need detailed information on the mob's combat. */
    if (!killedMobID) {
      return;
    }
    delete combat[killedMobID];
    killedMobID = 0;
  }
  function parseRecords(data) {
    var spl = data.split(/\r?\n/);
    spl.forEach(function(e) {
      /* Check for each of the record types we're looking for. */
      if (checkDmg(e) || checkMobMobDmg(e) || checkStat(e)) {
        /* We have a record that has nothing to do with killed mobs, so no mob just died. */
        freeMob();
      } else {
        checkXP(e) || checkMobDeath(e);
        /* These functions deal directly with killed mobs and will handle setting or clearing of the ID internally. */
      }
    });
  };
  function checkXP(e) {
    /* Try to parse an XP record. */
    var d = e.match(/^(\d+\.\d+|\d+-\d+-\d+ \d+:\d+:\d+\.\d+):? PC(\d+) ([^,]+):(\d+),(\d+) GAINXP (\d+) (\d+) (\w+)/);;
    if (!d) {
      return false;
    }
    /* We have an XP record. */
    /* Map's server ID. */
    var mapSID = parseInt(d[3]);
    /* Record timestamp. */
    var ts = new Date(0);
    ts.setUTCSeconds(d[1]) || (ts = new Date(d[1])); /* Backwards compatability - older logs used unix timestamps. */
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
      dmg: 0,
      wpn: "UNKNOWN",
      numAttackers: 0
    };
    if (pcstat[d[2]] == undefined && (!fullyDefinedCutoff || ts > fullyDefinedCutoff)) {
      /* Undefined, and newer than any existing definedness cutoff */
      fullyDefinedCutoff = ts;
    }
    if (rec.type == "KILLXP") {
      if (killedMobID && killedMobID in combat && rec.pc in combat[killedMobID]) {
        var mob = combat[killedMobID];
        rec.target = mob.mobClass;
        rec.numAttackers = mob.numAttackers || 0;
        var weapons = mob[rec.pc];
        /* We have the needed information. */
        rec.dmg = weapons.total;
        var maxDamage = 0;
        for (var key in weapons) {
          if (key == "total") {
            continue;
          }
          if (weapons[key] > maxDamage) {
            maxDamage = weapons[key];
            rec.wpn = key;
          }
        }
      }
    } else {
      freeMob();
    }
    mv.parser.records.push(rec);
    return true;
  }
  function checkStat(e) {
    var d = e.match(/^(?:\d+\.\d+|\d+-\d+-\d+ \d+:\d+:\d+\.\d+):? PC(\d+) (?:[^,]+):(?:\d+),(?:\d+) STAT (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) /);
    if (!d) {
      return false;
    }
    var s = {
      str: parseInt(d[2]),
      agi: parseInt(d[3]),
      vit: parseInt(d[4]),
      int: parseInt(d[5]),
      dex: parseInt(d[6]),
      luk: parseInt(d[7])
    };
    /* The base level is not logged. Derive the minimum needed base level for one to have the stats that they have. */
    s.blvl = stat.minLevelForStats(s.str, s.agi, s.vit, s.int, s.dex, s.luk);
    /* Round the stats down to groups of 10. Accurate enough to identify trends and hot spots, fuzzy enough to make unique identification hard. */
    s.str = Math.floor(s.str / 10);
    s.agi = Math.floor(s.agi / 10);
    s.vit = Math.floor(s.vit / 10);
    s.int = Math.floor(s.int / 10);
    s.dex = Math.floor(s.dex / 10);
    s.luk = Math.floor(s.luk / 10);
    /* Record these. */
    if (!(d[1] in firstpcstat)) {
      firstpcstat[d[1]] = s;
    }
    pcstat[d[1]] = s;
    return true;
  }
  function checkDmg(e) {
    var d = e.match(/^(\d+\.\d+|\d+-\d+-\d+ \d+:\d+:\d+\.\d+):? PC(\d+) ([^,]+):(\d+),(\d+) ([A-Z]+)DMG MOB(\d+) (\d+) FOR (\d+) (?:WPN|BY) ([^ ]+)/);
    if (!d) {
      return false;
    }
    /* Parse out values */
    var mobClass = mob.nameByServerID(d[8]);
    var target = parseInt(d[7]);
    var pc = parseInt(d[2]);
    var wpn = d[6] == "SPELL" ? d[10] : item.nameByServerID(d[10]);
    var damage = parseInt(d[9]);
    combatPerformed(mobClass, target, pc, wpn, damage);
    return true;
  }
  function checkMobMobDmg(e) {
    var d = e.match(/^(\d+\.\d+|\d+-\d+-\d+ \d+:\d+:\d+\.\d+):? PC(\d+) ([^,]+):(\d+),(\d+) MOB-TO-MOB-DMG FROM MOB(\d+) (\d+) TO MOB(\d+) (\d+) FOR (\d+)/);
    if (!d) {
      return false;
    }
    /* Parse out values */
    var mobClass = mob.nameByServerID(d[9]);
    var target = parseInt(d[8]);
    var pc = parseInt(d[2]);
    var wpn = mob.nameByServerID(d[7]);
    var damage = parseInt(d[10]);
    /* Update combat state */
    combatPerformed(mobClass, target, pc, wpn, damage);
    return true;
  }
  function checkMobDeath(e) {
    var d = e.match(/^(\d+\.\d+|\d+-\d+-\d+ \d+:\d+:\d+\.\d+):? MOB(\d+) DEAD/);
    if (!d) {
      return false;
    }
    killedMobID = parseInt(d[2]);
    return true;
  }
  function postProcessing() {
    /* Scrub reference to pc id, and scan up until the fully defined cutoff line, assigning the pcstat from those that logged off */
    var i = 0;
    /* This name has way too many warts; suggestions for a replacement welcome! */
    var postProcessedfullyDefinedCutoff = 0;
    for (; i != mv.parser.records.length && mv.parser.records[i].date <= fullyDefinedCutoff; ++i) {
      /* See if we've found out what the stats were from information logged after the record. */
      if (mv.parser.records[i].pc in firstpcstat) {
        mv.parser.records[i].pcstat = firstpcstat[mv.parser.records[i].pc];
      } else {
        /* If not, adjust the fully defined cutoff. */
        postProcessedfullyDefinedCutoff = mv.parser.records[i].date;
      }
      /* Remove references to pc from these records. */
      delete mv.parser.records[i].pc;
    }
    /* Remove references to pc from the remaining records. */
    for (; i != mv.parser.records.length; ++i) {
      delete mv.parser.records[i].pc;
    }
    fullyDefinedCutoff = postProcessedfullyDefinedCutoff;
  }
  function createBlobLink() {
    /* Make the scrubbed data available for download as a blob. */
    var blob = new Blob([JSON.stringify(mv.parser.records)]);
    var a = d3.select('body').append('a');
    a
      .text("Scrubbed records")
      .attr("download", "map.scrubbed")
      .attr("href", window.URL.createObjectURL(blob))
    ;
  }
  function parseScrubbed(scrubbedRecords) {
    scrubbedRecords = JSON.parse(scrubbedRecords);
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
    mv.parser.records = mv.parser.records.concat(scrubbedRecords);
  }
  return mv;
}(mv || {});
