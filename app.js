var http = require('http'),
    fs = require('fs'),
    httpProxy = require('http-proxy'),
	request = require("request-promise") ;
	
const HTTPPORT = 8000;
const PROXYPORT = 9000;
const HOST = '0.0.0.0';

var apiProxy = httpProxy.createProxyServer({target:'http://0.0.0.0:9000'}).listen(8000);

var dataProp = {city:"", state: "", cwa: "", geoLat: "", geoLon: "", gridX:"", gridY:"", elevation:"", forecastUri:""};

var options = {
	  uri:  '',
	  host: 'api.weather.gov',
	  port: 443,
	  path: '',
	  method: "GET",
	  key: fs.readFileSync('./myfile.pem'),
	  cert: fs.readFileSync('./myfile.crt'),
	  json: true,
	  headers: {
		  'token': 'DegDwzrxbuaBcvRnxByISaKTuILimTHg',
		  'User-Agent': 'request',
		  'accept' : 'application/json'
	  }
	};

var weather = {

	geoPoints: null, 

	getForecastProps: function(geoPoints){

		options.uri = 'https://api.weather.gov/points/'.concat(geoPoints);
        options.path = 'points/'.concat(geoPoints);

		return request(options);

	},

	getAllForecast: function(forecastProps){

		var forecastUri = forecastProps.properties.forecast;

		var city = forecastProps.properties.relativeLocation.properties.city;
		var state = forecastProps.properties.relativeLocation.properties.state;
		
		var cwa = forecastProps.properties.cwa;
		var gridX = forecastProps.properties.gridX;
		var gridY = forecastProps.properties.gridY;

		var elevation = 0;
 
		var geoLat = forecastProps.geometry.coordinates[1];
		var geoLon = forecastProps.geometry.coordinates[0];




		dataProp.city = city;
		dataProp.state = state;
		dataProp.cwa = cwa;
		dataProp.gridX = gridX;
		dataProp.gridY = gridY;
		dataProp.elevation = elevation;
		dataProp.forecastUri = forecastUri;
		dataProp.geoLat = geoLat;
		dataProp.geoLon = geoLon;


		options.uri = forecastUri;
		options.path = 'gridpoints/'.concat(cwa).concat('/').concat(gridX).concat(',').concat(gridY).concat('/forecast');

		console.log("forecast options.path :", options.path);
        
		return request(options);

	}

}


function main(params) {
	//weather.geoPoints = params.geoPoints;
	return weather.getForecastProps(params)
		.then(weather.getAllForecast);

}


http.createServer(function (req, res) {
	if(req.url.split('weatherAPI/')[1]){

		var geoPoints = req.url.split('weatherAPI/')[1]; //    39.7456,-97.0892';
		 console.log('geoPoints :', geoPoints); 
		 
		 
		 main( geoPoints ).then(function(result){

		 	//result.dataProp = dataProp;
		 	//result.dataProp.elevation = result.properties.elevation.value;
		 	dataProp.elevation = result.properties.elevation.value;

			var currentTemperature = result.properties.periods[0].temperature;
			var currentWindSpeed = result.properties.periods[0].windSpeed;
			var currentWindDirection = result.properties.periods[0].windDirection;
			var shortForecast = result.properties.periods[0].shortForecast;

			dataProp.currentTemperature = currentTemperature;
			dataProp.currentWindSpeed = currentWindSpeed;
			dataProp.currentWindDirection = currentWindDirection;
			dataProp.shortForecast = shortForecast;


		 	result.dataProp = dataProp;

		 	console.log(JSON.parse(JSON.stringify(result)));

		   //res.writeHead(200, { 'Content-Type': 'text/plain' }); application/json
		   res.writeHead(200, { 'Content-Type': 'application/json' });

	       ///res.write('request successfully proxied! for '  + '\n' + JSON.stringify(dataProp, true, 2));
	      // res.write(JSON.stringify(dataProp, true, 2));
	      var json = JSON.stringify(dataProp, true, 2);
	        
	       res.end(json);

		 });

	}else{
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.write('No or incorrect geoPoint parameters passed');
 			res.end();
	}

	 

}).listen(9000);    