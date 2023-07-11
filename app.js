//////////////////////////////////
//sqlite connection 
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('');
/////////////////////////////////
// express
const express = require('express');
const app = express();
const port = 3000;


app.use(express.urlencoded({ extended: true}));