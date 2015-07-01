var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;

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
