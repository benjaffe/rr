var rr = rr || {};

(function(app) {
  // Initial data
  var vm;
  var model = {
    name: 'Loading',
    children: [],
    type: 'item'
  };
  var actionQueue = [];
  var currentAction = null;
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
      actionQueue.push(function(done) {
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

        // When video ends, hide modal
        function onPlayerStateChange(event) {
          if (event.data === YT.PlayerState.ENDED) {
            $('#video-modal').modal('hide');
          }
        }

        // when modal is hidden, stop video and finish the page action
        modal.on('hidden.bs.modal', function(e) {
          app.youtubePlayer.stopVideo();
          done();
        });

      });
    }

    // add a navigate-to-resource to the page action queue
    if (node.navigateTo) {
      actionQueue.push(function(done) {
        window.open(node.navigateTo(), '_blank');
        done();
      });
    }
    resumeActionQueue();
  });

  window.onYouTubeIframeAPIReady = function() {
    deferred.youtubeReady.resolve();
  };

  function markActionAsDone() {
    currentAction = null;
    resumeActionQueue();
  }

  function resumeActionQueue() {
    if (currentAction) {
      return false;
    }

    currentAction = actionQueue.shift();
    if (currentAction) {
      currentAction.call(null, markActionAsDone);
    }
  }

})(rr);

