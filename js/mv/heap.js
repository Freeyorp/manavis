var mv = function(mv) {
  mv.heap = function() {
    var heap = {};
    heap.init = function() {
      function a(p, d) { return { e: p.e + d.e, j: p.j + d.j, r: p.r + 1 }; }
      function s(p, d) { return { e: p.e - d.e, j: p.j - d.j, r: p.r - 1 }; }
      function z(p, d) { return { e: 0, j: 0, r: 0 }; }
      heap.cfdata = crossfilter(mv.parser.records);
      heap.all = heap.cfdata.groupAll().reduce(a, s, z);
      monoGroup("date", function(d) { return d3.time.hour.round(d.date); });
      monoGroup("pc", function(d) { return d.pc; });
      monoGroup("map", function(d) { return d.map; }).reduce(a, s, z);
      monoGroup("blvl", function(d) { return d.pcstat ? d.pcstat.blvl : 0; });
      monoGroup("type", function(d) { return d.type; });
      monoGroup("target", function(d) { return d.target; });
      monoGroup("wpn", function(d) { return d.wpn; })
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
