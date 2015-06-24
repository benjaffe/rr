var rr = rr || {};

(function(app) {
  // Our ViewModel
  var vm = app.vm || {};
  app.vm = vm;

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

  $.when(deferred.youtubeReady, deferred.dataLoaded).done(init);

  app.storage.setRRData(new app.model.Page(model, undefined));

  vm.getUrl = function(page) {
    return '#/' + app.router.getUrlToPage(page);
  };

  vm.getPageFromUrl = function(urlParts) {
    var route = urlParts.join('/');
    return app.storage.getRRData(route);
  };

  vm.currentActionName = app.pageActions.currentActionName;

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
    return app.storage.getRRData(route);
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
  $.getJSON('data.json', function(data) {
    // create new Pages from the data
    app.storage.setRRData(new app.model.Page(data, false));

    // when data is loaded, take us one step closer to initializing the app
    deferred.dataLoaded.resolve();
  });

  ko.applyBindings(vm);

  vm.currentPage.subscribe(function(page) {
    var pageActions = app.pageActions;
    // clear page state
    // page.pageState.clear();

    if (!page.actions) {
      page.actions = [];
      // add an intro video to the page action queue
      if (page.introVideo) {
        page.actions.push(pageActions.createAction('VideoAction', {
          page: page,
          videoId: page.introVideo.src(),
          runOnce: page.introVideo.runOnce()
        }));
      }

      // add a navigate-to-resource to the page action queue
      if (page.navigateTo) {
        page.actions.push(pageActions.createAction('NavigateAction', {
          page: page
        }));
      }

    }

    pageActions.push(page.actions);

    pageActions.startActions();

  });

  // when youtube api is ready, take us one step closer to initializing the app
  window.onYouTubeIframeAPIReady = function() {
    deferred.youtubeReady.resolve();
  };

})(rr);

