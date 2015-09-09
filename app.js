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
    var sanitizedPath = path.replace(/\//g, '-');
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

  // if we don't remember visiting any nodes, set that tracking up
  if (!localStorage.nodeVisitCount) {
    localStorage.nodeVisitCount = 0;
  }

  // track the visit counts as the user uses the app
  vm.nodeVisitCount = ko.observable(JSON.parse(localStorage.nodeVisitCount));

  vm.nodeVisitCount.subscribe(function(val) {
    // when the visit count changes:
    // update our persistent storage
    localStorage.nodeVisitCount = JSON.stringify(val);

    // show the feedback form if they've visited 2 nodes
    if (val === 2) {
      showFeedbackForm();
    }
  });

  function showFeedbackForm() {
    setTimeout(function() {
      $('#feedback-modal').modal('show');
    }, 500);
  }

  vm.hasCompletedFeedback = ko.observable(
    localStorage.hasCompletedFeedback ? true : false);

  vm.feedbackFormSubmitted = function() {
    feedbackFormCompleted();
  };

  vm.feedbackFormSkipped = function() {
    feedbackFormCompleted();
  };

  function feedbackFormCompleted() {
    $('#feedback-modal').modal('hide');
    setTimeout(function() {
      vm.hasCompletedFeedback(true);
    });
  }

  // -------- //

  function init() {
    console.debug('Initializing...');
    $(window).bind('hashchange', app.router.updateRoute);
    app.router.updateRoute();
  }

  // Load RR Data
  $.getJSON('data.json', function(data) {
    var sanitizedData = sanitizeData(data);

    // create new Pages from the data
    app.storage.setRRData(new app.model.Page(sanitizedData, false));

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

    });

    pageActions.push(page.actions);

    pageActions.startActions();


  });

  // when youtube api is ready, take us one step closer to initializing the app
  window.onYouTubeIframeAPIReady = function() {
    deferred.youtubeReady.resolve();
  };

  function sanitizeData(data) {
    if (data.type === 'category') {
      if (typeof data.name === 'undefined' ||
          typeof data.description === 'undefined' ||
          typeof data.children === 'undefined') {
        console.error('a category is missing a key: ', data);
        return null;
      }
    } else if (data.type === 'item') {
      if (typeof data.name === 'undefined' ||
          typeof data.topic === 'undefined' ||
          typeof data.description === 'undefined' ||
          typeof data.timeEstimate === 'undefined' && !data.optional ||
          typeof data.navigateTo === 'undefined') {
        console.error('an item is missing a key: ', data);
        return null;
      }
    } else {
      // object has no key `type`
      console.error('an object has no type:', data);
      return null;
    }

    if (data.type === 'category') {
      var newChildren = {};
      Object.keys(data.children).forEach(function(key){
        var newChild = sanitizeData(data.children[key]);
        if (newChild) {
          newChildren[key] = newChild;
        }
      });
      data.children = newChildren;
    }

    return data;
  }

})(rr);
