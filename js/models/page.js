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

      return Object.keys(_this.children)
        .map(valueFromKeyIn(_this.children))
        .sort(orderByOrderKey);
    });

    this.route = ko.computed(function() {
      return app.router.getRouteToPage(_this);
    });

    this.url = ko.computed(function() {
      return app.router.prefix + _this.route();
    });

    this.completed = ko.computed(function() {
      app._dummyObservable();
      if (_this.type() === 'category') {
        return _this.childrenArr().reduce(function(prevValue, item) {
          if (!item.completed() && !item.optional()) {
            return false;
          } else {
            return prevValue;
          }
        }, true);
      }

      if (_this.type() === 'item') {
        var userData = app.storage.getUserData(_this.route());
        return userData && userData.completed;
      }
    });
  };

  function orderByOrderKey(item1, item2) {
    // protect against invalid items from before the data is loaded
    if (!item1.order || !item2.order) {
      return 0;
    }

    if (item1.order() < item2.order()) {
      return -1;
    } else if (item1.order() > item2.order()) {
      return 1;
    } else {
      console.error('Two children have the same order weight. Their order is ' +
        'not guaranteed:', item1, item2);
      return 0;
    }
  }

  // takes an array and returns a function that takes keys and
  // returns values from the original array
  function valueFromKeyIn(arr) {
    return function(key) {
      return arr[key];
    };
  }
})(rr);
