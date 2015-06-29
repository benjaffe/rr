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

// From https://github.com/isaacs/json-stringify-safe/blob/master/stringify.js
(function(namespace) {
  function stringify(obj, replacer, spaces, cycleReplacer) {
    spaces = spaces || 2;
    return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
  }

  function serializer(replacer, cycleReplacer) {
    var stack = [], keys = []

    if (cycleReplacer == null) cycleReplacer = function(key, value) {
      if (stack[0] === value) return "[Circular ~]"
      return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
    }

    return function(key, value) {
      if (stack.length > 0) {
        var thisPos = stack.indexOf(this)
        ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
        ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
        if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
      }
      else stack.push(value)

      return replacer == null ? value : replacer.call(this, key, value)
    }
  }

  namespace.stringify = stringify;

})(rr.utils);
