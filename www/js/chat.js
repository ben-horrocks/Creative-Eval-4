    jQuery(function($){
      var socket = io.connect();
      var $messageForm = $('#send-message');
      var $messageBox = $('#message');
      var $chat = $('#chat');
      $messageForm.submit(function(e){
        e.preventDefault();
        socket.emit('send message', $messageBox.val(), $('#blob-name').val());
        console.log("I sent a message");
        $messageBox.val('');
      });
    
      socket.on('new message', function(data, blobname){
        var newMessage = blobname;
        newMessage += ": ";
          console.log("I got here");
        for(var i = 0; i < data.length; i++){
          if(data.charAt(i) != 'a' && data.charAt(i) != 'e' && data.charAt(i) != 'i' && data.charAt(i) != 'o' && data.charAt(i) != 'u'){
            newMessage += data.charAt(i);
          }
        }
        $chat.append(newMessage + "<br/>");
      });
    });
