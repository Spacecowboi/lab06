'use strict';
require('dotenv').config();

// brings in the expresss library which is our server
const express = require('express');

const pg = require('pg');

// instantiates the express library in app
const app = express();



// the policeman - lets the server know that it is OK to give information to the front end
const cors = require('cors');
app.use(cors());

// get the port from the env
const PORT = process.env.PORT || 3002;

// server set up(means by which we get INTO the sytem)
const database = new pg.Client(process.env.DATABASE_URL);
database.on('error', err => console.error(err));


const superagent = require('superagent');

//cities

app.get('/location', (request, response) => {

  let city = request.query.city;
  let sql = 'SELECT * FROM locations WHERE search_query=$1;';
  let safeValues = [city];
  database.query(sql, safeValues)
    .then (results => {
      if(results.rows.length > 0){
        response.send(results.row[0]);
      } else {
        console.log('did not find city in db');
        let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`;
        superagent.get(url)
          .then(results => {
            let geoData = results.body;
            let location = new City(city, geoData[0]);
            let sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            let safeValues = [location.search_query, location.formatted_query, location.latitude, location.longitude];
            database.query(sql, safeValues);
            response.status(200).send(location);
          });
      }
    });
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

//movies
app.get('/movies', (request, response) =>{
  let movieLocation = request.query.search_query;
  console.log(request.search.query);
  let url = `https://api.themoviedb.org/3/search/movie/?api_key=${process.env.MOVIE_DB-API}&language=en-US&page=1&query=${movieLocation}`;
  superagent.get(url)
    .then(results =>{
      let movieData = results.results;
      let movieResults = movieData.map((data) => (new Movie(data)));
      response.status(200).send(movieResults);
    })
    .catch(err =>{
      console.error(err);
      response.status(500).send(err);
    });
});



app.get('/yelp', handleYelp);

function handleYelp(request, response){
  console.log(request.query);//gathers data from front end to create url
  let city = request.query.search_query;
  let url = `https://api.yelp.com/v3/businesses/search?location=${city}`;

  superagent.get(url)
    .set('Authorization', `Bearer${process.env.YELP_API_KEY}`)
    .then(results =>{
      console.log(results.body);
      let dataObj = results.body.businesses.map(business => {
        return new Yelper(business);
      });
      response.status(200).send(dataObj);
    });
}
//yelp constructor
function Yelper(obj){
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}
//movie Constructor

function Movie(data){
  this.title = data.title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url ='https://image.tmdb.org/t/p/w500' + data.poster_path;
  this.popularity = data.popularity;
  this.released_on =  data.release_date;
}


//trails

app.get('/trails', (request, response) =>{
  let { search_query,
    formatted_query,
    latitude,
    longitude, } = request.query;

  let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxResults=10&key=${process.env.HIKING_TRAIL_API}`;
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

app.get('/display', (request, response) =>{
  let SQL = 'SELECT * FROM people';

  database.query(SQL)
    .then(results => {
      response.json(results.rows);
    });
});

database.connect()
  .then(
    app.listen(PORT, () => console.log(`listening on ${PORT}`))
  );
