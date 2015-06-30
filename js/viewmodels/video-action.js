var rr = rr || {};

(function(app) {
  var vm = app.vm || {};
  app.vm = vm;

  // vm.videoVM = {};
  // var vvm = vm.videoVM;

  // Video Actions show a modal with a youtube player
  app.actions.VideoAction = $.extend(Object.create(app.Action), {
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

})(rr);
