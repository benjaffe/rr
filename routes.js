var rr = rr || {};

(function(app) {
  var router;
  app.router = app.router || {};
  router = app.router;

  router.currentRoute = ko.observable();

  app.router.updateRoute = function() {
    var cleanHash = sanitizeHash(location.hash);
    var routes = cleanHash.split('/');

    router.currentRoute(cleanHash);
    app.vm.nodeHierarchy(routes);
  };

  app.router.getUrlToNode = function(node) {
    if (!node || !node.parent) {
      return null;
    } else if (!node.parent.parent) {
      return node.key;
    } else {
      return router.getUrlToNode(node.parent) + '/' + node.key;
    }
  };

  // Removes # and prefix
  function sanitizeHash(hash) {
    var prefix = '#/';

    if (!hash) {
      return '';
    }

    // remove the #
    hash = hash.replace(/^\#/, '');
    prefix = prefix.replace(/^\#/, '');

    // remove trailing slashes
    hash = hash.replace(/\/$/, '');

    // remove prefix
    if (hash.slice(0, prefix.length) === prefix) {
      return hash.slice(prefix.length);
    }

    return hash;
  }

})(rr);
