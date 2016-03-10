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
  var populateRecipes = function () {
    userRef.child('recipes').once('value', function(data) {
      var recipes = data.val();
      if (recipes) {
        var recipeKeys = Object.keys(recipes);
        var recipeDiv = $('#recipes');
        recipeDiv.html('');
        var row = $('<div class="row"></div>');
        for (var i = 0; i < recipeKeys.length; i++) {
          var recipe = recipes[recipeKeys[i]];
          var newRecipe = $('\
            <div class="recipe-container four columns">\
                <h5>' + recipe.name + '</h5>\
                <h6>Ingredients</h6>\
                <ul>\
                </ul>\
                <h6>Directions</h6>\
                <p>' + recipe.directions + '</p>\
            </div>');
          for (var j = 0; j < recipe.ingredients.length; j++) {
            newRecipe.children('ul').eq(0).append($('<li>' + recipe.ingredients[j] + '</li>'));
          }
          newRecipe.click(function (e) {
            var overlay = $('#overlay');
            var hideOverlay = function () {
              overlay.addClass('hidden');
              $('#recipe-overlay').addClass('hidden');
              this.removeEventListener('click', hideOverlay);
            };
            overlay.removeClass('hidden');
            overlay.click(hideOverlay);
            $('#recipe-overlay').html($(this).html());
            $('#recipe-overlay').removeClass('hidden');
          })
          row.append(newRecipe);
          if (!((i + 1) % 3)) { // Start new row every 3 recipes
            recipeDiv.append(row);
            row = $('<div class="row"></div>');
          }
        }
        if (recipeKeys.length % 3) {
          recipeDiv.append(row);
        }
      }
    });
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
              <p>' + pantryItems[pantryItemKeys[i]] + '</p>\
            </div>');
          pantryDiv.append(newItem);
        }
      }
    });
  };
  var addEvents = function () {
    $('nav button').click(function (e) {
      var mains = $('main');
      var displayedMain = $('main:not(.hidden)');
      var nextMain = $('#' + $(this).attr('name'));
      $('nav button.button-primary').removeClass('button-primary');
      $(this).addClass('button-primary');
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
    $('#add-pantry').click(function (e) {
      $('#pantry-form').removeClass('hidden');
    });
    $('#ingredient-submit').click(function (e) {
      e.preventDefault();
      userRef.child('pantry').push('test');
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
    populateRecipes();
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
