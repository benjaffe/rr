var rr = rr || {};
rr.utils = rr.utils || {};

// Should be executed BEFORE any hash change has occurred.
(function(namespace) { // Closure to protect local variable "var hash"
  if ('replaceState' in history) { // Yay, supported!
    namespace.replaceHash = function(newhash) {
      if (('' + newhash).charAt(0) !== '#') newhash = '#' + newhash;
      history.replaceState('', '', newhash);
    };
  } else {
    var hash = location.hash;
    namespace.replaceHash = function(newhash) {
      if (location.hash !== hash) history.back();
      location.hash = newhash;
    };
  }
})(rr.utils);
