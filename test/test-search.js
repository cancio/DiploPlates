var expect = require('chai').expect,
	app = require('../server.js'),
	database = require('../db.js'),
	request = require('supertest'),
	mongoose = require('mongoose'),
	fs = require('fs'),
	path = require('path');

describe('Database', function() {
	beforeEach(function(done) {
		if (mongoose.connection.db) return done();
	});
	
	it('should fetch without error', function(done) {
		database.find({ 'code':  {$regex: 'dcy'} }, {}, {}, function(err, result) {
			expect(err).to.be.null;
			done();
		});
	});
}); 

describe('GET /', function() {
	it('should respond with 200', function(done) {
		request(app)
			.get('/')
			.expect(200, done);
	});
});

describe('Search function', function() {
	var lines;
	beforeEach(function(done) {
		fs.readFile(path.join(__dirname + '/../countryList.txt'), function(err, data){
			if (err) throw err;
		
			lines = data.toString().trim().split('\n');
		
			done();
		});
	});
	
	it('should find all codes', function(done) {
		for (var i = 0; i < lines.length; i++){
			currline = lines[i].split(',');
			// Test here to verify search function
		}
		done();
	});
});
	
