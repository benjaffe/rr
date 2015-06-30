var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;

  vm.navigateVM = {};
  var nvm = vm.navigateVM;

  // === Navigate Action === //
  nvm.self = ko.observable();

  nvm.gotoArticle = function() {
    // TODO: Am I making use of what's being passed in here? Is there a
    // better way to handle things? Can I use passed arguments rather than
    // referencing things directly?
    console.log(arguments);
    window.open(vm.currentPage().navigateTo(), '_blank')
    nvm.self().cleanup();
  };

  nvm.skipArticle = function() {
    nvm.self().cleanup();
  };

  app.actions.NavigateAction = $.extend(Object.create(app.Action), {
    name: 'NavigateAction',
    _run: function() {
      var self = this;
      nvm.self(self);
    },
    _cleanup: function(options) {
      // TODO: replace with call to app.storage
      app.vm.currentPage().pageState.set({linkVisited: true});
    }
  });

  // Navigate to another R&R
  app.actions.RRNavigateAction = $.extend(Object.create(app.Action), {
    name: 'RRNavigateAction',
    _run: function() {
      var self = this;

      if (this.options.dest === 'back') {
        history.go(-1);
      } else if (this.options.dest === '../') {
        // TODO: properly handle this case
        history.go(-1);
      } else {
        // TODO: add app.router.navigateTo() and use it here
        location.hash = app.router.prefix + this.dest;
      }
    }
  });

})(rr);
