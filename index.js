var express = require('express');
var app = express();
var counter = 0;
var WIDTH = 1100;
var HEIGHT = 580;

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 3004, function () {
	var port = server.address().port;
	console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

function GameServer(){
	this.blobs = [];
}

GameServer.prototype = {

	addblob: function(blob){
		this.blobs.push(blob);
	},

	removeblob: function(blobId){
		//Remove blob object
		this.blobs = this.blobs.filter( function(t){return t.id != blobId} );
	},

	//Sync blob with new data received from a client
	syncblob: function(newblobData){
		this.blobs.forEach( function(blob){
			if(blob.id == newblobData.id){
				blob.x = newblobData.x;
				blob.y = newblobData.y;
				blob.baseAngle = newblobData.baseAngle;
			}
		});
	},

	getData: function(){
		var gameData = {};
		gameData.blobs = this.blobs;

		return gameData;
	},


}

var game = new GameServer();

/* Connection events */

io.on('connection', function(client) {
	console.log('User connected');

	client.on('joinGame', function(blob){
		console.log(blob.id + ' joined the game');
		var initX = getRandomInt(40, 900);
		var initY = getRandomInt(40, 500);
		client.emit('addblob', { id: blob.id, type: blob.type, isLocal: true, x: initX, y: initY});
		client.broadcast.emit('addblob', { id: blob.id, type: blob.type, isLocal: false, x: initX, y: initY} );

		game.addblob({ id: blob.id, type: blob.type});
	});

	client.on('sync', function(data){
		//Receive data from clients
		if(data.blob != undefined){
			game.syncblob(data.blob);
		}
		//Broadcast data to clients
		client.emit('sync', game.getData());
		client.broadcast.emit('sync', game.getData());

		//I do the cleanup after sending data, so the clients know
		counter ++;
	});

	client.on('leaveGame', function(blobId){
		console.log(blobId + ' has left the game');
		game.removeblob(blobId);
		client.broadcast.emit('removeblob', blobId);
	});

    client.on('send message', function(data, blobname){
    io.sockets.emit('new message', data, blobname);
    //socket.broadcast.emit('new message', data); //Sends the message to everyone
    // except for the sender
    });

});

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
