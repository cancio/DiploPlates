var port = process.env.PORT || 8080,
	app = require('./app').init(port),
	client = require('redis-url').connect(process.env.REDISTOGO_URL);
	twilio = require('twilio'),
	twilClient = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN),
	fs = require('fs');

loadCountries();

function loadCountries(){
	var currline = [];
	fs.readFile('./countryList.txt', 'utf-8', function(err, data){
		if (err) throw err;
		
		var lines = data.toString().trim().split('\n');
		
		for (var i = 0; i < lines.length; i++){
			currline = lines[i].split(',');
		    client.set(currline[0], currline[1], function(err, reply){
    			console.log(reply.toString());
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
	res.render('login');
});

app.post('/submit', function(req,res){
	console.log('Search submitted');
	var query = '*' + req.body.query.toUpperCase() + '*';
	var result = '';
	client.get(query, function(err, reply){
		if (reply != null){
			console.log('Reply: ' + reply.toString());
			result = reply.toString();
			res.render('results', {key: query, value: result});
		}
		else {
			res.render('no-results');
		}
	});
});

app.post('/respondToSMS', function(req, res){
	//if(twilio.validateExpressRequest(req, process.env.AUTH_TOKEN)) {
		var query = req.param('Body').trim().toUpperCase();
		res.header('Content-Type', 'text/xml');
		client.get(query, function(err, reply){
			if (reply != null){
				console.log('Reply: ' + reply.toString());
				result = reply.toString();
				res.send('<Response><Sms>' + result + '</Sms></Response>');
			}
			else {
				res.send('<Response><Sms>No plate found for ' + query + '</Sms></Response>');
			}
		});
	//}
	//else {
	//	res.send('You are not twilio. Buzz off');
	//}
});
