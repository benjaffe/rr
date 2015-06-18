var rr = rr || {};

(function(app) {
  var router;
  app.router = app.router || {};
  router = app.router;

  var prefix = '#/';
  var cleanPrefix = prefix.replace(/^#/, '');

  router.prefix = prefix;

  router.currentRoute = ko.observable('');

  // TODO: when prefix is omitted, things still work fine
  app.router.updateRoute = function() {
    var cleanHash = sanitizeHash(location.hash);
    var routes = cleanHash.split('/');

    if (/\/$/.test(location.hash)) {
      app.utils.replaceHash(cleanPrefix + cleanHash);
    }

    // stop any current and future page actions because we're leaving this page
    app.pageActions.cleanupAndStop();

    router.currentRoute(cleanHash);
  };

  app.router.getUrlToNode = function(node) {
    if (node === window || !node || !node.parent) {
      return null;
    } else if (!node.parent.parent) {
      return node.key;
    } else {
      return router.getUrlToNode(node.parent) + '/' + node.key;
    }
  };

  // Removes # and prefix
  function sanitizeHash(hash) {

    if (!hash) {
      return '';
    }

    // remove the #
    hash = hash.replace(/^\#/, '');

    // remove trailing slashes
    hash = hash.replace(/\/$/, '');

    // remove prefix
    if (hash.slice(0, cleanPrefix.length) === cleanPrefix) {
      return hash.slice(cleanPrefix.length);
    }

    return hash;
  }

})(rr);
