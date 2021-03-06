describe('User', function() {
    'use strict';
    
    var User = require('../../lib/models/user'),
        Group = require('../../lib/models/group');

    var group, userData;

    beforeEach(function(done) {
        Group.create({ name: 'test', rawName: 'Test' }, function(err, testGroup) {
            group = testGroup;
            expect(group._id).not.toBeNull();
            userData = { firstName: 'test me', lastName: 'test me last', email: 'model-test@dobly.com', password: 'cleartext', groupId: group._id };
            done(err);
        });
    });

    describe('#password encryption', function(){

        it('encrypts password before save', function(done) {
            User.create(userData, function(err, user){
                expect(user.password).not.toBe('');
                expect(user.password).not.toBe('cleartext');
                done(err);
            });
        });

        it('does not encrypt password on update if password did not change', function(done) {
            User.create(userData, function(err, user){
                user.email = 'test-2@email.com';
                    
                user.save(function(err){
                    User.findOne({ email: 'test-2@email.com' }, function(err, updatedUser) {
                        expect(updatedUser.password).toBe(user.password);
                        done(err);
                    });
                });
            });
        });

        it('can compare password to determine successfull match', function(done){
            User.create(userData, function(err, user){
                    user.comparePassword('cleartext', function(err, isMatch) {
                    expect(isMatch).toBeTruthy();
                    done(err);
                });
            });
        });

        it('can compare password to determine unsuccessfull match', function(done){
            User.create(userData, function(err, user){
                user.comparePassword('wrong', function(err, isMatch) {
                    expect(isMatch).not.toBeTruthy();
                    done(err);
                });
            });
        });
    });

    describe('#email', function(){
        
        it('must be unique', function(done) {
            User.create(userData, function(err, user) {
                expect(err).toBeNull();

                userData.password = 'something else';
                User.create(userData, function(err) {
                    expect(err).not.toBe(null);
                    expect(err.err).toContain('dup key: { : "model-test@dobly.com" }');

                    done();
                });
            });
        });

        it('is lower cased automatically', function(done){
            userData.email = 'UPPER.CASE@EMAIL.COM';

            User.create(userData, function(err, user){
                expect(user.email).not.toBe('UPPER.CASE@EMAIL.COM');
                expect(user.email).toBe('upper.case@email.com');
                done();
            });
        });

        it('must be formatted as an email', function(){
            userData.email = 'not.an.email';

            User.create(userData, function(err, user){
                expect(err).not.toBeNull();
                expect(err.errors.email.type).toBe('Invalid email');
            });
        });
    });

    describe('#required fields', function() {
        
        function requiredFieldTest(field, done) {
            userData[field] = null;
            User.create(userData, function(err) {
                checkRequiredFieldError(err, field);
                done();
            });
        }

        it('first name', function(done) {
            requiredFieldTest('firstName', done);
        });

        it('last name', function(done) {
            requiredFieldTest('lastName', done);
        });

        it('email', function(done){
            requiredFieldTest('email', done);
        });

        it('password', function(done) {
            requiredFieldTest('password', done);
        });

        it('group', function(done) {
            requiredFieldTest('groupId', done);
        });
    });

    describe('#findExcept', function(){
        var firstUser, secondUser, thirdUser;

        beforeEach(function(done){
            User.create([
                { 
                    groupId: group._id,
                    firstName: 'find-1',
                    lastName: 'last-1',
                    email: 'em-1@dobly.com',
                    password: 'pass'
                },
                {
                    groupId: group._id,
                    firstName: 'find-2',
                    lastName: 'last-2',
                    email: 'em-2@dobly.com',
                    password: 'pass'
                },
                {
                    groupId: group._id,
                    firstName: 'find-3',
                    lastName: 'last-3',
                    email: 'em-3@dobly.com',
                    password: 'pass'
                }
            ], function(err){
                firstUser = arguments[1];
                secondUser = arguments[2];
                thirdUser = arguments[3];
                done(err);
            });
        });

        it('finds user excluding middle', function(done){
            User.findExcept([secondUser._id], group._id, function(err, foundUsers){
                expect(foundUsers.length).toBe(2);
                expect(foundUsers.some(function(foundUser) {
                    return foundUser.email === firstUser.email;
                })).toBe(true);
                expect(foundUsers.some(function(foundUser) {
                    return foundUser.email === secondUser.email;
                })).toBe(false);
                expect(foundUsers.some(function(foundUser) {
                    return foundUser.email === thirdUser.email;
                })).toBe(true);             
                done(err);
            });
        });
    });

    describe('#getFullName', function() {
        it("gets full name", function() {
            var user = new User({ 
                email: 'a@b.com',
                firstName: 'John',
                lastName: 'Doe',
                password: 'pass',
                groupId: group._id
            });

            expect(user.getFullName()).toBe('John Doe');
        });
    });

    describe("#isMemberOf", function() {
        it("true when entire group", function() {
            var user = new User({
                groupId: group._id
            });

            var collaborationObject = {
                groupId: group._id,
                members: {
                    entireGroup: true
                }
            };

            expect(user.groupId.equals(collaborationObject.groupId)).toBe(true);
            expect(user.isMemberOf(collaborationObject)).toBe(true);
        });

        it("false when different groups", function() {
            var user = new User({
                groupId: group._id
            });

            var collaborationObject = {
                groupId: new mongo.Types.ObjectId()
            };

            expect(user.isMemberOf(collaborationObject)).toBe(false);
        });

        it("true when id is in users list", function() {
            var userId = new mongo.Types.ObjectId();

            var user = new User({
                _id: userId,
                groupId: group._id
            });

            var collaborationObject = {
                groupId: group._id,
                members: {
                    entireGroup: false,
                    users: [ userId ]
                }
            };

            expect(user.isMemberOf(collaborationObject)).toBe(true);
        });

        it("false when id is not in users list", function() {
            var userId = new mongo.Types.ObjectId();

            var user = new User({
                _id: userId,
                groupId: group._id
            });

            var collaborationObject = {
                groupId: group._id,
                members: {
                    entireGroup: false,
                    users: [ new mongo.Types.ObjectId(), new mongo.Types.ObjectId() ]
                }
            };

            expect(user.isMemberOf(collaborationObject)).toBe(false);
        });
    });

    afterEach(function(done){
        group.remove(done);
    });
});