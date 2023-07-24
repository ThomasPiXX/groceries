/////////////////////////////////
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('pantry.db')
// express
const express = require('express');
const app = express();
const port = 3000;
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(express.urlencoded({ extended: true}));
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());
//ejs
// Set view engine
app.set('view engine', 'ejs');
const path = require('path');
app.set('views', path.join(__dirname, 'view'));
///////////////////////////////////
//open AI API
const openai = require('openai');
openai.apiKey = '';
///////////////////////////////////
//midware
// csurftoken
const csrf = require('csurf');
const csrfProtection = csrf({
  cookie:{
    key: '_csrf-my-app',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600 // 1hour
  }});
app.use(csrfProtection);
//crypto password for session key
const crypto = require('crypto');

// generate a random secret key
function generateSecretKey() {
  const secretKey = crypto.randomBytes(32).toString('hex');
  return secretKey;
}
app.use(session({
  secret: generateSecretKey(),
  resave: false,
  saveUninitialized: false
}));
// setuping passport local strategy
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
//hashing  solution for passpword storage 
const bcrypt = require('bcryptjs');
//passport configuration
app.use(passport.initialize());
app.use(passport.session());
//serialize the user object
passport.serializeUser((user, done) => {
  console.log('serialize user:', user);
  done(null, user.user_name);
})

//deserialize
passport.deserializeUser((username, done) =>{
  db.get('SELECT * FROM users WHERE user_name = ?', [username], (error, row) => {
    if(error) {
      return done(error);
    }
    if (!row) {
      return done(error);
    }
    const user = {
      name : row.user_name
    };
    console.log('Deserialize User :', user);
    return done(null, user);
  });
});
//Passport strategy
passport.use(new localStrategy((username, password, done) => {
  db.get("SELECT * FROM users WHERE user_name = ?",[username], (error, rows) => {
    if(error) {
      return done(error);
    }
    if(!rows){
      return done(null, false, { template: 'createAccount'});
    }
    bcrypt.compare(password, rows.user_password, (error, isMatch) => {
      if (error) {
        return done(error);
      }
      if (!isMatch) {
        return done(null, false, { template: 'createAccount' });
      }
      console.log(isMatch);
      return done(null, rows ,{ template:'myPantry' });
    });
  });
}));
//function for hashing password for DB
function passwordHasher(password, done){

  if (!password) {
      const error = new Error('Invalid password/ no password');
      return done(error);
  }
  //Generate a salt to use for hashing
  bcrypt.genSalt(10, (err, salt) =>{
      if (err) return done(err);

      //hash the password using the generated salt 
      bcrypt.hash(password, salt, (err, hash) => {
          if (err) return done(err);

          done(null, hash);
      })
  })
}




app.get("/", (req, res) => {
    res.render('list');
});

app.get("/List", (req, res) => {
    res.render('list');
});

////////////////////////////////////////////////////
// Open AI solution 
app.post("/sortList", async (req, res, next) => {
    const { recipe } = req.body;
  
    try {
      const response = await openai.Completion.create({
        engine: '', /*'text-embedding-ada-002'*/ // Specify the engine
        prompt: "Please sort the ingredients into the appropriate grocery sections:\n\n" + recipe,// Pass the recipe as the prompt for the model
        max_tokens: 100, // Specify the desired response length
      });
  
      const sortedGroceryList = response.choices[0].text.trim();
  
      res.json(sortedGroceryList);
    } catch (error) {
      next(error);
    }
  });
  
/////////////////////////////////////////////////
//LlaMa solution 

app.post('submitForm', (req, res) => {
  const recipe = req.body.recipe; // retrieve the recipe from the form 
  const data = { recipe }; // create an object to send to flask 

  //Make a POST  request to flask server
  axios.post('http://localhost:5000/processRecipe', data)
    .then(response => {
      //handle the response from Flask server
      const sortedList = response.data.sotedList;
      res.render('result', { sortedList });
      })
    .catch(error => {
      console.error(error);
      res.render('error'); // render an error page if there's an issue 
    });
});


/////////////////////////////////////////////////////////////////
// path for my pantry 

app.get("/MyPantry", (req, res) => {
  res.render('loginPantry');
});




//////////////////////////////////////
//start the app/server listening upcoming request
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});
