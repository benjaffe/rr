var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;

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
  var Action = {
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
  var actions = {};

  // Custom Actions have no default _run and _cleanup functions. Those
  // functions will need to be passed in by the user when they create
  // the Custom Action
  actions.CustomAction = $.extend(Object.create(Action), {});

  // Navigate Actions open a modal and show an iframe with the content
  actions.NavigateAction = $.extend(Object.create(Action), {
    name: 'NavigateAction',
    _run: function() {
      var self = this;

      var modal = $('#iframe-modal').modal('show');
      modal.on('hidden.bs.modal', function(e) {
        self.cleanup({modal: false});
      });
    },
    _cleanup: function(options) {
      if (!(options && options.modal === false)) {
        // remove the backdrop manually, since bootstrap keeps it around
        // when a new modal opens during the removal of the previous one
        $('.modal-backdrop').fadeOut(function() {
          this.remove();
        });
        $('#video-modal').modal('hide');
      }

      app.vm.currentPage().pageState.set({linkVisited: true});
    }
  });

  // Navigate to another R&R
  actions.RRNavigateAction = $.extend(Object.create(Action), {
    name: 'RRNavigateAction',
    _run: function() {
      var self = this;

      if (this.options.dest === 'back') {
        history.go(-1);
      } else if (this.options.dest === '../') {
        // TODO: properly handle this case
        history.go(-1);
      } else {
        // TODO: add app.router.navigateTo() and use it here
        location.hash = app.router.prefix + this.dest;
      }
    }
  });

  // Display the Discourse View
  actions.ForumAction = $.extend(Object.create(Action), {
    name: 'ForumAction',
    discussionForumUrl: 'https://discussions.udacity.com',
    _run: function() {
      var self = this;
      var topicUrl = this.discussionForumUrl + '/t/' + self.options.forumKey;
      var authUrl = 'https://www.udacity.com/account/sso/discourse';
      self.options.forumUrl = ko.observable(topicUrl);

      console.debug(self);
      console.debug(topicUrl);

      self.loadForumData({
        topicUrl: topicUrl,
        forumKey: self.options.forumKey
      });

      // var modal = $('#forum-modal').modal('show');
      // modal.on('hidden.bs.modal', function(e) {
      //   self.cleanup({modal: false});
      // });
    },
    loadForumData: function(options) {
      var self = this;
      $.ajax({
        url: options.topicUrl + '.json',
        xhrFields: {
          withCredentials: true
        }
      }).success(function(data) {
        console.debug(data);
        vm.forumDataRaw(data);
        self.openForumModal();
      }).error(function(res) {
        // TODO: distinguish between (being logged out) and (page not existing)
        vm.forumDataRaw(null);
        if (res.readyState === 4) {
          console.debug('Page was not found: ' + options.topicUrl);
          if (!options.retry) {
            self.createTopic(options);
            return;
          }
        } else if (res.readyState === 0) {
          console.debug('Access denied: ' + options.topicUrl);
        } else {
          console.debug('An error occurred, readyState = ' + res.readyState + '. The discussion url is ' + options.topicUrl);
        }
        console.debug('Response', res);
        self.openErrorModal();
      });
    },
    createTopic: function(options) {
      var self = this;

      console.debug('attempting to create the topic');
      $.ajax({
        url: self.discussionForumUrl + '/session/csrf.json',
        xhrFields: {
          withCredentials: true
        }
      }).success(function(data) {
        var csrf = data.csrf;

        options.retry = true;

        $.ajax('https://discussions.udacity.com/posts.json', {
          type: 'POST',
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true,
          data: {
            'authenticity_token': csrf,
            'title': options.forumKey,
            'raw': 'Add your thoughts about this article!',
            'category': 758,
            is_warning:false,
            archetype:'regular',
            nested_post:true
          }
        }).success(function(msg) {
          console.debug('Topic was successfully created!', arguments);
          self.loadForumData(options);
        }).error(function(msg) {
          console.debug('Topic could not be created.', arguments);
          self.loadForumData(options);
        });

      });
    },
    openForumModal: function() {
      var self = this;

      var modal = $('#forum-modal').modal('show');
      modal.on('hidden.bs.modal', function(e) {
        self.cleanup({modal: false});
      });
    },
    openErrorModal: function() {
      var self = this;

      var modal = $('#forum-error-modal').modal('show');
      modal.on('hidden.bs.modal', function(e) {
        self.cleanup({modal: false});
      });
    },
    _cleanup: function(options) {
      // TODO: what is this conditional for?
      if (!(options && options.modal === false)) {
        // remove the backdrop manually, since bootstrap keeps it around
        // when a new modal opens during the removal of the previous one
        $('.modal-backdrop').fadeOut(function() {
          this.remove();
        });
        $('#forum-error-modal').modal('hide');
      }

      // app.vm.currentPage().pageState.set({linkVisited: true});
    }
  });

  // Video Actions show a modal with a youtube player
  actions.VideoAction = $.extend(Object.create(Action), {
    name: 'VideoAction',
    _run: function() {
      var self = this;

      // show the modal
      var modal = $('#video-modal').modal('show');

      // initialize a youtube player
      app.youtubePlayer = new YT.Player('youtube-player', {
        height: '390',
        width: '640',
        videoId: this.options.videoId,
        playerVars: {
          autoplay: true,
          // controls: 0,
          rel: 0,
          showinfo: 0
        },
        events: {
          'onStateChange': onPlayerStateChange
        }
      });

      // When video ends, finish the page action
      function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
          self.cleanup();
        }
      }

      // when modal is hidden, destroy the video and finish the page action.
      // (Since the modal is closed already, pass in parameters to tell our
      // cleanup function to skip that functionality)
      modal.on('hidden.bs.modal', function(e) {
        app.youtubePlayer.destroy();
        self.cleanup({modal: false});
      });
    },

    _cleanup: function(options) {
      if (!(options && options.modal === false)) {
        // remove the backdrop manually, since bootstrap keeps it around
        // when a new modal opens during the removal of the previous one
        $('.modal-backdrop').fadeOut(function() {
          this.remove();
        });
        $('#video-modal').modal('hide');
      }
    }
  });

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
    var Action = actions[type] || actions.custom;
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
