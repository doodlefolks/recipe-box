(function () {
  var db = new Firebase(config.FIREBASE_API);
  var userRef;

  var createNewUser = function (userData) {
    var newUser = {};
    newUser[userData.uid] = {
      recipeCount: 0
    };
    db.child('users').update(newUser);
  };
  var loginUser = function (email, password) {
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
  };
  var getRecipesMatchingPantry = function () {
    userRef.child('recipes').once('value', function (recipeData) {
      userRef.child('pantry').once('value', function (pantryData) {
        var pantry = pantryData.val();
        var recipes = recipeData.val();
        var pantryKeys = Object.keys(pantry);
        var recipeKeys = Object.keys(recipes);
        var pantryItems = [];
        for (var i = 0; i < pantryKeys.length; i++) {
          pantryItems.push(pantry[pantryKeys[i]]);
        }
        var matchingRecipes = {};
        var matches;
        for (var i = 0; i < recipeKeys.length; i++) {
          matches = true;
          var ingredients = recipes[recipeKeys[i]].ingredients;
          var ingredientKeys = Object.keys(ingredients);
          for (var j = 0; j < ingredientKeys.length; j++) {
            if (pantryItems.indexOf(ingredients[ingredientKeys[j]]) === -1) {
              matches = false;
            }
          }
          if (matches) {
            matchingRecipes[recipeKeys[i]] = recipes[recipeKeys[i]];
          }
        }
        populateRecipes(matchingRecipes, '#recipes2');
      });
    });
  };
  var getRecipesAndPopulate = function () {
    userRef.child('recipes').once('value', function (data) {
      populateRecipes(data.val(), '#recipes');
    });
  };
  var populateRecipes = function (recipes, appendToDiv) {
    if (recipes) {
      var recipeKeys = Object.keys(recipes);
      var recipeDiv = $(appendToDiv);
      recipeDiv.html('');
      var row = $('<div class="row"></div>');
      for (var i = 0; i < recipeKeys.length; i++) {
        var recipe = recipes[recipeKeys[i]];
        var newRecipe = $('\
          <div class="recipe-container">\
              <h5>' + recipe.name + '</h5>\
              <h6>Ingredients</h6>\
              <ul>\
              </ul>\
              <h6>Directions</h6>\
              <p>' + recipe.directions + '</p>\
          </div>');
        var recipeCard = $('\
          <div class="recipe-card four columns">\
            <h5>' + recipe.name + '</h5>\
          </div>');
        for (var j = 0; j < recipe.ingredients.length; j++) {
          newRecipe.children('ul').eq(0).append($('<li>' + recipe.ingredients[j] + '</li>'));
        }
        (function (newRecipeHtml, i) {
          recipeCard.click(function (e) {
            var overlay = $('#overlay');
            var hideOverlay = function () {
              overlay.addClass('hidden');
              $('#recipe-overlay').addClass('hidden');
              this.removeEventListener('click', hideOverlay);
            };
            overlay.removeClass('hidden');
            overlay.click(hideOverlay);
            $('#recipe-overlay').html(newRecipeHtml);
            var deleteButton = $('<button>Delete Recipe</button>');
            deleteButton.click(function (e) {
              userRef.child('recipes/' + recipeKeys[i]).remove(function () {
                getRecipesAndPopulate();
              });
            });
            $('#recipe-overlay').append(deleteButton);
            $('#recipe-overlay').removeClass('hidden');
          });
        })(newRecipe.html(), i);
        row.append(recipeCard);
        if (!((i + 1) % 3)) { // Start new row every 3 recipes
          recipeDiv.append(row);
          row = $('<div class="row"></div>');
        }
      }
      if (recipeKeys.length % 3) {
        recipeDiv.append(row);
      }
    }
  };
  var populatePantry = function () {
    userRef.child('pantry').once('value', function (data) {
      if (data.val()) {
        var pantryItems = data.val();
        var pantryItemKeys = Object.keys(pantryItems);
        var pantryDiv = $('#pantry-items');
        pantryDiv.html('');
        for (var i = 0; i < pantryItemKeys.length; i++) {
          var newItem = $('\
            <div class="row">\
              <span>' + pantryItems[pantryItemKeys[i]] + '</span>\
              <button>Delete</button>\
            </div>');
          (function (i) {
            newItem.find('button').click(function (e) {
              userRef.child('pantry/' + pantryItemKeys[i]).remove(function () {
                populatePantry();
              });
            });
          })(i);
          pantryDiv.append(newItem);
        }
      }
    });
  };
  var addEvents = function () {
    $('nav button').click(function (e) {
      var $this = $(this);
      var mains = $('main');
      var displayedMain = $('main:not(.hidden)');
      var nextMain = $('#' + $this.attr('name'));
      $('nav button.button-primary').removeClass('button-primary');
      $this.addClass('button-primary');
      if ($this.attr('name') === 'pantry') {
        populatePantry();
      } else if ($this.attr('name') === 'recipe-match') {
        getRecipesMatchingPantry();
      }
      if (parseInt(displayedMain.attr('value')) < parseInt(nextMain.attr('value'))) {
        displayedMain.addClass('fadeOutLeft animated');
        window.setTimeout(function () {
          displayedMain.addClass('hidden');
          displayedMain.removeClass('fadeOutLeft animated');
          nextMain.removeClass('hidden');
          nextMain.addClass('fadeInRight animated');
        }, 500);
      } else if (parseInt(displayedMain.attr('value')) > parseInt(nextMain.attr('value'))) {
        displayedMain.addClass('fadeOutRight animated');
        window.setTimeout(function () {
          displayedMain.addClass('hidden');
          displayedMain.removeClass('fadeOutRight animated');
          nextMain.removeClass('hidden');
          nextMain.addClass('fadeInLeft animated');
        }, 500);
      }
    });
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
      var name = $('#recipe-name').val();
      var directions = $('#directions').val();
      var ingredientNodes = $('input[name="ingredient"]');
      var ingredients = {};
      for (var i = 0; i < ingredientNodes.length; i++) {
        ingredients[i] = ingredientNodes[i].value;
      }
      userRef.once('value', function(data) {
        var userData = data.val();
        userRef.update({ recipeCount: userData.recipeCount + 1 });
        userRef.child('recipes').push({
          name: name,
          ingredients: ingredients,
          directions: directions
        }, function () {
          getRecipesAndPopulate();
        });
      });
      document.getElementById('recipe-form').reset();
      $('#recipe-form').addClass('hidden');
      $('#recipe-form input[name="ingredient"]').remove();
    });
    $('#add-pantry').click(function (e) {
      $('#pantry-form').removeClass('hidden');
    });
    $('#ingredient-submit').click(function (e) {
      e.preventDefault();
      var ingredientName = $('#ingredient-name').val();
      userRef.child('pantry').push(ingredientName);
      document.getElementById('pantry-form').reset();
      $('#pantry-form').addClass('hidden');
      populatePantry();
    });
  };
  var userAuthorized = function (authData) {
    userRef = db.child('users/' + authData.uid);
    $('nav').removeClass('hidden');
    $('#box').removeClass('hidden');
    $('#login').addClass('hidden');
    $('#new-user-form').addClass('hidden');
    addEvents();
    getRecipesAndPopulate();
  };

  $(document).ready(function () {
    $('#login-submit').click(function (e) {
      e.preventDefault();
      var email = $('#login-email').val();
      var password = $('#login-password').val();
      loginUser(email, password);
    });
    $('#new-user').click(function (e) {
      e.preventDefault();
      $('#login').addClass('hidden');
      $('#new-user-form').removeClass('hidden');
      $('#new-login-submit').click(function (e) {
        e.preventDefault();
        $('#overlay').removeClass('hidden');
        var email = $('#new-login-email').val();
        var password = $('#new-login-password').val();
        var passwordConfirm = $('#new-login-password-confirm').val();
        if (password === passwordConfirm) {
          db.createUser({
            email: email,
            password: password
          }, function(error, userData) {
            if (error) {
              switch (error.code) {
                case "EMAIL_TAKEN":
                  alert("The new user account cannot be created because the email is already in use.");
                  break;
                case "INVALID_EMAIL":
                  alert("The specified email is not a valid email.");
                  break;
                default:
                  alert("Error creating user");
                  console.log(error);
              }
              $('#overlay').addClass('hidden');
            } else {
              createNewUser(userData);
              alert("User created successfully");
              $('#overlay').addClass('hidden');
              loginUser(email, password);
            }
          });
        } else {
          alert('Passwords do not match');
        }
      });
    });
  });
})();
