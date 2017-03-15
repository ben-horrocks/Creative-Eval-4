var express = require('express');
var app = express();
var router = express.Router();

var WIDTH = 1100;
var HEIGHT = 580;
var BLOB_INIT_SCORE = 10;

// Static resources server
app.use(express.static(__dirname + '/public'));

var server = app.listen(3001, function() {
  var port = server.address().port;
  console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

function GameServer(){
  this.blobs = [];
}

GameServer.prototype = {
  addBlob: function(blob){
    this.blobs.push(blob);
  },

  removeBlob: function(blobId){
    //Remove blob object
    this.blobs = this.blobs.filter( function(b){return b.id != blob.Id});
  },

  // Sync tank with new data received from a client
  syncBlob: function(newBlobData){
    this.blobs.forEach( function(blob){
      if(blob.id == newBlobData.id){
        blob.x = newBlobData.x;
        blob.y = newBlobData.y;
      }
    });
  }
}

var game = new GameServer();

/* Connection events*/

io.on('connection', function(client) {
  console.log('User connected');

  client.on('joinGame', function(blob){
    console.log(blob.id + ' joined the game');
    var initX = getRandomInt(40, 900);
    var initY = getRandomInt(40, 500);
    client.emit('addBlob', { id: blob.id, color: blob.color, isLocal: true, x: initX, y:initY, score: BLOB_INIT_HP });
    client.broadcast.emit('addBlob', { id: blob.id, color: blob.color, isLocal: true, x: initX, y:initY, score: BLOB_INIT_SCORE });

    game.addBlob({ id: blob.id, color: blob.color, score: BLOB_INIT_SCORE});
  });
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = router;
