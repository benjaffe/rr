var rr = rr || {};

(function (app) {
  // Initial data
  var vm;
  var model = {
    name: 'Loading',
    children: []
  };

  // Our ViewModel
  app.vm = vm = {
    nodeData: new app.model.Node(model, undefined),
    selectedNodePath: ko.observable([]),
    stack: [],
  };

  vm.getUrl = function(node) {
    return '#/' + app.router.getPath(node);
  };

  vm.currentHashLink = ko.computed(function() {
    return '#/' + app.router.currentRoute();
  });

  vm.selectedNode = ko.computed(function() {
    console.log(vm.selectedNodePath());
    console.log(vm.nodeData);
    var selectedNode = vm.selectedNodePath().reduce(function(orig, key) {
      if (!orig || !orig.children) {
        return undefined;
      }
      console.log(orig.children[key]);
      return orig.children && orig.children[key] ? orig.children[key] : undefined;
    }, vm.nodeData);

    console.log(selectedNode);

    return selectedNode || {
      name: 'Invalid Route'
    };
  });

  vm.displayChildren = ko.computed(function(){
    return vm.selectedNode().childrenArr
        && vm.selectedNode().childrenArr().length;
  });

  // Load RR Data
  $.getJSON('https://readreflect.firebaseio.com/rrs.json', function(data) {
    // convert all the children nodes to actual arrays
    // model = convertChildrenToArray(data);
    model = data;

    // create new Nodes from the data
    vm.nodeData = new app.model.Node(model, false);

    init();
  });



  function init() {
    app.router.updateRoute();
    $(window).bind('hashchange', app.router.updateRoute);
  }

  ko.applyBindings(vm);

})(rr);
