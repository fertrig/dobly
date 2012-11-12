function createViewModel(data, desktopData) {
  var self = {};

  self.newConversationTopic = ko.observable('');
  
  self.conversations = ko.observableArray([]);
  for(var i = 0; i < data.length; i++){
    self.conversations.push(createConversation(data[i]));
  }

  self.desktop = createDesktop(desktopData, self.conversations());

  self.addNewConversation = function(data, event) {
    var keyCode = (event.which ? event.which : event.keyCode);
    if (keyCode === 13) {
      addConversation();
      self.toggleNewConversation();
      self.newConversationTopic('');
      return false;
    } else {
      return true;
    }
  };
  
  self.toggleNewConversation = function (){
    $('#newConversation').modal('toggle');
    setTimeout(function () { $('#newConversation input').focus(); }, 400);
  }

  function addConversation() {
    socket.emit('create_conversation', { topic: self.newConversationTopic(), conversationId: self.id });
  };

  socket.on('conversation_added', function(data){
    var conversation = createConversation(data);
    self.conversations.push(conversation);
    self.desktop.add(conversation);
  });

  socket.on('receive_message', function(data) {
    ko.utils.arrayForEach(self.conversations(), function(conversation){
      if(data.conversationId === conversation.id){
        conversation.receiveMessage(data);
        self.adjustScrolling();
      }
    });
  });

  self.adjustScrolling = function (){
    $(".nano").nanoScroller({ scroll: 'bottom' });
  }

  self.showAll = {
    toggle: function(){
      $('#allConversations').modal('toggle');
    },

    open: function(conversation){
      self.showAll.toggle();
      self.desktop.addAndFocus(conversation);
    }
  }

  self.otherConversations = {
    open: function (conversation){
      self.desktop.addAndFocus(conversation);
    },

    list: ko.computed(function(){
      return self.conversations().filter(function(el){
        return self.desktop.conversations().indexOf(el) < 0;
      });
    })
  }

  return self;
}