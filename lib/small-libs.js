var rr = rr || {};
rr.utils = rr.utils || {};

// From http://stackoverflow.com/questions/9235304/how-to-replace-the-location-hash-and-only-keep-the-last-history-entry/9282379#9282379
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
