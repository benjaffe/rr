var rr = rr || {};

(function(app) {
  app.model = app.model || {};

  // Model
  app.model.Node = function(config, parent) {
    var _this = this;
    var mappingOptions = {
      children: {
        create: function(args) {
          var children = {};
          var child;
          for (var key in args.data) {
            if (args.data.hasOwnProperty(key)) {
              child = new app.model.Node(args.data[key], _this);
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

  // takes an array and returns a function that takes keys and
  // returns values from the original array
  function valueFromKeyIn(arr) {
    return function(key) {
      return arr[key];
    };
  }
})(rr);
