var mv = function(mv) {
  mv.heap = function() {
    var heap = {};
    var statGran = 10;
    heap.init = function() {
      function ea(p, d) { p.e += d.e; p.j += d.j; p.r++; return p; }
      function es(p, d) { p.e -= d.e; p.j -= d.j; p.r--; return p; }
      function ez(p, d) { return { e: 0, j: 0, r: 0 }; }
      heap.cfdata = crossfilter(mv.parser.records);
      heap.all = heap.cfdata.groupAll().reduce(ea, es, ez);
      monoGroup("date", function(d) { return d3.time.hour.round(d.date); });
      monoGroup("pc", function(d) { return d.pc; });
      monoGroup("map", function(d) { return d.map; }).reduce(ea, es, ez);
      monoGroup("blvl", function(d) { return d.pcstat ? d.pcstat.blvl : 0; });
      monoGroup("type", function(d) { return d.type; });
      monoGroup("target", function(d) { return d.target; });
      monoGroup("wpn", function(d) { return d.wpn; });
      function sa(p, d) {
        if (!d.pcstat) return p;
        p.str[d.pcstat.str]++ || (p.str[d.pcstat.str] = 1);
        p.agi[d.pcstat.agi]++ || (p.agi[d.pcstat.agi] = 1);
        p.vit[d.pcstat.vit]++ || (p.vit[d.pcstat.vit] = 1);
        p.dex[d.pcstat.dex]++ || (p.dex[d.pcstat.dex] = 1);
        p.int[d.pcstat.int]++ || (p.int[d.pcstat.int] = 1);
        p.luk[d.pcstat.luk]++ || (p.luk[d.pcstat.luk] = 1);
        return p;
      }
      function ss(p, d) {
        if (!d.pcstat) return p;
        --p.str[d.pcstat.str] || (p.str[d.pcstat.str] = undefined);
        --p.agi[d.pcstat.agi] || (p.agi[d.pcstat.agi] = undefined);
        --p.vit[d.pcstat.vit] || (p.vit[d.pcstat.vit] = undefined);
        --p.dex[d.pcstat.dex] || (p.dex[d.pcstat.dex] = undefined);
        --p.int[d.pcstat.int] || (p.int[d.pcstat.int] = undefined);
        --p.luk[d.pcstat.luk] || (p.luk[d.pcstat.luk] = undefined);
        return p;
      }
      function sz(p, d) { return { str: [], agi: [], vit: [], dex: [], int: [], luk: [] }; }
      monoGroup("str", function(d) { return d.pcstat ? d.pcstat.str : 0; }).reduce(sa, ss, sz);
      monoGroup("agi", function(d) { return d.pcstat ? d.pcstat.agi : 0; }).reduce(sa, ss, sz);
      monoGroup("vit", function(d) { return d.pcstat ? d.pcstat.vit : 0; }).reduce(sa, ss, sz);
      monoGroup("dex", function(d) { return d.pcstat ? d.pcstat.dex : 0; }).reduce(sa, ss, sz);
      monoGroup("int", function(d) { return d.pcstat ? d.pcstat.int : 0; }).reduce(sa, ss, sz);
      monoGroup("luk", function(d) { return d.pcstat ? d.pcstat.luk : 0; }).reduce(sa, ss, sz);
      /* Debugging group */
      /*
       * How well defined a record is.
       *  0 -> Record contains undefined data
       *  1 -> Record is defined, but undefined records follow and may impede validity of findings
       *  2 -> Record and all succeeding records are well defined
       */
      monoGroup("def", function(d) { if (d.pcstat == undefined) { return 0; } if (d.date <= mv.parser.fullyDefinedCutoff()) { return 1; } return 2; });
      heap.def.dim.filterExact(2);
    }
    function monoGroup(name, mapping) {
      heap[name] = {};
      return heap[name].group = (heap[name].dim = heap.cfdata.dimension(mapping)).group();
    }
    return heap;
  }();
  return mv;
}(mv || {});
