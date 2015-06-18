var rr = rr || {};

(function(app) {
  // Initial data
  var vm;
  var model = {
    name: 'Loading',
    children: [],
    type: 'item'
  };
  // var actionQueue = [];
  // var currentAction = null;
  var deferred = {
    youtubeReady: $.Deferred(),
    dataLoaded: $.Deferred()
  };

  $.when(deferred.youtubeReady, deferred.dataLoaded).done(init);

  app.storage.setRRData(new app.model.Node(model, undefined));

  // Our ViewModel
  app.vm = vm = {};

  vm.getUrl = function(node) {
    return '#/' + app.router.getUrlToNode(node);
  };

  vm.getNodeFromUrl = function(urlParts) {
    var route = urlParts.join('/');
    return app.storage.getRRData(route);
  };

  // array of strings representing the hierarchy of our current page nodes and
  // their parents
  vm.nodeHierarchy = ko.computed(function() {
    return app.router.currentRoute().split('/');
  });

  // array of pointers to our current page nodes and their parents, with their
  // hierarchy maintained
  vm.nodeHierarchyObjects = ko.computed(function() {
    var arrayOfParentNodes = vm.nodeHierarchy().map(function(name, index, arr) {
      return vm.getNodeFromUrl(arr.slice(0, index + 1));
    });
    return arrayOfParentNodes;
  });

  // our current route as a link
  // TODO: not currently used
  vm.currentHashLink = ko.computed(function() {
    return app.router.prefix + app.router.currentRoute();
  });

  // the currently-selected page node
  vm.selectedNode = ko.computed(function() {
    var route = vm.nodeHierarchy().join('/');
    return app.storage.getRRData(route) || new app.model.Node({
      name: 'Invalid Route',
      msg: 'route is ' + route +
            ', and nodeData = ' + app.storage.nodeData
    }, undefined);
  });

  // a computed boolean of whether the current page should show its children
  vm.displayChildren = ko.computed(function() {
    return vm.selectedNode().type && vm.selectedNode().type() === 'category';
  });

  // a computed boolean of whether the current page should show item content
  vm.displayItem = ko.computed(function() {
    return vm.selectedNode().type && vm.selectedNode().type() === 'item';
  });

  // -------- //

  function init() {
    console.log('Initializing...');
    app.router.updateRoute();
    $(window).bind('hashchange', app.router.updateRoute);
  }

  // Load RR Data
  $.getJSON('data2.json', function(data) {
    // create new Nodes from the data
    app.storage.setRRData(new app.model.Node(data, false));

    // initialize our app
    deferred.dataLoaded.resolve();
  });

  ko.applyBindings(vm);

  vm.selectedNode.subscribe(function(node) {

    // add an intro video to the page action queue
    if (node.introVideo) {
      app.pageActions.addAction({
        run: function(cleanup) {
          var self = this;
          // show the modal
          var modal = $('#video-modal').modal('show');

          // initialize a youtube player
          app.youtubePlayer = new YT.Player('youtube-player', {
            height: '390',
            width: '640',
            videoId: vm.selectedNode().introVideo.src(),
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

          // when modal is hidden, finish the page action. (Since the modal is
          // closed already, pass in parameters to tell our cleanup function to
          // skip that functionality)
          modal.on('hidden.bs.modal', function(e) {
            self.cleanup({modal: false});
          });
        },
        cleanup: function(options) {
          app.youtubePlayer.destroy();
          if (options && options.modal === false) {
            $('#video-modal').modal('hide');
          }
        },
      });
    }

    // add a navigate-to-resource to the page action queue
    if (node.navigateTo) {
      app.pageActions.addAction({
        run: function(cleanup) {
          window.open(node.navigateTo(), '_blank');
          setTimeout(this.cleanup, 5000);
        },
        cleanup: function() {
          console.log('hi');
        }
      });
    }
    app.pageActions.startActions();
  });

  window.onYouTubeIframeAPIReady = function() {
    deferred.youtubeReady.resolve();
  };

})(rr);

