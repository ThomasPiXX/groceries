from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/processRecipe', methods=['POST'])
def process_recipe():
    recipe = request.json['recipe'] # retrive the recipe data from the rquest
    # Process the recipe and Obtain the sorted list
    sorted_list = generated_sorted_list(recipe)
    return jsonify(sortedList = sorted_list) #return the sorted list as a JSON response
 
