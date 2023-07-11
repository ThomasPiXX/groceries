/////////////////////////////////
// express
const express = require('express');
const app = express();
const port = 3000;

//ejs
// Set view engine
app.set('view engine', 'ejs');
const path = require('path');
app.set('views', path.join(__dirname, 'view'));
//
app.use(express.urlencoded({ extended: true}));
app.use(express.json());




























//////////////////////////////////////
//start the app/server listening upcoming request
//start the app/server listening upcoming request
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});
