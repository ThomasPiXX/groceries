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
///////////////////////////////////
//open AI API
const openai = require('openai');
openai.apiKey = '';






app.get("/", (req, res) => {
    res.render('list');
});

app.get("/List", (req, res) => {
    res.render('list');
});


app.post("/sortList", async (req, res, next) => {
    const { recipe } = req.body;
  
    try {
      const response = await openai.Completion.create({
        engine: 'text-embedding-ada-002', // Specify the ada v2 engine
        prompt: "Please sort the ingredients into the appropriate grocery sections:\n\n" + recipe,// Pass the recipe as the prompt for the model
        max_tokens: 100, // Specify the desired response length
      });
  
      const sortedGroceryList = response.choices[0].text.trim();
  
      res.json(sortedGroceryList);
    } catch (error) {
      next(error);
    }
  });
  





















//////////////////////////////////////
//start the app/server listening upcoming request
//start the app/server listening upcoming request
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});
