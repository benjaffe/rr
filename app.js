var rr = rr || {};

(function(app) {
  // Initial data
  var vm;
  var model = {
    name: 'Loading',
    children: []
  };
  var nodeData = new app.model.Node(model, undefined);

  // Our ViewModel
  app.vm = vm = {
    // the hierarchy of our current page and its parents
    nodeHierarchy: ko.observable([])
  };

  vm.getUrl = function(node) {
    return '#/' + app.router.getUrlToNode(node);
  };

  vm.currentHashLink = ko.computed(function() {
    return '#/' + app.router.currentRoute();
  });

  vm.selectedNode = ko.computed(function() {
    var selectedNode = vm.nodeHierarchy().reduce(function(orig, key) {
      if (!orig || !orig.children) {
        return undefined;
      }
      console.log(orig.children[key]);
      return orig.children && orig.children[key] ? orig.children[key] : null;
    }, nodeData);

    console.log(selectedNode);

    return selectedNode || {
      name: 'Invalid Route'
    };
  });

  vm.nodeHierarchyObjects = ko.computed(function() {
    var stuff = vm.nodeHierarchy().map(function(nodeName, index, arr) {
      return vm.getNodeFromUrl(arr.slice(0, index + 1));
    });
    return stuff;
  });

  vm.getNodeFromUrl = function(urlParts) {
    var node = urlParts.reduce(function(orig, key) {
      if (!orig || !orig.children) {
        return undefined;
      }
      console.log(orig.children[key]);
      return orig.children && orig.children[key] ? orig.children[key] : null;
    }, nodeData);

    console.log('--');
    console.log(urlParts);
    console.log(node);
    return node;
  };

  vm.displayChildren = ko.computed(function() {
    return vm.selectedNode().childrenArr &&
        vm.selectedNode().childrenArr().length;
  });

  // Load RR Data
  $.getJSON('https://readreflect.firebaseio.com/rrs.json', function(data) {
    // convert all the children nodes to actual arrays
    // model = convertChildrenToArray(data);
    model = data;

    // create new Nodes from the data
    nodeData = new app.model.Node(model, false);

    init();
  });



  function init() {
    app.router.updateRoute();
    $(window).bind('hashchange', app.router.updateRoute);
  }

  ko.applyBindings(vm);

})(rr);
