$(window).bind('hashchange', updateRoute);

function updateRoute(e) {
  var hash = sanitizeHash(location.hash);

  var routes = hash.split('/');
  if (!routes[routes.length-1]) {
    routes.pop();
  }
  console.log(routes);

  console.log("current hash " + hash);
  viewModel.currentRoute(hash);
  viewModel.selectedNodePath(routes);
}

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
