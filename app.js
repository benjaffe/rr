var Node = function(config, parent) {
  var _this = this;
  var mappingOptions = {
    children: {
      create: function(args) {
        var children = {};
        var child;
        for (var key in args.data) {
          if (args.data.hasOwnProperty(key)) {
            child = new Node(args.data[key], _this);
            child.key = key;
            children[key] = (child);
          }
        }
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

viewModel.getUrl = function(node) {
  return '#' + getPath(node);
};

function getPath(node) {
  if (!node.parent) {
    return '';
  } else {
    return getPath(node.parent) + '/' + node.key;
  }
}

viewModel.currentHashLink = ko.computed(function() {
  return '#/' + viewModel.currentRoute();
});

viewModel.selectedNode = ko.computed(function() {
  console.log(viewModel.selectedNodePath());
  console.log(viewModel.nodeData);
  var selectedNode = viewModel.selectedNodePath().reduce(function(orig, key) {
    if (!orig || !orig.children) {
      return undefined;
    }
    console.log(orig.children[key]);
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
