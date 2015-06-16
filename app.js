var Node = function(config, parent) {
  this.parent = parent;
  var _this = this;

  var mappingOptions = {
    children: {
      create: function(args) {
        return new Node(args.data, _this);
      }
    }
  };

  ko.mapping.fromJS(config, mappingOptions, this);
};

// $.getJSON('https://readreflect.firebaseio.com/rrs.json', function(data) {

// }

var myModel = {
  node: {
    name: 'Root',
    children: [
      {
        name: 'Child 1',
        back: 1,
        children: [
          {
            name: 'Child 1_1',
            back: 1,
            children: [
              {
                name: 'Child 1_1_1',
                back: 4,
                children: []
              },
              {
                name: 'Child 1_1_2',
                back: 2,
                children: []
              },
              {
                name: 'Child 1_1_3',
                back: 1,
                children: []
              }
            ]
          }
        ]
      },
      {
        name: 'Child 2',
        back: 1,
        children: [
          {
            name: 'Child 2_1',
            back: 1,
            children: []
          },
          {
            name: 'Child 2_2',
            back: 1,
            children: []
          }
        ]
      }
    ]
  }
};

var viewModel = {

  nodeData: new Node(myModel.node, undefined),

  selectedNode: ko.observable(myModel.node),

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

window.nodeViewModel = viewModel;
ko.applyBindings(viewModel);
