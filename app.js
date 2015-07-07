var rr = rr || {};

(function(app) {
  // Our ViewModel
  var vm = app.vm || {};
  app.vm = vm;
  var memoryHierarchy = [];

  app._dummyObservable = ko.observable();

  // Initial data
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

  // TODO: Display loading screen until this happens!
  $.when(deferred.youtubeReady, deferred.dataLoaded).done(init);

  app.storage.setRRData(new app.model.Page(model, undefined));

  vm.getPageFromUrl = function(urlParts) {
    var route = urlParts.join('/');
    return app.storage.getRRData(route);
  };

  vm.currentActionName = app.pageActions.currentActionName;
  vm.currentAction = app.pageActions.currentAction;
  console.log(vm.currentAction.toString());

  // array of strings representing the hierarchy of our current page pages and
  // their parents
  vm.pageHierarchy = ko.computed(function() {
    return app.router.currentRoute().split('/');
  });

  // array of pointers to our current page pages and their parents, with their
  // hierarchy maintained
  vm.pageObjHierarchy = ko.computed(function() {
    var arrayOfParentPages = vm.pageHierarchy().map(function(name, index, arr) {
      return vm.getPageFromUrl(arr.slice(0, index + 1));
    });
    return arrayOfParentPages;
  });

  // array of pointers to our current page pages and their parents, with their
  // hierarchy maintained, and all data persisted unless overwritten by index.
  // In other words, this is list of all routes we have loaded, with no
  // unloading until we go to a different route at the same depth.
  vm.pageObjHierarchyPersistent = ko.computed(function() {
    var currentHierarchy = vm.pageObjHierarchy();
    memoryHierarchy.length = Math.max(currentHierarchy.length, memoryHierarchy.length);
    for (var i = 0; i < currentHierarchy.length; i++) {

      if (memoryHierarchy[i] !== currentHierarchy[i]) {
        memoryHierarchy[i] = currentHierarchy[i];
        memoryHierarchy.length = i + 1;
      }
    }
    return memoryHierarchy;
  });

  vm.currentPageHierarchyIndex = ko.computed(function() {
    return vm.pageObjHierarchy().length - 1;
  }).extend({rateLimit: { timeout: 0, method: "notifyWhenChangesStop" }});

  // our current route as a link
  // TODO: not currently used
  vm.currentHashLink = ko.computed(function() {
    return app.router.prefix + app.router.currentRoute();
  });

  // the currently-selected page page
  vm.currentPage = ko.computed(function() {
    var route = vm.pageHierarchy().join('/');
    return app.storage.getRRData(route);
  });

  vm.currentPageForumUrl = ko.computed(function() {
    var urlPrefix = 'https://discussions.udacity.com/t/';
    var path = app.router.currentRoute();
    var sanitizedPath = path.replace(/\//, '-');
    return sanitizedPath ? urlPrefix + sanitizedPath : '';
  });

  vm.pageTitle = ko.computed(function(){
    if (vm.currentPage().type() === 'category') {
      return vm.currentPage().name();
    }

    if (vm.currentPage().type() === 'item') {
      if (vm.currentPage().hasInit() &&
          vm.currentPage().hasNavigated()) {
        return 'Time to Reflect';
      } else {
        return 'Time to Read';
      }
    }

    return '';
  });

  // -------- //

  function init() {
    console.debug('Initializing...');
    $(window).bind('hashchange', app.router.updateRoute);
    app.router.updateRoute();
  }

  // Load RR Data
  $.getJSON('data.json', function(data) {
    // create new Pages from the data
    app.storage.setRRData(new app.model.Page(data, false));

    // when data is loaded, take us one step closer to initializing the app
    deferred.dataLoaded.resolve();
  });

  ko.applyBindings(vm);

  // when we navigate to a page, create it and add all the actions
  vm.currentPage.subscribe(function(page) {
    var pageActions = app.pageActions;
    // clear page state
    // page.pageState.clear();

    // initialize the page and its children
    app.page.init(page);

    page.childrenArr().forEach(function(page){

      app.page.init(page);

      if (!page.actions) {
        page.actions = [];
      }
      // add an intro video to the page action queue
      // if (page.introVideo) {
      //   page.actions.push(pageActions.createAction('VideoAction', page, {
      //     videoId: page.introVideo.src(),
      //     runOnce: page.introVideo.runOnce && page.introVideo.runOnce()
      //   }));
      // }

      // if (page.type() === 'item' && page.finalDestination !== false) {
      //   page.actions.push(pageActions.createAction('RRNavigateAction', page, {
      //     dest: page.finalDestination || '../'
      //   }));
      // }

    });

    pageActions.push(page.actions);

    pageActions.startActions();


  });

  // when youtube api is ready, take us one step closer to initializing the app
  window.onYouTubeIframeAPIReady = function() {
    deferred.youtubeReady.resolve();
  };

})(rr);
