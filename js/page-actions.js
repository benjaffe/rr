var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;

  vm.forumVM = {};
  var fvm = vm.forumVM;

  var actionQueue = [];

  var pageActions = app.pageActions || {};
  app.pageActions = pageActions;

  var pageActionIndexCounter = 0;

  var currentAction = ko.observable(null);

  pageActions.currentAction = currentAction;
  pageActions.currentActionName = ko.observable('');

  // All Page Actions have a run function and an optional cleanup function
  // which do some pre and post processing, then run the associated _run or
  // _cleanup functions (which belong to objects for whom Action is their
  // prototype.
  app.Action = {
    run: function() {
      // skip actions that have already run
      if (this.hasRun && this.options.runOnce) {
        console.debug('skipping ' + this.type, this);
        markActionAsDoneAndContinue();
        return;
      }

      console.debug('running ' + this.type, this);

      // update the vm so the view can update
      pageActions.currentActionName(this.type);

      // run the function
      this._run.apply(this, arguments);
    },
    cleanup: function() {
      // TODO: this conditional shouldn't need to be duplicated
      //        can it be safely removed?
      if (this.hasRun && this.options.runOnce) {
        return false;
      }
      this.hasRun = true;

      console.debug('cleaning up ' + this.type, this);

      if (this._cleanup) {
        this._cleanup.apply(currentAction(), arguments);
      }
      pageActions.currentActionName('');
      markActionAsDoneAndContinue();
    }
  };

  // This is a hash of all the different actions we support
  app.actions = {};

  // Custom Actions have no default _run and _cleanup functions. Those
  // functions will need to be passed in by the user when they create
  // the Custom Action
  app.actions.CustomAction = $.extend(Object.create(app.Action), {});

  // Run the cleanup function for the current action, and don't run the next
  pageActions.cleanupAndStop = function() {
    actionQueue = [];
    if (currentAction()) {
      currentAction().cleanup();
    }
  };

  // This method creates actions when called with a type and options.
  // Type-specific options are listed above by each type declaration.
  // Always-supported options are:
  //   [runOnce]: boolean - if true, the action will only run one time
  pageActions.createAction = function(type, options) {
    var Action = app.actions[type] || app.actions.custom;
    var action = Object.create(Action);

    // ship the options with the page action
    action.options = options;
    action.type = type;

    // TODO: Implement custom actions
    if (!action.run || !action.cleanup) {
      throw new Error('PageAction must have a run and cleanup function');
    }
    action.uid = pageActionIndexCounter++;

    return action;
  };

  // Adds actions to the actionQueue. Accepts actions either as an array,
  // or as multiple arguments. (The actionQueue will always be a shallow array)
  pageActions.push = function(actions) {
    if (arguments[0] instanceof Array) {
      Array.prototype.push.apply(actionQueue, actions);
    } else {
      Array.prototype.push.apply(actionQueue, arguments);
    }
  };

  // Reset the current action to null, and move onto the next action
  function markActionAsDoneAndContinue() {
    currentAction(null);
    pageActions.startActions();
  }

  // remove the first action in the queue, and run it. It will return early if
  // currentAction is set to something. This is because every action is
  // resposible for cleaning up after itself, and we're defensively treating
  // every action as necessarily mutually independant, so we can't start the
  // next action unless the cleanup function for the previous action is called,
  // (which resets currentAction to null)
  pageActions.startActions = function() {
    if (currentAction()) {
      return false;
    }

    currentAction(actionQueue.shift() || null);
    if (currentAction()) {
      currentAction().run.call(currentAction());
    }
  };

})(rr);
