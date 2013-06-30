var port = process.env.PORT || 8080,
	app = require('./app').init(port),
	client = require('redis-url').connect(process.env.REDISTOGO_URL);
	twilio = require('twilio')("ACcf24461fc9b7062760b47913b7ecbe58", "2c37f04613e074bf4e917dec14b11c8d");

loadCountries();

function loadCountries(){
	var codes = ["AA",
                   "AC",
                   "AE",
                   "AF",
                   "AH",
                   "AJ"];
    var countries = ["Congo",
       					"Cote d'Ivoire",
       					"Uzbekistan",
       					"Japan",
       					"Madagascar",
       					"Panama"];
    for (var i = 0; i < codes.length; i++){
    	client.set(codes[i], countries[i], function(err, reply){
    		console.log(reply.toString());
    	});
    }
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
	var query = req.body.query;
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
	if(twilio.validateExpressRequest(req, '2c37f04613e074bf4e917dec14b11c8d')) {
		var query = req.param('Body').trim();
		res.header('Content-Type', 'text/xml');
		client.get(query, function(err, reply){
			if (reply != null){
				console.log('Reply: ' + reply.toString());
				result = reply.toString();
				res.send('<Response>' + query + ': ' + result + '</Response>');
			}
			else {
				res.send('<Response>No plate found for ' + query + '</Response>');
			}
		});
	}
	else {
		res.send('You are not twilio. Buzz off');
	}
});
