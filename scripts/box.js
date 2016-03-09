(function () {
  var db = new Firebase(config.FIREBASE_API);

  var populateRecipes = function (userRef) {
    userRef.child('recipes').once('value', function(data) {
      var recipes = data.val();
      var recipeKeys = Object.keys(recipes);
      var recipeDiv = $('#recipes');
      var row = $('<div class="row"></div>');
      for (var i = 0; i < recipeKeys.length; i++) {
        var recipe = recipes[recipeKeys[i]];
        var newRecipe = $('\
          <div class="recipe-container four columns">\
              <h4>' + recipe.name + '</h4>\
              <h5>Ingredients</h5>\
              <ul>\
              </ul>\
              <h5>Directions</h5>\
              <p>' + recipe.directions + '</p>\
          </div>');
        for (var j = 0; j < recipe.ingredients.length; j++) {
          newRecipe.children('ul').eq(0).append($('<li>' + recipe.ingredients[j] + '</li>'));
        }
        row.append(newRecipe);
        if (!((i + 1) % 3)) { // Start new row every 3 recipes
          recipeDiv.append(row);
          row = $('<div class="row"></div>');
        }
      }
      if (recipeKeys.length % 3) {
        recipeDiv.append(row);
      }
    });
  };
  var userAuthorized = function (authData) {
    var userRef = db.child('users/' + authData.uid);
    $('nav').removeClass('hidden');
    $('#box').removeClass('hidden');
    $('#login').addClass('hidden');
    $('#add-recipe').click(function (e) {
      $('#recipe-form').removeClass('hidden');
    });
    $('#add-ingredient').click(function (e) {
      e.preventDefault();
      var row = $('<div class="row"></div>')
      row.append($('<input class="row" type="text" name="ingredient">'));
      $('#ingredient-list').append(row);
    });
    $('#recipe-submit').click(function (e) {
      e.preventDefault();
      userRef.once('value', function(data) {
        var userData = data.val();
        var name = $('#recipe-name').val();
        var directions = $('#directions').val();
        var ingredientNodes = $('input[name="ingredient"]');
        var ingredients = {};
        for (var i = 0; i < ingredientNodes.length; i++) {
          ingredients[i] = ingredientNodes[i].value;
        }
        userRef.update({ recipeCount: userData.recipeCount + 1 });
        userRef.child('recipes').push({
          name: name,
          ingredients: ingredients,
          directions: directions
        });
      });
    });

    populateRecipes(userRef);
  };

  function User (id, recipes) {
    this.id = id;
    this.recipes = recipes;
  }

  $(document).ready(function () {
    $('#login-submit').click(function (e) {
      e.preventDefault();
      var email = $('#login-email').val();
      var password = $('#login-password').val();
      db.authWithPassword({
          email: email,
          password: password
        }, function(error, authData) {
          if (!error) {
            userAuthorized(authData);
          } else {
            console.log(error);
          }
        }, {
          remember: "sessionOnly"
      });
    });
  });
})();
