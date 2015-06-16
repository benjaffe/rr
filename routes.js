var rr = rr || {};

(function(app) {
  var router;
  app.router = app.router || {};
  router = app.router;

  router.currentRoute = ko.observable();

  app.router.updateRoute = function() {
    var hash = sanitizeHash(location.hash);

    var routes = hash.split('/');
    if (!routes[routes.length - 1]) {
      routes.pop();
    }
    console.log(routes);

    console.log('current hash' + hash);
    router.currentRoute(hash);
    app.vm.selectedNodePath(routes);
  };

  app.router.getPath = function(node) {
    if (!node || !node.parent) {
      return null;
    } else if (!node.parent.parent) {
      return node.key;
    } else {
      return router.getPath(node.parent) + '/' + node.key;
    }
  };

  // Removes # and prefix
  function sanitizeHash(hash) {
    var prefix = '#/';

    if (!hash) {
      return '';
    }

    // remove the #
    hash = (hash[0] === '#' ? hash.slice(1) : hash);
    prefix = (prefix[0] === '#' ? prefix.slice(1) : prefix);

    // remove trailing slashes
    hash = (hash.slice(-1) === '/' ? hash.slice(0, -1) : hash);

    if (hash.slice(0, prefix.length) === prefix) {
      return hash.slice(prefix.length);
    }

    return hash;
  }

})(rr);
