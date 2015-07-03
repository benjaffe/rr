var rr = rr || {};

(function(app) {
  app.model = app.model || {};

  // Model
  app.model.Page = function(config, parent) {
    var _this = this;
    var mappingOptions = {
      children: {
        create: function(args) {
          var children = {};
          var child;
          for (var key in args.data) {
            if (args.data.hasOwnProperty(key)) {
              child = new app.model.Page(args.data[key], _this);
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
    this.pageState = ko.observable({});
    this.hasInit = ko.observable(false);
    this.pageState.set = function(options) {
      $.extend(_this.pageState(), options);
      _this.pageState.valueHasMutated();
    };

    this.pageState.clear = function() {
      _this.pageState({});
    };

    this.childrenArr = ko.computed(function() {
      if (!_this.children) {
        return [];
      }

      return Object.keys(_this.children).map(valueFromKeyIn(_this.children));
    });

    this.route = ko.computed(function() {
      return app.router.getRouteToPage(_this);
    });

    this.url = ko.computed(function() {
      return app.router.prefix + _this.route();
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
