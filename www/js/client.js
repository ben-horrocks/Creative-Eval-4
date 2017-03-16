var WIDTH = 1100;
var HEIGHT = 580;
// This IP is hardcoded to my server, replace with your own
var socket = io.connect('http://ec2-35-166-225-32.us-west-2.compute.amazonaws.com:3004/');
var game = new Game('#arena', WIDTH, HEIGHT, socket);
var selectedblob = 1;
var blobName = '';

socket.on('addblob', function(blob){
	game.addblob(blob.id, blob.type, blob.isLocal, blob.x, blob.y);
});

socket.on('sync', function(gameServerData){
	game.receiveData(gameServerData);
});

socket.on('killblob', function(blobData){
	game.killblob(blobData);
});

socket.on('removeblob', function(blobId){
	game.removeblob(blobId);
});

$(document).ready( function(){

	$('#join').click( function(){
		blobName = $('#blob-name').val();
		joinGame(blobName, selectedblob, socket);
	});

	$('#blob-name').keyup( function(e){
		blobName = $('#blob-name').val();
		var k = e.keyCode || e.which;
		if(k == 13){
			joinGame(blobName, selectedblob, socket);
		}
	});

	$('ul.blob-selection li').click( function(){
		$('.blob-selection li').removeClass('selected')
		$(this).addClass('selected');
		selectedblob = $(this).data('blob');
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
