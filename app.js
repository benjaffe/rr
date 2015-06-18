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

  app.storage.setRRData(new app.model.Page(model, undefined));

  // Our ViewModel
  app.vm = vm = {};

  vm.getUrl = function(page) {
    return '#/' + app.router.getUrlToPage(page);
  };

  vm.getPageFromUrl = function(urlParts) {
    var route = urlParts.join('/');
    return app.storage.getRRData(route);
  };

  // array of strings representing the hierarchy of our current page pages and
  // their parents
  vm.pageHierarchy = ko.computed(function() {
    return app.router.currentRoute().split('/');
  });

  // array of pointers to our current page pages and their parents, with their
  // hierarchy maintained
  vm.pageHierarchyObjects = ko.computed(function() {
    var arrayOfParentPages = vm.pageHierarchy().map(function(name, index, arr) {
      return vm.getPageFromUrl(arr.slice(0, index + 1));
    });
    return arrayOfParentPages;
  });

  // our current route as a link
  // TODO: not currently used
  vm.currentHashLink = ko.computed(function() {
    return app.router.prefix + app.router.currentRoute();
  });

  // the currently-selected page page
  vm.currentPage = ko.computed(function() {
    var route = vm.pageHierarchy().join('/');
    return app.storage.getRRData(route) || new app.model.Page({
      name: 'Invalid Route',
      msg: 'route is ' + route +
            ', and pageData = ' + app.storage.pageData
    }, undefined);
  });

  // a computed boolean of whether the current page should show its children
  vm.displayChildren = ko.computed(function() {
    return vm.currentPage().type && vm.currentPage().type() === 'category';
  });

  // a computed boolean of whether the current page should show item content
  vm.displayItem = ko.computed(function() {
    return vm.currentPage().type && vm.currentPage().type() === 'item';
  });

  // -------- //

  function init() {
    console.log('Initializing...');
    app.router.updateRoute();
    $(window).bind('hashchange', app.router.updateRoute);
  }

  // Load RR Data
  $.getJSON('data2.json', function(data) {
    // create new Pages from the data
    app.storage.setRRData(new app.model.Page(data, false));

    // when data is loaded, take us one step closer to initializing the app
    deferred.dataLoaded.resolve();
  });

  ko.applyBindings(vm);

  vm.currentPage.subscribe(function(page) {

    // clear page state
    page.pageState.clear();

    // add an intro video to the page action queue
    if (page.introVideo) {
      app.pageActions.addAction({
        run: function(cleanup) {
          var self = this;
          // show the modal
          var modal = $('#video-modal').modal('show');

          // initialize a youtube player
          app.youtubePlayer = new YT.Player('youtube-player', {
            height: '390',
            width: '640',
            videoId: vm.currentPage().introVideo.src(),
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

        cleanup: function(options) {
          if (!(options && options.modal === false)) {
            // remove the backdrop manually, since bootstrap keeps it around
            // when a new modal opens during the removal of the previous one
            $('.modal-backdrop').fadeOut(function() {
              this.remove();
            });
            $('#video-modal').modal('hide');
          }
        },
      });
    }

    // add a navigate-to-resource to the page action queue
    if (page.navigateTo) {
      app.pageActions.addAction({
        run: function(cleanup) {
          window.open(page.navigateTo(), '_blank');
          setTimeout(this.cleanup, 5000);
        },
        cleanup: function() {
          app.vm.currentPage().pageState.set({linkVisited: true});
        }
      });
    }
    app.pageActions.startActions();
  });

  // when youtube api is ready, take us one step closer to initializing the app
  window.onYouTubeIframeAPIReady = function() {
    deferred.youtubeReady.resolve();
  };

})(rr);

