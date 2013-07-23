var mongodb = require('mongodb'),
	mongoose = require('mongoose');
	
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ || 'mongodb://localhost/test';

mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function callback () {
  console.log('Connected to DB');
});

var licensePlateSchema = mongoose.Schema({
  code: { type: String, required: true, unique: true},
  country: { type: String, required: true }
});

module.exports = db.model('LicensePlate', licensePlateSchema);