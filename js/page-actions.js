var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;
  vm.currentActionName = ko.observable('');

  var actionQueue = [];
  var currentAction = null;

  app.pageActions = app.pageActions || {};
  var pageActions = app.pageActions;
  var i = 0;

  var Action = {
    run: function() {
      console.debug('running ' + this.type, this);
      vm.currentActionName(this.type);
      this._run.apply(this, arguments);
    },
    cleanup: function() {
      if (this.hasRun) {
        return false;
      }
      this.hasRun = true;

      console.debug('cleaning up ' + this.type, this);

      this._cleanup.apply(currentAction, arguments);
      vm.currentActionName('');
      markActionAsDoneAndContinue();
    }
  };

  var actions = {};

  // custom actions have no default _run and _cleanup functions
  actions.CustomAction = $.extend(Object.create(Action), {});

  actions.NavigateAction = $.extend(Object.create(Action), {
    name: 'NavigateAction',
    _run: function(cleanup) {
      var self = this;
      console.log('NAVIGATING', this, this.options);
      // ------

      var modal = $('#iframe-modal').modal('show');
      console.log('yo', $('#iframe-modal'));
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

  actions.VideoAction = $.extend(Object.create(Action), {
    name: 'VideoAction',
    _run: function(cleanup) {
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

  pageActions.cleanupAndStop = function() {
    actionQueue = [];
    if (currentAction) {
      currentAction.cleanup();
    }
  };

  pageActions.addAction = function(type, options) {
    var Action = actions[type] || actions.custom;
    var action = Object.create(Action);
    console.log(action);

    // ship the options with the page action
    action.options = options;
    action.type = type;

    if (!action.run || !action.cleanup) {
      throw new Error('PageAction must have a run and cleanup function');
    }
    action.uid = i++;

    actionQueue.push(action);
  };

  function markActionAsDoneAndContinue() {
    currentAction = null;
    pageActions.startActions();
  }

  pageActions.startActions = function() {
    if (currentAction) {
      return false;
    }

    currentAction = actionQueue.shift();
    // console.debug('starting', JSON.stringify(actionQueue), JSON.stringify(currentAction));
    if (currentAction) {
      currentAction.run.call(currentAction);
    }
  };

})(rr);
