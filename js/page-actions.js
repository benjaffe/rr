var rr = rr || {};

(function(app) {

  var actionQueue = [];
  var currentAction = null;

  app.pageActions = app.pageActions || {};
  var pageActions = app.pageActions;

  function PageAction(options) {
    if (!options.run || !options.cleanup) {
      throw new Error('PageAction must have a run and cleanup function');
    }
    $.extend(this, options);
  }

  pageActions.cleanupAndStop = function() {
    actionQueue = [];
    if (currentAction) {
      currentAction.cleanup();
    }
  };

  pageActions.addAction = function(options) {
    var originalCleanup = options.cleanup;
    options.cleanup = function() {
      if (this.hasRun) {
        return false;
      }
      this.hasRun = true;

      originalCleanup.apply(this, arguments);
      markActionAsDone();
    };

    actionQueue.push(new PageAction(options));
  };

  function markActionAsDone() {
    currentAction = null;
    pageActions.startActions();
  }

  pageActions.startActions = function() {
    if (currentAction) {
      return false;
    }

    currentAction = actionQueue.shift();
    if (currentAction) {
      currentAction.run.call(currentAction);
    }
  };

})(rr);
