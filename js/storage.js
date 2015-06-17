var rr = rr || {};

(function(app) {

  var storage = app.storage = {};
  var userData = {
    'backbone': {
      'watchedVideo': false
    }
  };

  var rrData;

  /**
   * Returns user data for a specified route
   * @param  {string} route [description]
   * @return {object}       the user data
   */
  storage.getUserData = function(route) {
    return storage[route] || null;
  };

  /**
   * Sets user data at a specified route, merging with previous data
   * @param  {string} route: the associated route
   * @param  {string} data: the data to be set
   */
  storage.setUserData = function(route, data) {
    var currentValue = app.storage.getUserData(route) || {};
    $.extend(currentValue, data);
    storage[route] = currentValue;
  };

  /**
   * Returns RR data for a specified route
   * @param  {string} route: the associated route
   * @return {object}        the data for the node
   */
  storage.getRRData = function(route) {
    var nodeHierarchy = route.split('/');
    var selectedNode = nodeHierarchy.reduce(function(orig, key) {
      if (!orig || !orig.children) {
        return undefined;
      }
      if (key === '') {
        return orig;
      }
      return orig.children && orig.children[key] ? orig.children[key] : null;
    }, rrData);

    return selectedNode;
  };

  /**
   * Sets RR data (does not merge -- wipes everything away)
   * @param {object} data: the data to set
   */
  storage.setRRData = function(data) {
    rrData = data;
  };

})(rr);
