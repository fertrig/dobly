define(['jquery', 'jquery-ui'], function($){
    'use strict';
    
    return function (desktop){
        var self = {};

        self.resize = (function () {
            var res = {};

            res.stripAndLists = function() {
                var includeMargin = true;
                var bodyHeight = $('body').outerHeight(includeMargin);
                var headerHeight = $('#header').outerHeight(includeMargin);
                var listsMargin = $('#lists').outerHeight(includeMargin) - $('#lists').innerHeight();

                var height = bodyHeight - headerHeight - listsMargin;
                $('#lists').height(height);
                $('#strip').height(height);
            };

            res.listBodies = function() {
                if (desktop.hasLeftCollaborationObject()) {
                    desktop.leftCollaborationObject().ui.resizeBody();
                }
            
                if (desktop.hasRightCollaborationObject()) {
                    desktop.rightCollaborationObject().ui.resizeBody();
                }
            };

            function tiles() {    
                var stripHeight = $('#strip').outerHeight();
                var newTileHeight = $('#new-list-tile').outerHeight();
                var newMesageBar = $('#new-message-bar').outerHeight();

                $('#tiles').height(stripHeight - newTileHeight - newMesageBar);
            }

            res.tilesAndListBodies = function() {
                res.listBodies();
                tiles();
            };

            return res;
        })();

        self.scroll = (function () {
            var scr = {};

            scr.setup = function() {
                scr.setupLists();
                scr.tiles();
            };

            scr.setupLists = function(){
                if (desktop.hasLeftCollaborationObject()) {
                    desktop.leftCollaborationObject().ui.scroll.setup();
                }
            
                if (desktop.hasRightCollaborationObject()) {
                    desktop.rightCollaborationObject().ui.scroll.setup();
                }
            };

            scr.tiles = function() {
                $('#tiles').nanoScroller({ sliderMaxHeight: 300, alwaysVisible: true });
            };

            scr.bottomTile = function() {
                $('#tiles').nanoScroller({ scroll: 'bottom' });
            };

            return scr;
        })();

        self.highlight = function(){
            var leftObs = desktop.leftCollaborationObject;
            var rightObs = desktop.rightCollaborationObject;

            setTimeout(function(){
                if (desktop.hasLeftCollaborationObject() && leftObs().unreadCounter() > 0) {
                    leftObs().ui.highlight(leftObs().unreadCounter());
                }
            
                if (desktop.hasRightCollaborationObject() && rightObs().unreadCounter() > 0) {
                    rightObs().ui.highlight(rightObs().unreadCounter());
                }
            }, 200);
        };

        self.setupStripDragAndDrop = function (){
            var currentSort;

            $('#tiles .content').sortable({      
                handle: ".icon-move-handle",
                start: function(event, ui){
                    currentSort = { startIndex: ui.item.index(), stopIndex: -1 };
                },
                stop: function(event, ui){
                    currentSort.stopIndex = ui.item.index();

                    if (currentSort.startIndex !== currentSort.stopIndex) {
                        app.socket.emit('update_strip_order', { id: desktop.id, currentSort: currentSort });
                        var collaborationObject = desktop.collaborationObjects()[currentSort.startIndex];
                        reorder(collaborationObject);
                        if (collaborationObject.active()) {
                            desktop.changeActiveCollaborationObjects(currentSort.stopIndex);
                        }
                        else {
                            checkIfItNeedsToBeActivated();
                        }
                    }
                },
            });

            function reorder(collaborationObject) {      
                desktop.collaborationObjects.splice(currentSort.startIndex, 1);
                desktop.collaborationObjects.splice(currentSort.stopIndex, 0, collaborationObject);
            }

            function checkIfItNeedsToBeActivated() {
                var leftActiveIndex = desktop.collaborationObjects.indexOf(desktop.leftCollaborationObject());

                if (movedAfterActiveCollaborationObject(leftActiveIndex)) {
                    desktop.changeActiveCollaborationObjects(leftActiveIndex);
                }

                function movedAfterActiveCollaborationObject(leftActiveIndex){
                    return leftActiveIndex + 1 === currentSort.stopIndex;
                }
            }

            $('#tiles').disableSelection();
        };

        self.setup = function(){
            self.resize.stripAndLists();
            self.setupStripDragAndDrop();
        };

        self.updateCollaborationObjectUi = function(){
            self.resize.listBodies();
            self.scroll.setupLists();
            self.highlight();
        };

        self.show = function(){
            self.resize.tilesAndListBodies();
            self.scroll.setup();
            self.setupStripDragAndDrop();
        };

        return self;
    };
});

