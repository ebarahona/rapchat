// Chats and stickers to show in the past
var BACK_HISTORY_MS = 60 * 1000;

$(function() {
  var room = getQueryParam('r') || 'public';
  var defaultName = 'anon' + parseInt(Math.random()*1000);
  var firebase = new Firebase('https://kqw8tijfs91.firebaseio-demo.com/' + room);

  // Initial values
  $('#name').val(defaultName);
  $('#room').val(room);
  firebase.push({name: defaultName, status: 'JOINED'});

  // Keydown listeners
  $('#message').keypress(function (e) {
    if (e.keyCode == 13) {
      var name = $('#name').val();
      var text = $('#message').val();
      if (text === '/clear') {
        $('#clear').trigger('click');
        return;
      }
      firebase.push({name: name, text: text, ts: Firebase.ServerValue.TIMESTAMP});
      $('#message').val('');
    }
  });
  $('#message').focus();

  $('#room').keypress(function (e) {
    if (e.keyCode == 13) {
      window.location.href = '?r=' + $('#room').val();
    }
  });

  // Rap buttons
  STICKERS.forEach(function(sticker) {
    var display = sticker.audio.slice(5, sticker.audio.indexOf('.'));
    $('<button>').text(display).data('slug', sticker.slug).appendTo($('#rapbuttons'));
  });


  $('#rapbuttons button').on('click', function() {
    var name = $('#name').val();
    firebase.push({
      name: name,
      sticker: $(this).text(),
      slug: $(this).data('slug'),
      ts: Firebase.ServerValue.TIMESTAMP
    });
  });

  $('#clear').on('click', function() {
    firebase.remove();
    $('#messages').empty();
  });

  $('#changeRoom').on('click', function() {
    window.location.href = '?r=' + prompt('Where to?', room);
  });

  // Firebase and chat stuff
  firebase.on('child_added', function(snapshot) {
    var message = snapshot.val();
    var partOfHistory = false;
    if (message.ts < new Date().getTime() - BACK_HISTORY_MS) {
      return;
    } else if (message.ts < new Date().getTime() - 5000) {
      partOfHistory = true;
    }
    console.log(message);

    if (message.status) {
      switch(message.status) {
        case 'JOINED':
          newMessage(message.name, 'has joined');
      }
    } else if (message.sticker) {
      // If it's in the past but we still want to show it, don't play noise.
      newSticker(message.name, message.sticker, message.slug, partOfHistory);
    } else {
      newMessage(message.name, message.text);
    }
  });

  function newMessage(name, text) {
    $('<p>').text(name + ': ' + text).appendTo($('#messages'));
    $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
  }

  function newSticker(name, sticker, slug, noPlay) {
    var audio = $('<audio>');
    $('<source>').attr('src', 'oggs/' + sticker + '.ogg').appendTo(audio);
    $('#messages').append(audio);

    var sticker = $('<div class="sticker artists-' + slug + '"></div>');
    $('<p>').append(name + ':').append(sticker).appendTo($('#messages'));
    $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;

    if (!noPlay) {
      audio[0].play();
    }

    sticker.on('click', function() {
      audio[0].play();
    });
  }
});

function getQueryParam(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
  results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
