$(window).bind('hashchange', updateRoute);

function updateRoute(e) {
  var hash = sanitizeHash(location.hash);

  var routes = hash.split('/');

  // rr.load
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

  if (hash.slice(0, prefix.length) === prefix) {
    return hash.slice(prefix.length);
  }

  return hash;
}
