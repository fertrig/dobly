function createConversationUi() {
  var self = {};

  self.init = function(getSelector){
    self.getSelector = getSelector;
  };

  self.resizeBody = function() {
    var convoHeight = $('#convos').innerHeight();
    var titleHeightLeft = $(self.getSelector('.convo-header')).outerHeight();
    var newMessageHeightLeft = $(self.getSelector('.convo-new-message')).outerHeight();  
    $(self.getSelector('.convo-body')).height(convoHeight - titleHeightLeft - newMessageHeightLeft);
  };

  self.scroll = (function(){
    var scroll = {};

    scroll.setup = function() {
      scroll.adjust();
      setupHoverIntent();
    };

    function setupHoverIntent() {
      var config = {
        over: thickBar,
        timeout: 1000,
        out: thinBar,
      };
      $(self.getSelector(".nano > .pane")).hoverIntent(config);
    }

    function thickBar() {
      $(this).addClass("thickBar");
      $(this).siblings(".pane").addClass("thickBar");
    }

    function thinBar() {
      $(this).removeClass("thickBar");
      $(this).siblings(".pane").removeClass("thickBar");
    }

    scroll.adjust = function() {
      $(self.getSelector('.nano')).nanoScroller({ scroll: 'bottom' });
    };

    scroll.stop = function() {
      $(self.getSelector('.nano')).nanoScroller({ stop: true });
    };

    return scroll;
  })();

  self.highlight = function(messageCount){
    $(self.getSelector('.convo-body .content .message')).slice(-messageCount).effect("highlight", {}, 1000);
  }

  return self;
}