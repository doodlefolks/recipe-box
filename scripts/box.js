(function () {
  var db = new Firebase(config.FIREBASE_API);
  var userAuthorized = function (authData) {
    $('nav').removeClass('hidden');
    $('#box').removeClass('hidden');
    $('#login').addClass('hidden');

    var userData = new User(authData.uid);

    $('#add-recipe').click(function (e) {
      $('#recipe-form').removeClass('hidden');
    });
    $('#recipe-submit').click(function (e) {
      e.preventDefault();
      var userRef = db.child('users/' + authData.uid);
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
    $('#add-ingredient').click(function (e) {
      e.preventDefault();
      var row = $('<div class="row"></div>')
      row.append($('<input class="row" type="text" name="ingredient">'));
      $('#ingredient-list').append(row);
    });
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
