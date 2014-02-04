define(['jquery', 'knockout', 'socket-io', 'client/viewModel', 'client/timeout', 'client/group', 'client/routing'], 
        function($, ko, io, createViewModel, createTimeout, createGroup, routing) {
    'use strict';
    
    (function(global){
        global.app = {};

        var maxReconnects = 5;

        global.app.socket = io.connect(global.location.origin, {
            'max reconnection attempts': maxReconnects,
            'sync disconnect on unload': true
        });

        $(global)
            .focus(function() {
                global.app.inFocus = true;
            })
            .blur(function() {
                global.app.inFocus = false;
            })
            .resize(function() {
                global.app.desktop.ui.resize.stripAndCollaborationObjects();
                global.app.desktop.ui.resize.tilesAndCollaborationObjectBodies();
            });

        function start(){
            global.app.user = JSON.parse(document.getElementById('currentUser').value);
            global.app.inFocus = true;

            var desktopData = JSON.parse(document.getElementById('desktop').value);
            var collaborationObjectsData = JSON.parse(document.getElementById('collaborationObjects').value);
            var groupData = JSON.parse(document.getElementById('group').value);
            
            global.app.group = createGroup(groupData);
            routing.bind();

            var viewModel = createViewModel(collaborationObjectsData, desktopData, groupData);

            ko.applyBindings(viewModel);
            global.app.desktop = viewModel.desktop;

            initUi();
            
            var timeout = createTimeout(maxReconnects, global);
            timeout.startPing();
        }

        function initUi(){
            routing.routeTo('desktop');
            global.app.desktop.ui.setup();
            showRenderedElements();
            global.app.desktop.ui.resize.tilesAndCollaborationObjectBodies();
            global.app.desktop.ui.scroll.setup();
        }

        function showRenderedElements(){
            $('#main-timer').hide();
            $('.top-links').show();
            $('#content').show();
            global.app.desktop.ui.highlight();
        }

        start();
    })(window);
});