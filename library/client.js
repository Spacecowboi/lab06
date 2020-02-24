'use strict';
const pg = require('pg');
const database = new pg.Client(process.env.DATABASE_URL);
database.on('error', err => console.error(err));