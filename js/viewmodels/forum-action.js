var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;

  vm.forumVM = {};
  var fvm = vm.forumVM;

  // === Forum Action === //
  fvm.self = ko.observable();
  fvm.forumUrl = ko.observable();
  fvm.forumDataRaw = ko.observable(undefined);

  fvm.forumData = ko.computed(function() {
    if (!fvm.forumDataRaw()) {
      console.log(':(');
      return {
        post_stream: {
          posts: []
        }
      }
    }
    console.log('coo');
    return fvm.forumDataRaw();
  });

  fvm.replyingToPost = ko.observable(null);
  fvm.replyContent = ko.observable('Hey, this is a sample reply. Looks good, I hope...');

  fvm.replyToPost = function(post) {
    fvm.replyingToPost(post);
    console.log(post);
    console.log(post.topic_id);
  }

  fvm.cancelReplyToPost = function() {
    fvm.replyingToPost(null);
  }

  fvm.sendReplyToPost = function(post) {
    var post = fvm.replyingToPost();
    var postId = post.topic_id;

    $.ajax('https://discussions.udacity.com/posts.json', {
      type: 'POST',
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      data: {
        'authenticity_token': app.csrf,
        'raw': fvm.replyContent(),
        'topic_id': postId,
        is_warning:false,
        nested_post:true
      }
    }).success(function(msg) {
      console.debug('Reply was successfully posted!', arguments);
      console.log(arguments);
      fvm.replyingToPost(null);
      fvm.loadForumData({
        topicUrl: fvm.forumUrl()
      });
    }).error(function(msg) {
      console.debug('Reply could not be posted.', arguments);
      console.log(arguments);
    });
  }

  fvm.loadForumData = function(options) {
    var self = fvm.self();
    $.ajax({
      url: options.topicUrl + '.json',
      xhrFields: {
        withCredentials: true
      }
    }).success(function(data) {
      console.debug(data);
      fvm.forumDataRaw(data); // TODO: abstract this out
      self.openForumModal();

      // get csrf so we can post
      $.ajax({
        url: self.discussionForumUrl + '/session/csrf.json',
        xhrFields: {
          withCredentials: true
        }
      }).success(function(data) {
        app.csrf = data.csrf;
        console.log('csrf acquired: ' + app.csrf);
        localStorage.csrf = app.csrf;
      });

    }).error(function(res) {
      if (res.readyState === 4) {
        console.debug('Page was not found: ' + options.topicUrl);
        if (!options.retry) {
          self.createTopic(options);
          return;
        }
      } else if (res.readyState === 0) {
        console.debug('Access denied: ' + options.topicUrl);
        fvm.forumDataRaw(null);
      } else {
        console.debug('An error occurred, readyState = ' + res.readyState + '. The discussion url is ' + options.topicUrl);
        fvm.forumDataRaw(null);
      }
      console.debug('Response', res);
      self.openErrorModal();
    });
  };

  if (localStorage.csrf) {
    app.csrf = localStorage.csrf;
  }
  app.actions.ForumAction = $.extend(Object.create(app.Action), {
    name: 'ForumAction',
    discussionForumUrl: 'https://discussions.udacity.com',
    _run: function() {
      var self = this;
      var topicUrl = this.discussionForumUrl + '/t/' + self.options.forumKey;
      var authUrl = 'https://www.udacity.com/account/sso/discourse';
      var fvm = vm.forumVM;
      fvm.self(self);
      fvm.forumUrl(topicUrl);

      console.debug(self);
      console.debug(topicUrl);

      fvm.loadForumData({
        topicUrl: topicUrl
      });

      // var modal = $('#forum-modal').modal('show');
      // modal.on('hidden.bs.modal', function(e) {
      //   self.cleanup({modal: false});
      // });
    },
    createTopic: function(options) {
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
          'title': options.forumKey,
          'raw': 'Add your thoughts about this article!',
          'category': 758,
          is_warning:false,
          archetype:'regular',
          nested_post:true
        }
      }).success(function(msg) {
        console.debug('Topic was successfully created!', arguments);
        fvm.loadForumData(options);
      }).error(function(msg) {
        console.debug('Topic could not be created.', arguments);
        fvm.loadForumData(options);
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
})(rr);
