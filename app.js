
/////////////////////////////////
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('pantry.db');
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

//conditionel csrf function
function conditionalCSRFProtection(req, res, next) {
  if (['/createAccount'].includes(req.path)) {
    return next();
  }
  csrfProtection(req, res, next);
}

app.use(conditionalCSRFProtection);
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
app.post("/test", async (req, res, next) => {
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

app.post('/tester', (req, res) => {
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
// path to create account (handling new user)

app.get('/createAccount', (req, res) => {
  res.render('createPantry');
})
// password hasher is called in the path
app.post('/createAccount', (req, res) =>{
  const { username,  password } = req.body;

  db.get("SELECT * FROM users WHERE user_name=?", [username], function(error, row) {
    if(error) throw error;
  
    if(row) {
      console.log('user already exist');
      res.status(400).send('Name already taken');
    }else{
      passwordHasher(password, (error, hashedPassword) => {
        if(error){
          console.log('error hashing password', error);
          res.status(500).send('Error hashing password');
          return;
        }
        db.run("INSERT INTO users (user_name, user_password) VALUES (?, ?)", [username, hashedPassword], function(error) {
          if(error) {
            console.log(error);
            res.status(400).send('Error, try again');
            throw error;
          }else{ 
          console.log("User account added");
          res.redirect('/loginForm');
          }
        });
      });
    }
  });
});

/////////////////////////////////////////////////////////////////
// path to login to  pantry or create user from / 
app.get("/loginForm", (req, res) => {
  const csrfToken = req.csrfToken();
  res.render('loginPantry', { csrfToken });
});

// get path for loginPantry
app.get('/loginPantry', (req, res) => {
  const csrfToken = req.csrfToken();
  res.render('loginPantry', { csrfToken });
})
//path to loginPantry
app.post("/login", (req, res, next) => {
  passport.authenticate('local', (error, user, info) =>{
    if(error){
      return next(error);
    }
    if(!user) {
      res.status(400).send('User dont exist please create one')
      return res.redirect('/createAccount');
    }
    req.login(user, (error) => {
      if(error) {
        return next(error);
      }
      return res.redirect('/myPantry');
    });
  })(req, res, next);
});

//myPantry path 
app.get('/myPantry', (req, res) => {
   if (req.user) {
    const csrfToken = req.csrfToken();
    const user = req.user;
    res.render('myPantry', {user , csrfToken});
   }else{
    res.render('loginPantry');
   }
});

//logout button
app.post('/logout', (req, res) => {
  const csrfToken = req.csrfToken();
  req.logout(function(err) {
    if(err) {
      console.log(err);
    }
  });
  console.log(req.user);
  res.render('loginPantry', { csrfToken });
});




//////////////////////////////////////
//start the app/server listening upcoming request
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});
