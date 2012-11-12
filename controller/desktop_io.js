var Desktop = require('../models/desktop');

exports.add = function(socket, data){
    updateDesktop(socket, function(desktop){
        if(desktop.conversations.indexOf(data.conversationId) < 0){
            desktop.conversations.push(data.conversationId);            
        }
    });
}

exports.remove = function(socket, data){
    updateDesktop(socket, function(desktop) {
        var index = desktop.conversations.indexOf(data.conversationId);
        desktop.conversations.splice(index, 1);
    });
}

function updateDesktop(socket, update){
    Desktop.findOne( { userId: socket.handshake.session.user.id }, function(err, desktop){
        update(desktop);
        desktop.save();
    });
}