describe('Desktop route - integration', function(){
    'use strict';

    var User = require('../../lib/models/user'),
        Group = require('../../lib/models/group'),
        CollaborationObject = require('../../lib/models/collaboration_object'),
        Desktop = require('../../lib/models/desktop'),
        Message = require('../../lib/models/message'),
        Task = require('../../lib/models/task'),
        UnreadMarker = require('../../lib/models/unread_marker'),
        async = require('async');

    var desktopRoute, req, res, group,
        TEST_NAME = 'test desktop route';

    beforeEach(function(done){
        desktopRoute = require('../../lib/routes/desktop');

        req = {};

        res = {
            render: jasmine.createSpy('render')
        };

        Group.create({ name: 'test', rawName: 'Test'}, function(err, testGroup){
            group = testGroup;
            done(err);
        });
    });

    afterEach(function(done){
        group.remove(done);
    });

    function setupConversations(user, savedConversations, callback){
        async.parallel([
            function(callback){
                UnreadMarker.create([ 
                    {
                        collaborationObjectId: savedConversations[0]._id,
                        userId: user._id,
                        count: 1
                    },
                    {
                        collaborationObjectId: savedConversations[1]._id,
                        userId: user._id,
                        count: 23
                    }
                ], callback);
            },
            function(callback){
                var data = [];

                for(var i = 0; i< 51; i++ ){
                    data.push({ content: 'test message 2.' + i, createdById: user._id, collaborationObjectId: savedConversations[1]._id, timestamp: new Date(2013, 1, 1, 1, i) });
                }

                data.push({ content: 'test message 1', createdById: user._id, collaborationObjectId: savedConversations[0]._id, timestamp: new Date(2013, 9, 17) });
                data.push({ content: 'test message 1.2', createdById: user._id, collaborationObjectId: savedConversations[0]._id, timestamp: new Date(2013, 9, 16) });

                data.push({ content: 'test message 3', createdById: user._id, collaborationObjectId: savedConversations[2]._id });

                Message.create(data, callback);
            },
        ], function(err){
            callback(err, savedConversations);
        });
    }

    function setupTaskLists(user, savedTaskLists, callback){
        async.parallel([
            function(callback){
                UnreadMarker.create([ 
                    {
                        collaborationObjectId: savedTaskLists[0]._id,
                        userId: user._id,
                        count: 12
                    },
                    {
                        collaborationObjectId: savedTaskLists[2]._id,
                        userId: user._id,
                        count: 2
                    }
                ], callback);
            },
            function(callback){
                var data = [], date;

                for(var i = 1; i<= 3; i++ ){
                    date = new Date();
                    date.setDate(date.getDate() + i);
                    data.push({ content: 'test task 1.' + i, createdById: user._id, collaborationObjectId: savedTaskLists[0]._id, timestamp: date });
                }

                data.push({ content: 'test task 2.1', createdById: user._id, collaborationObjectId: savedTaskLists[1]._id, timestamp: date });
                data.push({ content: 'test task 2.2', createdById: user._id, collaborationObjectId: savedTaskLists[1]._id, timestamp: new Date() });

                data.push({ content: 'test task 3', createdById: user._id, collaborationObjectId: savedTaskLists[2]._id });

                Task.create(data, callback);
            },
        ], function(err){
            callback(err, savedTaskLists);
        });
    }

    describe('#get', function(){
        var testUser, collaborationObjects;

        beforeEach(function(done){
            User.create({ email: 'test@email.com', firstName: TEST_NAME, lastName: 'last', groupId: group._id, password: 'pass' }, function(err, user){
                testUser = user;

                async.parallel({
                    user2: function(callback){
                        User.create({ email: 'routes.int.2@test.com', firstName: TEST_NAME + '2', lastName: 'last', groupId: group._id, password: 'pass' }, callback);
                    },
                    desktop: function(callback){
                        Desktop.create({ userId: user._id }, callback);
                    },
                    collaborationObjects: function(callback){
                        var collaborationObjects = [], i;

                        for(i = 0; i < 3; i++ ){
                            collaborationObjects.push({ topic: 'test-convo ' + i, createdById: user._id, groupId: group._id, timestamp: new Date(), members: { entireGroup: true }, type: 'C' });
                        }

                        for(i = 0; i < 3; i++ ){
                            collaborationObjects.push({ topic: 'test-task-list ' + i, createdById: user._id, groupId: group._id, timestamp: new Date(), members: { entireGroup: true }, type: 'T' });
                        }

                        CollaborationObject.create(collaborationObjects, function(err){
                            var args = arguments;

                            async.parallel([
                                function(callback){
                                    setupConversations(user, [ args[1], args[2], args[3] ], callback);
                                },
                                function(callback){
                                    setupTaskLists(user, [ args[4], args[5], args[6] ], callback);      
                                }
                            ], function(err, results){
                                callback(err, results[0].concat(results[1]));
                            });
                        });
                    }
                }, function(err, results){
                    collaborationObjects = results.collaborationObjects;
                    done(err);
                });
            });
        });

        afterEach(function(done){
            async.parallel([
                function(callback){
                    CollaborationObject.remove({ groupId: group._id }, callback);
                },
                function(callback){
                    Desktop.remove({ userId: testUser._id }, callback);
                },
                function(callback){
                    async.each(collaborationObjects, removeItems, callback);

                    function removeItems(collaborationObject, callback){
                        if(collaborationObject.type === 'C'){
                            Message.remove({ collaborationObjectId: collaborationObject._id }, callback);
                        }

                        if(collaborationObject.type === 'T'){
                            Task.remove({ collaborationObjectId: collaborationObject._id }, callback);
                        }
                    }
                },
                function(callback){
                    UnreadMarker.remove({ userId: testUser._id }, callback);
                }
            ], function(err){
                done(err);
            });
        });

        it('renders', function(done){
            req.user = testUser;

            res.render = function(url, result){
                expect(url).toBe('conversations');
                verifyCollaborationObjects(JSON.parse(result.collaborationObjects));
                verifyCurrentUser(JSON.parse(result.currentUser));
                verifyGroup(JSON.parse(result.group));

                verifyDesktop(JSON.parse(result.desktop), function(){
                    done();    
                });
            };

            desktopRoute.get(req, res);
        });

        function findCollaborationObject(topic, collaborationObjects){
            return collaborationObjects.filter(function(obj){
                return obj.topic === topic;
            })[0];
        }

        function verifyCollaborationObjectBaseProperties(collaborationObject){
            expect(collaborationObject.groupId).toBe(group._id.toString());
            expect(collaborationObject.createdById).toBe(testUser._id.toString());
        }

        function verifyConversations(collaborationObjects){
            var object = findCollaborationObject('test-convo 0', collaborationObjects);
            verifyCollaborationObjectBaseProperties(object);
            expect(object.items.length).toBe(2);
            expect(object.items[1].content).toBe('test message 1');
            expect(object.items[0].content).toBe('test message 1.2');
            expect(object.unread).toBe(1);

            object = findCollaborationObject('test-convo 1', collaborationObjects);
            verifyCollaborationObjectBaseProperties(object);
            expect(object.items.length).toBe(50);
            expect(object.items[0].content).toBe('test message 2.1');
            expect(object.items[49].content).toBe('test message 2.50');
            expect(object.unread).toBe(23);

            object = findCollaborationObject('test-convo 2', collaborationObjects);
            verifyCollaborationObjectBaseProperties(object);
            expect(object.items.length).toBe(1);
            expect(object.items[0].content).toBe('test message 3');
        } 

        function verifyTasklists(collaborationObjects){
            var object = findCollaborationObject('test-task-list 0', collaborationObjects);
            verifyCollaborationObjectBaseProperties(object);
            expect(object.items.length).toBe(3);
            expect(object.items[0].content).toBe('test task 1.1');
            expect(object.items[1].content).toBe('test task 1.2');
            expect(object.items[2].content).toBe('test task 1.3');

            object = findCollaborationObject('test-task-list 1', collaborationObjects);
            verifyCollaborationObjectBaseProperties(object);
            expect(object.items.length).toBe(2);
            expect(object.items[0].content).toBe('test task 2.2');
            expect(object.items[1].content).toBe('test task 2.1');

            object = findCollaborationObject('test-task-list 2', collaborationObjects);
            verifyCollaborationObjectBaseProperties(object);
            expect(object.items.length).toBe(1);
            expect(object.items[0].content).toBe('test task 3');
        }

        function verifyCollaborationObjects(collaborationObjects){
            expect(collaborationObjects.length).toBe(6);
            verifyConversations(collaborationObjects);
            verifyTasklists(collaborationObjects);
        }

        function verifyDesktop(desktop, callback){
            expect(desktop.userId).toBe(testUser._id.toString());
            expect(desktop.collaborationObjects).toContain(collaborationObjects[0]._id.toString());
            expect(desktop.collaborationObjects).toContain(collaborationObjects[1]._id.toString());
            expect(desktop.collaborationObjects).not.toContain(collaborationObjects[2]._id.toString());

            Desktop.findById(desktop._id, function(err, savedDesktop){
                expect(savedDesktop.collaborationObjects).toContain(collaborationObjects[0]._id);
                expect(savedDesktop.collaborationObjects).toContain(collaborationObjects[1]._id);
                expect(savedDesktop.collaborationObjects).not.toContain(collaborationObjects[2]._id);

                callback();
            });
        }

        function verifyCurrentUser(currentUser){
            expect(currentUser._id).toBe(testUser._id.toString());
            expect(currentUser.email).toBe(testUser.email);
        }

        function verifyGroup(resultGroup){
            expect(resultGroup.name).toBe(group.name);
            expect(resultGroup.users.length).toBe(2);
            expect(resultGroup.users[0].firstName).toBe(TEST_NAME);
            expect(resultGroup.users[1].firstName).toBe(TEST_NAME + '2');
        }
    });
});