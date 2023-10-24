// Open AI solution 


/*
app.post("/test", async (req, res, next) => {
    const { translate } = req.body;
  
    try {
      const response = await openai.Completion.create({
        engine: '', //'text-embedding-ada-002'  Specify the engine
        prompt: "Please translate the whisper file in "that language" and fixing medical terminologies:\n\n" + translate,// Pass the recipe as the prompt for the model
        max_tokens: 100, // Specify the desired response length
      });
  
      const sortedGroceryList = response.choices[0].text.trim();
  
      res.json(sortedGroceryList);
    } catch (error) {
      next(error);
    }
  }); 
*/
  
////////
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