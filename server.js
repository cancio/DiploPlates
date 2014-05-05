var port = process.env.PORT || 8080,
	app = require('./app').init(port),
	twilio = require('twilio'),
	fs = require('fs'),
	database = require('./db');
	
//var twilClient = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// Calls function to load countries from text file. Should probably do this better
//loadCountries();

function loadCountries(){
	var currline = [];
	fs.readFile('./countryList.txt', 'utf-8', function(err, data){
		if (err) throw err;
		
		var lines = data.toString().trim().split('\n');
		
		for (var i = 0; i < lines.length; i++){
			currline = lines[i].split(',');
		    database.create({ code: currline[0], country: currline[1]},  function(err, doc){
		    	if(!err){
    				console.log(doc.toString());
    			} else {
    				console.log("Database error: " + err);
    			}
    		});
		}
	});
}

// Searches country code or country name
var search = function(query, callback) {
	// Removes numbers in case user inputs whole license plate number
	query = query.replace(/[0-9]/g, '');
	var reg = new RegExp(query, "i");
	// First tries to search by license plate prefix or suffix
	database.find({ 'code':  {$regex: reg} }, {}, {}, function(err, result) {
		if (!err) {
			if (result.length > 0){
				console.log('Result: ' + result.toString());
				callback(result);
			} else {
				// If nothing was found through code, search country name
				database.find({ 'country': {$regex: reg} }, {}, {}, function(err, result2) {
					if (!err) {
						callback(result2);
					} else {
						callback(result, err);
						console.log('Database error: ' + err);
					}
				});
			}
		} else {
			callback(result, err);
			console.log('Database error: ' + err);
		}
	});
};
	

// define the routes
app.get('*', function(req,res,next){
	// this is called for every GET request
	console.log('Initial request received');
	//loadCountries();
	next();
});

/* home page route */
app.get('/', function(req,res){
	console.log('Index loaded');
	res.render('index');
});

app.post('/submit', function(req,res){
	console.log('Search submitted');
	var query = req.body.query.toUpperCase();
	query = query.replace(/[0-9]/g, '');
	var reg = new RegExp(query, "i");
	var result = '';
	search(query, function searchResult(result, err) {
		if (result.length > 0 && !err){
			// Helped me debug results
			//var resultText = '';
			//console.log('Reply: ' + result.toString());
			//for (var i = 0; i < result.length; i++){
			//	resultText += result[i].code + ' - ' + result[i].country;
			//	console.log((i+1) < result.length);
			//	if ((i+1) < result.length){
			//		resultText += ', '; 
			//	}
			//}
			//console.log('Result: ' + resultText);
			res.render('results', {result: result});
		} else {
			res.render('no-results');
		}
	});
});

// Responds to requests from Twilio
app.post('/respondToSMS', function(req, res){
	res.header('Content-Type', 'text/xml');
	var query = req.param('Body').trim().toUpperCase();
	query = query.replace(/[0-9]/g, '');
	var reg = new RegExp(query, "i");
	search(query, function searchResultSMS(result, err) {
		if (result.length > 0 && !err) {
			var smsText = '';
			//console.log('Reply: ' + result.toString());
			smsText += '<Response>';
			var x = 0;
			for (var i = 0; i < result.length; i++) {
				x++;
				if (i < 5) {
					smsText += '<sms>' + x + '. ' + result[i].code + ' - ' + result[i].country + '</sms>';
				} else {
					smsText += '<sms>Only first 5 out of ' + result.length + ' results returned</sms>';
					break;
				}
			}
			smsText += '</Response>';
			console.log('Result: ' + smsText);
			res.send(smsText);
		} else {
			res.send('<Response><Sms>No plates found for ' + query + '</Sms></Response>');
		}
	});
});

module.exports = app;