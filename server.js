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
//cities
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

function City(city, obj){
  this.search_query = city;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

//weather

app.get('/weather', (request, response) => {
  let locationObject = request.query;
  let url = `https://api.darksky.net/forecast/${process.env.DARK_SKY_API}/${locationObject.latitude},${locationObject.longitude}`;
  superagent.get(url)
    .then(results =>{
    //loop over array, and send each object to the constructor
      let weatherArray = results.body.daily.data;
      let weatherMap = weatherArray.map(day => new Weather (day));
      response.status(200).send(weatherMap);

    });
});

function Weather(obj){
  this.forecast = obj.summary;
  this.time = new Date(obj.time * 1000).toDateString();
}

//trails
app.get('/trails', (request, response) =>{
  let { search_query,
    formatted_query,
    latitude,
    longitude, } = request.query;

  let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxResults=10&key=${process.env.HIKING_TRAIL_API}`; //insert trails url here

  superagent.get(url)
    .then(results =>{
      const dataObj = results.body.trails.map(trail=>new Trails(trail));
      response.status(200).send(dataObj);
    });

});


function Trails(obj){
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionStatus;
  this.condition_date = obj.conditionDate.slice(0,10);
  this.condition_time = obj.conditionDate.slice(11,19);
}

// turn on the server
app.listen(PORT, () => {
  console.log(`listening to ${PORT}`);
});