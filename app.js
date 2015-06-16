var Node = function(config, parent) {
  var _this = this;
  var mappingOptions = {
    children: {
      create: function(args) {
        console.log(args);
        console.log('creating node ', args.data);
        var children = [];
        Object.keys(args.data).forEach(function(key) {
          console.log(args.data[key]);
          var child = new Node(args.data[key], _this);
          child.key = key;
          children.push(child);
        });
        console.log(children);
        return children;
      }
    }
  };

  ko.mapping.fromJS(config, mappingOptions, this);

  this.parent = parent;
  this.childrenArr = ko.computed(function() {
    if (!_this.children) {
      return [];
    }

    return Object.keys(_this.children).map(valueFromKeyIn(_this.children));
  });
};

// Load RR Data
$.getJSON('https://readreflect.firebaseio.com/rrs.json', function(data) {
  // convert all the children nodes to actual arrays
  // myModel = convertChildrenToArray(data);
  myModel = data;

  // create new Nodes from the data
  viewModel.nodeData = new Node(myModel, false);

  init();
});

// takes an array and returns a function that takes keys and
// returns values from the original array
function valueFromKeyIn(arr) {
  return function(key) {
    return arr[key];
  };
}

// Initial data
var myModel = {
  name: 'Loading',
  children: []
};

// Our ViewModel
var viewModel = {

  nodeData: new Node(myModel.node, undefined),

  selectedNodePath: ko.observable([]),
  currentRoute: ko.observable(),

  stack: [],

};

viewModel.selectedNode = ko.computed(function() {
  var selectedNode = viewModel.selectedNodePath().reduce(function(orig, key) {
    if (!orig.children) {
      return undefined;
    }
    return orig.children && orig.children[key] ? orig.children[key] : undefined;
  }, viewModel.nodeData);

  console.log(selectedNode);

  return selectedNode || {
    name: 'Invalid Route'
  };
});

function init() {
  updateRoute();
}

ko.applyBindings(viewModel);
