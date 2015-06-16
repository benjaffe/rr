var Node = function(config, parent) {
  this.parent = parent;
  var _this = this;


  console.log(this);

  var mappingOptions = {
    children: {
      create: function(args) {
        var node = new Node(args.data, _this);

        return node;
      }
    }
  };

  ko.mapping.fromJS(config, mappingOptions, this);

  console.log(this);
  this.foo = 'hi';
  this.childrenArr = ko.computed(function() {
    if (!this.children) {
      return null;
    }

    console.log(Object.keys(this.children).map(valueFromKeyIn(this.children)));
    return Object.keys(this.children).map(valueFromKeyIn(this.children));
  });
};

$.getJSON('https://readreflect.firebaseio.com/rrs.json', function(data) {
  // convert all the children nodes to actual arrays
  // myModel = convertChildrenToArray(data);
  myModel = data;

  // create new Nodes from the data
  viewModel.nodeData = new Node(myModel, false);

  // Start at the beginning - TODO: respond to routes
  // viewModel.selectedNodePath();
  updateRoute();
});

// converts children keys into arrays, since Firebase returns objects
function convertChildrenToArray(item) {
  if (!item.children) {
    return item;
  }
  var valueFromKey = valueFromKeyIn(item.children);
  item.children = Object.keys(item.children)
      .map(valueFromKey)
      .map(convertChildrenToArray);
  return item;
}

// takes an array and returns a function that takes keys and
// returns values from the original array
function valueFromKeyIn(arr) {
  return function(key) {
    return arr[key];
  };
}

var myModel = {
  name: 'Loading',
  children: []
};

var viewModel = {

  nodeData: new Node(myModel.node, undefined),

  selectedNodePath: ko.observable([]),

  stack: [],

  selectBackNode: function(numBack) {
      var i;
      if (this.stack.length >= numBack) {
        for (i = 0; i < numBack - 1; i++) {
          this.stack.pop();
        }
      } else {
        for (i = 0; i < this.stack.length; i++) {
          this.stack.pop();
        }
      }

      this.selectNode(this.stack.pop());
    },

  selectParentNode: function() {
    if (this.stack.length > 0) {
      this.selectNode(this.stack.pop());
    }
  },

  selectChildNode: function(node) {
    this.stack.push(this.selectedNode());
    this.selectNode(node);
  },

  selectNode: function(node) {
    this.selectedNode(node);
  }

};

viewModel.selectedNode = ko.computed(function() {
  var selectedNode = viewModel.selectedNodePath().reduce(function(orig, key) {
    if (!orig.children) {
      return undefined;
    }
    console.log(orig.childrenArr && orig.childrenArr());
    console.log(orig.foo);
    return orig.children && orig.children[key] ? orig.children[key] : undefined;
  }, myModel);

  return selectedNode || {
    name: 'Invalid Route'
  };
});

function init() {

}

ko.applyBindings(viewModel);
