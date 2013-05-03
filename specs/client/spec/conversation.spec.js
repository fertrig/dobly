describe("conversation", function() {

    var conversation;
    var testData;

    beforeEach(function() {
        testData = testDataConversation();
    });

    describe("creation", function() {

        it("load properties", function() {
            conversation = createConversation(testData);

            expect(conversation.id).toEqual('8');
            expect(conversation.topic()).toEqual("some topic");
            expect(conversation.createdBy()).toEqual("fernando");
            expect(conversation.unreadCounter()).toBe(1);
            expect(conversation.newMessage()).toEqual("");
            expect(conversation.isLeft()).toBe(false);
            expect(conversation.isRight()).toBe(false);
            expect(conversation.messages().length).toBe(2);
            expect(conversation.active()).toBe(false);
            expect(conversation.hasFocus()).toBe(false);
            expect(conversation.ui).toBeDefined();
            expect(conversation.timestamp).toBe(common.formatTimestamp(testData.timestamp));
        });

        it("undefined id", function() {
            testData._id = undefined;
            conversation = createConversation(testData);

            expect(conversation.id).toBe(0);
        });

        it("undefined unread", function() {
            testData.unread = undefined;
            conversation = createConversation(testData);

            expect(conversation.unreadCounter()).toBe(0);
        });

        it("pushes messages", function() {
            conversation = createConversation(testData);

            expect(conversation.messages().length).toBe(2);
            expect(conversation.messages()[0].content).toEqual("alpha");
            expect(conversation.messages()[1].content).toEqual("beta");
        });
    });

    describe("last messages", function() {
        it("3 messages", function() {
            testData.messages = [ testDataMessageAlpha(), testDataMessageBeta(), testDataMessageCharlie() ];
            conversation = createConversation(testData);

            expect(conversation.lastMessages().length).toBe(2);
            expect(conversation.lastMessages()[0].content).toBe("beta");
            expect(conversation.lastMessages()[1].content).toBe("charlie");
        });

        it("2 messages", function() {
            testData.messages = [ testDataMessageAlpha(), testDataMessageBeta() ];
            conversation = createConversation(testData);

            expect(conversation.lastMessages().length).toBe(2);
            expect(conversation.lastMessages()[0].content).toBe("alpha");
            expect(conversation.lastMessages()[1].content).toBe("beta");
        });

        it("1 messages", function() {
            testData.messages = [ testDataMessageAlpha() ];
            conversation = createConversation(testData);

            expect(conversation.lastMessages().length).toBe(1);
            expect(conversation.lastMessages()[0].content).toBe("alpha");
        });
    });

    describe("unread counter", function() {
        it("0 messages", function() {
            testData.unread = 0;
            conversation = createConversation(testData);
            expect(conversation.showUnreadCounter()).toBe(false);
        });

        it("1 message", function() {
            testData.unread = 1;
            conversation = createConversation(testData);
            expect(conversation.showUnreadCounter()).toBe(true);
        });

        it("2 messages", function() {
            testData.unread = 2;
            conversation = createConversation(testData);
            expect(conversation.showUnreadCounter()).toBe(true);
        });
    });

    describe("has focus", function() {
        it("marks as read", function() {
            testData.unread = 1;
            conversation = createConversation(testData);
            expect(conversation.unreadCounter()).toBe(1);
            app.socket = createMockSocket();

            conversation.hasFocus(true);

            expect(conversation.unreadCounter()).toBe(0);
            expect(app.socket.emit).toHaveBeenCalledWith('mark_as_read', '8');
        });

        it("does not mark as read", function() {
            testData.unread = 0;
            conversation = createConversation(testData);
            app.socket = createMockSocket();

            conversation.hasFocus(true);
            
            expect(app.socket.emit).not.toHaveBeenCalled();
        });
    });

    describe("activate", function() {

        beforeEach(function() {
            conversation = createConversation(testData);
        });

        it("on the left", function() {
            conversation.activateOnTheLeft();

            expect(conversation.isLeft()).toBe(true);
            expect(conversation.isRight()).toBe(false);
            expect(conversation.active()).toBe(true);
            expect(conversation.ui.getSelector('xyz')).toEqual('.convo-left > xyz');
        });

        it("on the right", function() {
            conversation.activateOnTheRight();

            expect(conversation.isLeft()).toBe(false);
            expect(conversation.isRight()).toBe(true);
            expect(conversation.active()).toBe(true);
            expect(conversation.ui.getSelector('xyz')).toEqual('.convo-right > xyz');
        });

        it("deactivate", function() {
            spyOn(conversation.ui.scroll, "stop");
            conversation.activateOnTheRight();

            conversation.deactivate();

            expect(conversation.ui.scroll.stop).toHaveBeenCalled();
            expect(conversation.active()).toBe(false);
            expect(conversation.isRight()).toBe(false);
            expect(conversation.isLeft()).toBe(false);
        });
    });

    describe('infinite scrolling', function(){
        var conversation, event;

        beforeEach(function(){
            conversation = createConversation(testDataConversation());
            app.socket = createMockSocket();
            event = {
                target: {
                    scrollTop: 0,
                    scrollHeight: 150,
                },
            };
        });

        afterEach(function(){
            app.socket = undefined;
        });

        it('does not initiate request if loading more', function(){
            conversation.loadingMore(true);
            conversation.scrolled(null, event);
            expect(app.socket.emit).not.toHaveBeenCalled();
        });

        it('does not initiate request if scroll not near the top', function(){
            event.target.scrollTop = 41;
            conversation.scrolled(null, event);
            expect(app.socket.emit).not.toHaveBeenCalled();
            expect(conversation.loadingMore()).toBe(false);
        });

        it('does not initiate request if all messages have been loaded', function(){
            var testData = testDataConversation();
            testData.totalMessages = 2;
            conversation = createConversation(testData);
            conversation.scrolled(null, event);
            expect(app.socket.emit).not.toHaveBeenCalled();
            expect(conversation.loadingMore()).toBe(false);
        });

        it('initiates a request and sets conversation as loading more', function(){
            conversation.scrolled(null, event);
            expect(app.socket.emit).toHaveBeenCalled();
            var args = app.socket.emit.mostRecentCall.args;
            expect(args[0]).toBe('read_next_messages');
            expect(args[1].page).toBe(1);
            expect(args[1].conversationId).toBe(conversation.id);
            expect(conversation.loadingMore()).toBe(true);
        });

        describe('read messages', function(){
            var readMessages;

            beforeEach(function(){
                conversation.scrolled(null, event);
                readMessages = app.socket.emit.mostRecentCall.args[2];
                spyOn(conversation.ui.scroll, 'adjustToOffset');
            });

            it('adds messages to the beginning of the messages list', function(){
                var messages = [ testDataMessageCharlie(), testDataMessageDelta() ];
                readMessages(messages);

                expect(conversation.messages().length).toBe(4);
                expect(conversation.messages()[0].content).toBe('delta');
                expect(conversation.messages()[1].content).toBe('charlie');
                expect(conversation.messages()[2].content).toBe('alpha');
                expect(conversation.messages()[3].content).toBe('beta');
            });

            it('adjust the scrollbar to about location where user left of', function(){
                event.target.scrollHeight = 500;
                readMessages([]);
                // new height (500) - old height (150) - 80 = 270
                expect(conversation.ui.scroll.adjustToOffset).toHaveBeenCalledWith(270);
            });

            it('marks that loading is complete', function(){
                conversation.loadingMore(true);
                readMessages([]);
                expect(conversation.loadingMore()).toBe(false);
            });

            it('increases next page by 1', function(){
                conversation.scrolled(null, event);
                expect(app.socket.emit.mostRecentCall.args[1].page).toBe(1);
                
                readMessages([]);

                conversation.scrolled(null, event);
                expect(app.socket.emit.mostRecentCall.args[1].page).toBe(2);

                readMessages([]);

                conversation.scrolled(null, event);
                expect(app.socket.emit.mostRecentCall.args[1].page).toBe(3);
            });
        });
    });

    function testDataConversation() {
        return {
            _id: "8",
            createdBy: "fernando",
            groupId: "5",
            messages: [ testDataMessageAlpha(), testDataMessageBeta() ],
            timestamp: "2013-02-15T14:36:43.296Z",
            topic: "some topic",
            unread: 1,
            totalMessages: 3
        };
    }

    function testDataMessageAlpha() {
        return {
            content: "alpha", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 22:13:34'), 
            createdBy: "carlos"
        };
    }

    function testDataMessageBeta() {
        return {
            content: "beta", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 22:14:14'), 
            createdBy: "fernando"
        };
    }

    function testDataMessageCharlie() {
        return {
            content: "charlie", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 22:15:23'), 
            createdBy: "carlos"
        };
    }

    function testDataMessageDelta() {
        return {
            content: "delta", 
            conversationId: "8", 
            timestamp: Date.parse('2013.04.09 23:18:44'), 
            createdBy: "fernando"
        };
    }
});