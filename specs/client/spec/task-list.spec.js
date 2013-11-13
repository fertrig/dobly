define(['squire'], function(Squire){
	describe('Task list', function(){
		var createTaskList, createTaskMock,
			taskList;

		beforeEach(function(){
			var done = false;

			var createCollaborationObjectMock = function(data, template){
	            return {
	                init: jasmine.createSpy('init'),
	                addNewItem: jasmine.createSpy('add'),
	                data: data,
	                template: template
	            } 
	        };

	        createTaskMock = jasmine.createSpy('create-task');
	        app.socket = createMockSocket();

			runs(function(){
				var injector = new Squire();

				injector.mock('client/collaboration-object', function(){
					return createCollaborationObjectMock;
				});

				injector.mock('client/task', function(){
					return createTaskMock;
				});

				injector.require(['client/task-list'], function(createTaskListFn){
					createTaskList = createTaskListFn;
					done = true;
				});
			});

			waitsFor(function(){
				return done;
			});

			runs(function(){
				taskList = createTaskList({
					da: 'ta'
				});
			});
		});

		describe('creation', function(){
			it('sets template', function(){
				expect(taskList.template).toBe('task-list-template');
			});

			it('initializes', function(){
				expect(taskList.init).toHaveBeenCalledWith(createTaskMock);
			});
		});

		describe('add task', function(){
			it('defines function based on template', function(){
				expect(taskList.addNewItem).toHaveBeenCalled();
			});

			it('defines a way to create the task', function(){
				var createFunc = taskList.addNewItem.mostRecentCall.args[0],
					data = {},
					taskObj = {
						processing: jasmine.createSpy('processing')
					};

				createTaskMock.andReturn(taskObj);
				createFunc(data);

				expect(createTaskMock).toHaveBeenCalledWith(data);
				expect(taskObj.processing).toHaveBeenCalledWith(true);
			});

			it('defines a way to send to server', function(){
				var sendToServer = taskList.addNewItem.mostRecentCall.args[1],
					taskData = { task: 'data' },
					taskObj = {
						id: jasmine.createSpy('id'),
						processing: jasmine.createSpy('processing'),
						timestamp: jasmine.createSpy()
					};

				sendToServer(taskData, taskObj);
				expect(app.socket.emit).toHaveBeenCalled();
				var args = app.socket.emit.mostRecentCall.args;
				expect(args[0]).toBe('add_task');
				expect(args[1]).toBe(taskData);

				var now = new Date();
				var callback = args[2];
				callback({ _id: 'task-id', timestamp: now });
				expect(taskObj.id).toHaveBeenCalledWith('task-id');
				expect(taskObj.processing).toHaveBeenCalledWith(false);
				expect(taskObj.timestamp).toHaveBeenCalledWith(now);
			});
		});
	});
});