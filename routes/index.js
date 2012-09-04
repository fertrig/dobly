var Conversation = require('../models/conversation'),
    Thread = require('../models/thread'),
    Message = require('../models/message'),
    users = require('../models/users'),
    Preference = require('../models/thread_preference');

exports.index = function(req, res){
  res.render('index', { title: 'my chat app', users: users });
};

exports.log_in = function(req, res){
  	req.session.user = users.find(req.body.userId);
  	res.redirect('/conversations');
};

exports.getConversations = function(req, res){
	Conversation.find(function(err, conversations){
		res.render('conversations', { conversations: conversations,
									  title: 'conversations'});
	});
}

exports.postConversation = function(req, res){
	var conversation = new Conversation();
	var mainThread = new Thread();

	var title = new Message();
	title.content = req.body.topic;
	title.user.id = req.session.user.id;
	title.user.name = req.session.user.name;
	
	mainThread.messages.push(title);
	conversation.threads.push(mainThread);
	conversation.save();

	res.redirect('/conversations/' + conversation.id + '/threads');
}

exports.openConversation = function(req, res){
	var conversation = Conversation.findById(req.params.id, function(err, conversation){
		var userPreferences;
		Preference.find({ 'userId': req.session.user.id, 'conversationId':conversation._id }, function(err, preferences){
			res.render('threads', { title: 'threads',
    						 	conversation: JSON.stringify(conversation),
    						 	preferences: JSON.stringify(preferences) });
		});
	});
}

exports.getMessages = function(req, res){
	var conversation = Conversation.findById(req.params.id, function(err, conversation){
		thread = conversation.threads.id(req.params.threadId);
		res.json(thread.messages);
	});
}