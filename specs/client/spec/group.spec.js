describe("group", function() {
	var group;
	var testData;
	var fernando, carlos, fido, current;

	beforeEach(function() {

		app.user = {
			_id: '888'
		};

		testData = {
			name: 'some test group',
			users: [ 
				{ name: 'fernando', _id: '123' }, 
				{ name: 'carlos', _id: '456'},
				{ name: 'fido', _id: '789'},
				{ name: 'current', _id: '888' }
			],
		};

		app.socket = createMockSocket();

		group = createGroup(testData);

		fernando = group.users[0];
		carlos = group.users[1];
		fido = group.users[2];
		current = group.users[3];
	});

	it("create group", function() {
		expect(group.name).toBe('some test group');

		expect(group.users.length).toBe(4);
		expect(app.socket.emit).toHaveBeenCalledWith('request_online_users');

		expect(fernando.name).toEqual('fernando');
		expect(fernando.online()).toBe(false);
		expect(fernando.id).toBe('123');
		expect(carlos.online()).toBe(false);
		expect(fido.online()).toBe(false);

		expect(group.users).toContain(fernando);
		expect(group.users).toContain(carlos);
		expect(group.users).toContain(fido);
		expect(group.users).toContain(current);
	});

	it("receive online users", function() {
		var onlineUsers = [ '123', '789' ];
		app.socket.mockEmit('receive_online_users', onlineUsers);

		expect(fernando.online()).toBe(true);
		expect(carlos.online()).toBe(false);
		expect(fido.online()).toBe(true);
	});

	it("user connected", function() {
		app.socket.mockEmit('user_connected', '456');

		expect(fernando.online()).toBe(false);
		expect(carlos.online()).toBe(true);
		expect(fido.online()).toBe(false);
	});

	it("user disconnected", function() {		
		app.socket.mockEmit('user_connected', '123');
		expect(fernando.online()).toBe(true);

		app.socket.mockEmit('user_disconnected', '123');
		expect(fernando.online()).toBe(false);
	});

	it('has all users except current user', function(){
		var otherUsers = group.otherUsers;
		expect(otherUsers.length).toBe(3);

		expect(otherUsers).toContain(fernando);
		expect(otherUsers).toContain(carlos);
		expect(otherUsers).toContain(fido);
	});
});