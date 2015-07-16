var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;

  app.page = app.page || {};

  app.page.init = function(page) {
    if (page.hasInit()) {
      return false;
    }

    // === Read Page === //

    page.articleHasBeenOpenedDuringVisit = ko.observable(false);
    page.forumHasBeenOpenedDuringVisit = ko.observable(false);
    page.hasNavigated = ko.observable(false);
    page.showingArticle = ko.observable(page.type() === 'item');
    page.showingForum = ko.observable(false);

    // TODO: This will become important after the cookie issue is resolved
    //   Make sure the button highlighting (ie. user attention) is properly handled
    page.hasReflected = ko.observable(false);

    page.reset = function() {
      page.showArticle();
      page.articleHasBeenOpenedDuringVisit(false);
      page.forumHasBeenOpenedDuringVisit(false);

      if (page.forumData) {
        page.replyingToPost(null);
      }
    };

    page.openArticle = function(page) {
      page.articleHasBeenOpenedDuringVisit(true);
      window.open(page.navigateTo(), '_blank');
    };

    page.openForum = function(page) {
      console.log('boom');
      page.forumHasBeenOpenedDuringVisit(true);
      window.open(vm.currentPageForumUrl(), '_blank');
    }

    page.markArticleAsRead = function() {
      page.hasNavigated(true);
      page.showForum();
    };

    page.markArticleAsUnread = function() {
      page.hasNavigated(false);
      app.storage.setUserData(page.route(), {completed: false});
    };

    page.showArticle = function() {
      if (page.type() === 'item') {
        page.showingArticle(true);
        page.showingForum(false);
      }
    };

    page.showForum = function() {
      if (page.type() === 'item') {
        page.showingArticle(false);
        page.showingForum(true);
      }
    };

    page.gotoParent = function() {
      if (!page.parent) {
        return false; // we're at the top
      }

      if (page.parent.url()) {
        app.router.navigateToPage(page.parent.url());
      }

      if (page.type() === 'item' && page.hasNavigated()) {
        setTimeout(function() {
          page.reset();
          app.storage.setUserData(page.route(), {completed: true});
        }, 1000);
      }
    };

    // === Forum Page === //
    addForumStuff(page);

    // Our page has now initialized
    page.hasInit(true);
  };

  function addForumStuff(page) {
    page.forumUrl = ko.observable();
    page.forumDataRaw = ko.observable();

    page.forumData = ko.computed(function() {
      if (!page.forumDataRaw()) {
        return {
          post_stream: {
            posts: []
          }
        };
      }
      return page.forumDataRaw();
    });

    page.replyingToPost = ko.observable(null);
    page.repliedToPost = ko.observable(null);
    page.replyContent = ko.observable('Hey, this is a sample reply. ' +
      'Looks good, I hope...');

    page.replyToPost = function(post) {
      page.replyingToPost(post);
      console.log(post);
      console.log(post.topic_id);
    };

    page.cancelReplyToPost = function() {
      page.replyingToPost(null);
    };

    page.sendReplyToPost = function(post) {
      var postId = post.topic_id;

      $.ajax('https://discussions.udacity.com/posts.json', {
        type: 'POST',
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true,
        data: {
          'authenticity_token': app.csrf,
          'raw': page.replyContent(),
          'topic_id': postId,
          'is_warning': false,
          'nested_post': true
        }
      }).success(function(msg) {
        console.debug('Reply was successfully posted!', arguments);
        console.log(arguments);
        page.repliedToPost(post.id);
        page.replyingToPost(null);
        page.loadForumData({
          topicUrl: page.forumUrl()
        });
        page.hasReflected(true);
      }).error(function(msg) {
        // TODO: Handle reply failure visually
        console.debug('Reply could not be posted.', arguments);
        console.log(arguments);
      });
    };

    page.loadForumData = function(options) {
      var self = this;
      $.ajax({
        url: options.topicUrl + '.json',
        xhrFields: {
          withCredentials: true
        }
      }).success(function(data) {
        page.forumDataRaw(data); // TODO: abstract this out

      }).error(function(res) {
        if (res.readyState === 4) {
          console.debug('Page was not found: ' + options.topicUrl);
          if (!options.retry) {
            self.createTopic(options);
            return;
          }
        } else if (res.readyState === 0) {
          console.debug('Access denied: ' + options.topicUrl);
          page.forumDataRaw(null);
        } else {
          console.debug('An error occurred, readyState = ' + res.readyState + '. The discussion url is ' + options.topicUrl);
          page.forumDataRaw(null);
        }
        console.debug('Response', res);
      });
    };

    var discussionForumUrl = 'https://discussions.udacity.com';

    // get a fresh csrf so we can post (and let's only do it once)
    if (!app.csrf) {
      $.ajax({
        url: discussionForumUrl + '/session/csrf.json',
        xhrFields: {
          withCredentials: true
        }
      }).success(function(data) {
        app.csrf = data.csrf;
        console.log('csrf acquired: ' + app.csrf);
        localStorage.csrf = app.csrf;
      });
    }

    app.csrf = localStorage.csrf || '';

    this.forumKey = page.route().replace('/', '-');
    var topicUrl = discussionForumUrl + '/t/' + this.forumKey;
    var authUrl = 'https://www.udacity.com/account/sso/discourse';
    page.forumUrl(topicUrl);

    page.loadForumData({
      topicUrl: topicUrl
    });

    page.createTopic = function(options) {
      var self = this;

      console.debug('attempting to create the topic');

      options.retry = true;

      $.ajax('https://discussions.udacity.com/posts.json', {
        type: 'POST',
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true,
        data: {
          'authenticity_token': app.csrf,
          'title': self.forumKey,
          'raw': 'Add your thoughts about this article!',
          'category': 758,
          is_warning:false,
          archetype:'regular',
          nested_post:true
        }
      }).success(function(msg) {
        console.debug('Topic was successfully created!', arguments);
        page.loadForumData(options);
      }).error(function(msg) {
        console.debug('Topic could not be created.', arguments);
        page.loadForumData(options);
      });
    };

    // app.vm.currentPage().pageState.set({linkVisited: true});
  }

})(rr);
