describe('Sockets', function(){
	'use strict';

    describe('Tasks', function(){
		var taskIo, taskMock, logMock,
			collaborationObjectIo;

		beforeEach(function(){
			mockery.enable({ useCleanCache: true });
			mockery.registerAllowable('../../lib/sockets/task_io');

			collaborationObjectIo = buildMock('./base_collaboration_object_io', 'sendItem');
			taskMock = buildMock('../models/task', 'create', 'update');
			logMock = buildMock('../common/log', 'error');

			taskIo = require('../../lib/sockets/task_io');
		});

		it('saves task', function(){
			var socket = {
					handshake: {
						user: {
							firstName: 'usr'
						}
					}
				},
				sockets = { 'sock': 'ets' },
				data = { da: 'ta' },
				confirm = jasmine.createSpy();

			taskIo.add(socket, sockets, data, confirm);
			expect(collaborationObjectIo.sendItem).toHaveBeenCalled();
			var addArgs = collaborationObjectIo.sendItem.mostRecentCall.args;
			expect(addArgs[0]).toBe(socket);
			expect(addArgs[1]).toBe(sockets);
			expect(addArgs[2]).toBe(data);
			expect(addArgs[4]).toBe(confirm);

			var callback = jasmine.createSpy();
			addArgs[3](callback);

			expect(taskMock.create).toHaveBeenCalled();
			
			var taskData = taskMock.create.mostRecentCall.args[0];
			expect(taskData.description).toBe(data.description);
			expect(taskData.createdById).toBe(socket.handshake.user._id);
			expect(taskData.timestamp).toBe(data.timestamp);
			expect(taskData.collaborationObjectId).toBe(data.collaborationObjectId);

			expect(taskMock.create.getCallback()).toBe(callback);
		});		

		it('completes a task', function(){
			var socketMock = { 
				broadcastToCollaborationObjectMembers: jasmine.createSpy()
			};

			var data = { id: 't-id', collaborationObjectId: 'c-id' };

			taskIo.complete(socketMock, data);

			expect(taskMock.update).toHaveBeenCalled();
			var args = taskMock.update.mostRecentCall.args;

			expect(args[0]).toEqual({ _id: 't-id' });
			expect(args[1].isComplete).toBe(true);
			
			var completedOn = new Date(args[1].completedOn),
				expected = new Date();

			expect(completedOn.getDate()).toBe(expected.getDate());
			expect(completedOn.getMonth()).toBe(expected.getMonth());
			expect(completedOn.getFullYear()).toBe(expected.getFullYear());

			args[2](null);
			expect(logMock.error).not.toHaveBeenCalled();
			expect(socketMock.broadcastToCollaborationObjectMembers).toHaveBeenCalledWith('task_completed', data);

			args[2]('my error');
			expect(logMock.error).toHaveBeenCalledWith('my error', 'Error completing a task.');
		});	
	});
});