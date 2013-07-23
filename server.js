var port = process.env.PORT || 8080,
	app = require('./app').init(port),
	twilio = require('twilio'),
	fs = require('fs'),
	database = require('./db');
	
var twilClient = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

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
	var reg = new RegExp(query, "i");
	var result = '';
	database.find({ $or : [{ 'country': {$regex: reg} }, { 'code':  {$regex: reg} }]}, function(err, result) {
		if (!err){
			if (result.length > 0){
				var smsText = '';
				console.log('Reply: ' + result.toString());
				for (var i = 0; i < result.length; i++){
					smsText += result[i].code + ' - ' + result[i].country;
					console.log((i+1) < result.length);
					if ((i+1) < result.length){
						smsText += ', '; 
					}
				}
				console.log('Result: ' + smsText);
				res.render('results', {result: result});
			} else {
				res.render('no-results');
			}
		}
		else {
			res.render('no-results');
			console.log('Database error: ' + err);
		}
	});
});

app.post('/respondToSMS', function(req, res){
	//if(twilio.validateExpressRequest(req, process.env.AUTH_TOKEN)) {
		var query = req.param('Body').trim().toUpperCase();
		res.header('Content-Type', 'text/xml');
		var reg = new RegExp(query, "i");
		database.find({ $or : [{ 'country': {$regex: reg} }, { 'code':  {$regex: reg} }]}, function(err, result) {
			if (!err){
				if (result.length > 0){
					var smsText = '';
					console.log('Reply: ' + result.toString());
					smsText += '<Response>';
					for (var i = 0; i < result.length; i++){
						if (i < 5) {
							smsText += '<sms>' + i + '. ' result[i].code + ' - ' + result[i].country + '</sms>';
						} else {
							smsText += '<sms>Only first 4 out of ' + result.length + ' results returned</sms>';
						}
					}
					smsText += '</Response>';
					console.log('Result: ' + smsText);
					res.send(smsText);
				} else {
					res.send('<Response><Sms>No plates found for ' + query + '</Sms></Response>');
				}
			}
			else {
				res.send('<Response><Sms>No plates found for ' + query + '</Sms></Response>');
			}
		});
	//}
	//else {
	//	res.send('You are not twilio. Buzz off');
	//}
});
