define(['squire'], function(Squire){
	'use strict';

	describe("group", function() {
		var group, routingMock;
		var testData;
		var fernando, carlos, fido, current;

		beforeEach(function() {

			app.user = {
				_id: '888'
			};

			testData = {
				group: {
					name: 'some test group',
					users: [ 
						{ firstName: 'Fernando', lastName: 'Green', _id: '123' }, 
						{ firstName: 'Carlos', lastName: 'White',  _id: '456'},
						{ firstName: 'Fido', lastName: 'Dido', _id: '789'},
						{ firstName: 'Current', lastName: 'Wave', _id: '888' }
					],
				}
			};

			app.socket = createMockSocket();
			
			routingMock = {
				subscribe: jasmine.createSpy('subscribe')
			};

			var done = false;

			runs(function(){
				var injector = new Squire();

				injector.mock('client/routing', routingMock);
				injector.mock('client/data', testData);

				injector.require(['client/group'], function(groupObj){
					group = groupObj;

					fernando = group.users[0];
					carlos = group.users[1];
					fido = group.users[2];
					current = group.users[3];
					done = true;
				});
			});

			waitsFor(function(){
				return done;
			});
		});

		it("create group", function() {
			expect(group.name).toBe('some test group');
			expect(group.showing()).toBe(false);
			expect(group.users.length).toBe(4);
			expect(app.socket.emit).toHaveBeenCalledWith('request_online_users');

			expect(fernando.fullName).toEqual('Fernando Green');
			expect(fernando.online()).toBe(false);
			expect(fernando.id).toBe('123');
			expect(carlos.online()).toBe(false);
			expect(fido.online()).toBe(false);

			expect(group.users).toContain(fernando);
			expect(group.users).toContain(carlos);
			expect(group.users).toContain(fido);
			expect(group.users).toContain(current);

			expect(group.map[fernando.id]).toBe(fernando);
			expect(group.map[carlos.id]).toBe(carlos);
			expect(group.map[current.id]).toBe(current);
		});

		it("receive online users", function() {
			var onlineUsers = [ '123', '789' ];
			app.socket.mockEmit('receive_online_users', onlineUsers);

			expect(fernando.online()).toBe(true);
			expect(carlos.online()).toBe(false);
			expect(fido.online()).toBe(true);
		});

		it("user connected", function() {
			app.socket.mockEmit('user_connected', { _id: '456' });

			expect(fernando.online()).toBe(false);
			expect(carlos.online()).toBe(true);
			expect(fido.online()).toBe(false);
		});

		it("user disconnected", function() {		
			app.socket.mockEmit('user_connected', { _id: '123' });
			expect(fernando.online()).toBe(true);

			app.socket.mockEmit('user_disconnected', '123');
			expect(fernando.online()).toBe(false);
		});

		it("adds user if not existing user", function() {
			expect(group.map['999']).toBeUndefined();
			app.socket.mockEmit('user_connected', { _id: '999', firstName: 'New', lastName: 'User'});
			expect(group.map['999']).toBeDefined();
			var newUser = group.map['999'];
			expect(newUser.id).toBe('999');
			expect(newUser.online()).toBe(true);
			expect(group.otherUsers).toContain(newUser);
		});

		it('has all users except current user', function(){
			var otherUsers = group.otherUsers;
			expect(otherUsers.length).toBe(3);

			expect(otherUsers).toContain(fernando);
			expect(otherUsers).toContain(carlos);
			expect(otherUsers).toContain(fido);
		});

		it('gets users full name', function(){
			expect(group.getUserFullName(fernando.id)).toBe('Fernando Green');
		});

		it('subscribes to route', function(){
			expect(routingMock.subscribe).toHaveBeenCalledWith('group', group.showing);
		});
	});
});
