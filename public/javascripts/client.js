var WIDTH = 1100;
var HEIGHT = 580;
// This IP is hardcoded to my server, replace with your own
var socket = io.connect('http://127.0.0.1:3004');
var game = new Game('#arena', WIDTH, HEIGHT, socket);
var selectedBlob = 1;
var blobName = '';

socket.on('addBlob', function(blob){
	game.addBlob(blob.id, blob.type, blob.isLocal, blob.x, blob.y);
});

socket.on('sync', function(gameServerData){
	game.receiveData(gameServerData);
});

socket.on('removeBlob', function(blobId){
	game.removeBlob(blobId);
});

$(document).ready( function(){

	$('#join').click( function(){
		blobName = $('#blob-name').val();
		joinGame(blobName, selectedBlob, socket);
	});

	$('#blob-name').keyup( function(e){
		blobName = $('#blob-name').val();
		var k = e.keyCode || e.which;
		if(k == 13){
			joinGame(blobName, selectedBlob, socket);
		}
	});

	$('ul.blob-selection li').click( function(){
		$('.blob-selection li').removeClass('selected')
		$(this).addClass('selected');
		selectedBlob = $(this).data('blob');
	});

});

$(window).on('beforeunload', function(){
	socket.emit('leaveGame', blobName);
});

function joinGame(blobName, blobType, socket){
	if(blobName != ''){
		$('#prompt').hide();
		socket.emit('joinGame', {id: blobName, type: blobType});
	}
}
