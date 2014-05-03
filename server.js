var port = process.env.PORT || 8080,
	app = require('./app').init(port),
	twilio = require('twilio'),
	fs = require('fs'),
	database = require('./db');
	
//var twilClient = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

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
	query = query.replace(/[0-9]/g, '');
	var reg = new RegExp(query, "i");
	var result = '';
	database.find({ 'code':  {$regex: reg} }, {}, {}, function(err, result) {
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
				database.find({ 'country': {$regex: reg} }, {}, {}, function(err, result2) {
					if (!err) {
						if (result2.length > 0){
							console.log('Reply: ' + result2.toString());
							for (var i = 0; i < result2.length; i++){
								smsText += result2[i].code + ' - ' + result2[i].country;
								console.log((i+1) < result2.length);
								if ((i+1) < result2.length){
									smsText += ', '; 
								}
							}
							console.log('Result: ' + smsText);
							res.render('results', {result: result2});
						} else {
							res.render('no-results');
						}
					} else {
						res.render('no-results');
						console.log('Database error: ' + err);
					}
				});
			}
		} else {
			res.render('no-results');
			console.log('Database error: ' + err);
		}
	});
});

//database.find({ $or : [{ 'country': {$regex: reg} }, { 'code':  {$regex: reg} }]}, function(err, result) {

app.post('/respondToSMS', function(req, res){
	//if(twilio.validateExpressRequest(req, process.env.AUTH_TOKEN)) {
		var query = req.param('Body').trim().toUpperCase();
		query = query.replace(/[0-9]/g, '');
		res.header('Content-Type', 'text/xml');
		var reg = new RegExp(query, "i");
		database.find({ 'code':  {$regex: reg} }, {}, {}, function(err, result) {
			if (!err){
				if (result.length > 0){
					var smsText = '';
					console.log('Reply: ' + result.toString());
					smsText += '<Response>';
					var x = 0;
					for (var i = 0; i < result.length; i++){
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
					database.find({ 'country': {$regex: reg} }, {}, {}, function(err, result2) {
						if (!err) {
							if (result2.length > 0){
								var smsText = '';
								console.log('Reply: ' + result2.toString());
								smsText += '<Response>';
								var x = 0;
								for (var i = 0; i < result2.length; i++){
									x++;
									if (i < 5) {
										smsText += '<sms>' + x + '. ' + result2[i].code + ' - ' + result2[i].country + '</sms>';
									} else {
										smsText += '<sms>Only first 5 out of ' + result2.length + ' results returned</sms>';
										break;
									}
								}
								smsText += '</Response>';
								console.log('Result: ' + smsText);
								res.send(smsText);
							} else {
								res.send('<Response><Sms>No plates found for ' + query + '</Sms></Response>');
							}
						} else {
							res.send('<Response><Sms>No plates found for ' + query + '</Sms></Response>');
							console.log('Database error: ' + err);
						}
					});
				}
			}
			else {
				res.send('<Response><Sms>No plates found for ' + query + '</Sms></Response>');
				console.log('Database error: ' + err);
			}
		});
	//}
	//else {
	//	res.send('You are not twilio. Buzz off');
	//}
});
