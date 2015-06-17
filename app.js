var rr = rr || {};

(function(app) {
  // Initial data
  var vm;
  var model = {
    name: 'Loading',
    children: [],
    type: 'item'
  };

  app.storage.setRRData(new app.model.Node(model, undefined));

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
    var route = vm.nodeHierarchy().join('/');
    return app.storage.getRRData(route) || new app.model.Node({
      name: 'Invalid Route',
      msg: 'route is ' + route +
            ', and nodeData = ' + app.storage.nodeData
    }, undefined);
  });

  vm.nodeHierarchyObjects = ko.computed(function() {
    var arrayOfParentNodes = vm.nodeHierarchy().map(function(name, index, arr) {
      return vm.getNodeFromUrl(arr.slice(0, index + 1));
    });
    return arrayOfParentNodes;
  });

  vm.getNodeFromUrl = function(urlParts) {
    var route = urlParts.join('/');
    return app.storage.getRRData(route);
  };

  vm.displayChildren = ko.computed(function() {
    return vm.selectedNode().type && vm.selectedNode().type() === 'category';
  });

  vm.displayItem = ko.computed(function() {
    return vm.selectedNode().type && vm.selectedNode().type() === 'item';
  });

  // Load RR Data
  $.getJSON('data2.json', function(data) {
    // convert all the children nodes to actual arrays
    // model = convertChildrenToArray(data);
    model = data;

    // create new Nodes from the data
    app.storage.setRRData(new app.model.Node(model, false));

    init();
  });



  function init() {
    app.router.updateRoute();
    $(window).bind('hashchange', app.router.updateRoute);
  }

  ko.applyBindings(vm);

})(rr);
