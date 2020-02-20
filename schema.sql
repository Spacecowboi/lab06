DROP TABLE IF EXISTS people;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC (10, 7),
    longitude NUMERIC (10, 7),
    

);

INSERT INTO locations (id, search_query, latitude, longitude) VALUES ();

SELECT * FROM people;