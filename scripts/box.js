(function () {
  var db = new Firebase('https://amber-heat-7646.firebaseio.com');
  var userAuthorized = function (authData) {
    $('nav').removeClass('hidden');
    $('#box').removeClass('hidden');
    $('#login').addClass('hidden');

    var userData = new User(authData.uid);
    $('#add-ingredient').click(function (e) {
      e.preventDefault();
      var row = $('<div class="row"></div>')
      row.append($('<input class="row" type="text" name="ingredient">'));
      $('#ingredient-list').append(row);
    });
  };

  function User (id) {
    this.id = id;
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
            console.log(authData);
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
