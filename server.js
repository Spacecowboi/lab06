'use strict';

// brings in the expresss library which is our server
const express = require('express');

// instantiates the express library in app
const app = express();

// lets us go into the .env and get the variables
require('dotenv').config();

// the policeman - lets the server know that it is OK to give information to the front end
const cors = require('cors');
app.use(cors());

// get the port from the env
const PORT = process.env.PORT || 3002;

const superagent = require('superagent');

app.get('/location', (request, response) => {
  try{
    let city = request.query.city;
    let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`;
    superagent.get(url)
      .then(results => {
        let geoData = results.body;
        let location = new City(city, geoData[0]);
        response.status(200).send(location);
      });
  }
  catch (err){
    console.log(err);
  }
});

app.get('/weather', (request, response) =>{
  let {search_query, formatted_query, latitude, longitude} = request.query;

  let darkSky = require('./data/darksky.json');
  let weatherArray = darkSky.daily.data;
  let newWeatherArray=[];
  weatherArray.forEach(day =>{
    newWeatherArray.push(new Weather(day));
  });
  response.send(newWeatherArray);
});

function Weather(day){
  this.time = new Date(day.data.time).toDateString;
  this.forecast = day.summary;
}

function City(city, obj){
  this.search_query = city;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

// turn on the server
app.listen(PORT, () => {
  console.log(`listening to ${PORT}`);
});