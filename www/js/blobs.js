var DEBUG = true;
var INTERVAL = 50;
var ROTATION_SPEED = 5;
var ARENA_MARGIN = 30;

function Game(arenaId, w, h, socket){
	this.blobs = []; //blobs (other than the local blob)
	this.width = w;
	this.height = h;
	this.$arena = $(arenaId);
	this.$arena.css('width', w);
	this.$arena.css('height', h);
	this.socket = socket;

	var g = this;
	setInterval(function(){
		g.mainLoop();
	}, INTERVAL);
}

Game.prototype = {

	addblob: function(id, type, isLocal, x, y){
		var t = new blob(id, type, this.$arena, this, isLocal, x, y);
		if(isLocal){
			this.localblob = t;
		}else{
			this.blobs.push(t);
		}
	},

	removeblob: function(blobId){
		//Remove blob object
		this.blobs = this.blobs.filter( function(t){return t.id != blobId} );
		//remove blob from dom
		$('#' + blobId).remove();
		$('#info-' + blobId).remove();
	},

	killblob: function(blob){
		blob.dead = true;
		this.removeblob(blob.id);
		//place explosion
		this.$arena.append('<img id="expl' + blob.id + '" class="explosion" src="./img/explosion.gif">');
		$('#expl' + blob.id).css('left', (blob.x - 50)  + 'px');
		$('#expl' + blob.id).css('top', (blob.y - 100)  + 'px');

		setTimeout(function(){
			$('#expl' + blob.id).remove();
		}, 1000);

	},

	mainLoop: function(){
		if(this.localblob != undefined){
			this.sendData(); //send data to server about local blob
		}

		if(this.localblob != undefined){
			//move local blob
			this.localblob.move();
		}

	},

	sendData: function(){
		//Send local data to server
		var gameData = {};

		//Send blob data
		var t = {
			id: this.localblob.id,
			x: this.localblob.x,
			y: this.localblob.y,
			baseAngle: this.localblob.baseAngle,
		};
		gameData.blob = t;
		//the server controls that part
		this.socket.emit('sync', gameData);
	},

	receiveData: function(serverData){
		var game = this;

		serverData.blobs.forEach( function(serverblob){


			//Update foreign blobs
			var found = false;
			game.blobs.forEach( function(clientblob){
				//update foreign blobs
				if(clientblob.id == serverblob.id){
					clientblob.x = serverblob.x;
					clientblob.y = serverblob.y;
					clientblob.baseAngle = serverblob.baseAngle;
					clientblob.refresh();
					found = true;
				}
			});
			if(!found &&
				(game.localblob == undefined || serverblob.id != game.localblob.id)){
				//I need to create it
				game.addblob(serverblob.id, serverblob.type, false, serverblob.x, serverblob.y);
			}
		});

	}
}

function blob(id, type, $arena, game, isLocal, x, y){
	this.id = id;
	this.type = type;
	this.speed = 5;
	this.$arena = $arena;
	this.w = 60;
	this.h = 80;
	this.baseAngle = getRandomInt(0, 360);
	//Make multiple of rotation amount
	this.baseAngle -= (this.baseAngle % ROTATION_SPEED);
	this.x = x;
	this.y = y;
	this.dir = [0, 0, 0, 0];
	this.game = game;
	this.isLocal = isLocal;
	this.dead = false;

	this.materialize();
}

blob.prototype = {

	materialize: function(){
		this.$arena.append('<div id="' + this.id + '" class="blob blob' + this.type + '"></div>');
		this.$body = $('#' + this.id);
		this.$body.css('width', this.w);
		this.$body.css('height', this.h);

		this.$body.css('-webkit-transform', 'rotateZ(' + this.baseAngle + 'deg)');
		this.$body.css('-moz-transform', 'rotateZ(' + this.baseAngle + 'deg)');
		this.$body.css('-o-transform', 'rotateZ(' + this.baseAngle + 'deg)');
		this.$body.css('transform', 'rotateZ(' + this.baseAngle + 'deg)');


		this.$arena.append('<div id="info-' + this.id + '" class="info"></div>');
		this.$info = $('#info-' + this.id);
		this.$info.append('<div class="label">' + this.id + '</div>');

		this.refresh();

		if(this.isLocal){
			this.setControls();
		}
	},

	isMoving: function(){
		if(this.dir[0] != 0 || this.dir[1] != 0){
			return true;
		}
		return false;
	},

	refresh: function(){
		this.$body.css('left', this.x - 30 + 'px');
		this.$body.css('top', this.y - 40 + 'px');
		this.$body.css('-webkit-transform', 'rotateZ(' + this.baseAngle + 'deg)');
		this.$body.css('-moz-transform', 'rotateZ(' + this.baseAngle + 'deg)');
		this.$body.css('-o-transform', 'rotateZ(' + this.baseAngle + 'deg)');
		this.$body.css('transform', 'rotateZ(' + this.baseAngle + 'deg)');

		this.$info.css('left', (this.x) + 'px');
		this.$info.css('top', (this.y) + 'px');
		if(this.isMoving()){
			this.$info.addClass('fade');
		}else{
			this.$info.removeClass('fade');
		}

	},

	setControls: function(){
		var t = this;

		/* Detect both keypress and keyup to allow multiple keys
		 and combined directions */
		$(document).keypress( function(e){
			var k = e.keyCode || e.which;
			switch(k){
				case 119: //W
					t.dir[1] = -1;
					break;
				case 100: //D
					t.dir[0] = 1;
					break;
				case 115: //S
					t.dir[1] = 1;
					break;
				case 97: //A
					t.dir[0] = -1;
					break;
			}

		}).keyup( function(e){
			var k = e.keyCode || e.which;
			switch(k){
				case 87: //W
					t.dir[1] = 0;
					break;
				case 68: //D
					t.dir[0] = 0;
					break;
				case 83: //S
					t.dir[1] = 0;
					break;
				case 65: //A
					t.dir[0] = 0;
					break;
			}
		}).mousemove( function(e){ //Detect mouse for aiming
			var mx = e.pageX - t.$arena.offset().left;
			var my = e.pageY - t.$arena.offset().top;
		});

	},

	move: function(){
		if(this.dead){
			return;
		}

		var moveX = this.speed * this.dir[0];
		var moveY = this.speed * this.dir[1]
		if(this.x + moveX > (0 + ARENA_MARGIN) && (this.x + moveX) < (this.$arena.width() - ARENA_MARGIN)){
			this.x += moveX;
		}
		if(this.y + moveY > (0 + ARENA_MARGIN) && (this.y + moveY) < (this.$arena.height() - ARENA_MARGIN)){
			this.y += moveY;
		}
		this.rotateBase();
		this.refresh();
	},

	/* Rotate base of blob to match movement direction */
	rotateBase: function(){
		if((this.dir[0] == 1 && this.dir[1] == 1)
			|| (this.dir[0] == -1 && this.dir[1] == -1)){ //diagonal "left"
			this.setDiagonalLeft();
		}else if((this.dir[0] == 1 && this.dir[1] == -1)
			|| (this.dir[0] == -1 && this.dir[1] == 1)){ //diagonal "right"
			this.setDiagonalRight();
		}else if(this.dir[1] == 1 || this.dir[1] == -1){ //vertical
			this.setVertical();
		}else if(this.dir[0] == 1 || this.dir[0] == -1){  //horizontal
			this.setHorizontal();
		}

	},

	/* Rotate base until it is vertical */
	setVertical: function(){
		var a = this.baseAngle;
		if(a != 0 && a != 180){
			if(a < 90 || (a > 180 && a < 270)){
				this.decreaseBaseRotation();
			}else{
				this.increaseBaseRotation();
			}
		}
	},

	/* Rotate base until it is horizontal */
	setHorizontal: function(){
		var a = this.baseAngle;
		if(a != 90 && a != 270){
			if(a < 90 || (a > 180 && a < 270)){
				this.increaseBaseRotation();
			}else{
				this.decreaseBaseRotation();
			}
		}
	},

	setDiagonalLeft: function(){
		var a = this.baseAngle;
		if(a != 135 && a != 315){
			if(a < 135 || (a > 225 && a < 315)){
				this.increaseBaseRotation();
			}else{
				this.decreaseBaseRotation();
			}
		}
	},

	setDiagonalRight: function(){
		var a = this.baseAngle;
		if(a != 45 && a != 225){
			if(a < 45 || (a > 135 && a < 225)){
				this.increaseBaseRotation();
			}else{
				this.decreaseBaseRotation();
			}
		}
	},

	increaseBaseRotation: function(){
		this.baseAngle += ROTATION_SPEED;
		if(this.baseAngle >= 360){
			this.baseAngle = 0;
		}
	},

	decreaseBaseRotation: function(){
		this.baseAngle -= ROTATION_SPEED;
		if(this.baseAngle < 0){
			this.baseAngle = 0;
		}
	},

}

function debug(msg){
	if(DEBUG){
		console.log(msg);
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function getGreenToRed(percent){
	r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
	g = percent>50 ? 255 : Math.floor((percent*2)*255/100);
	return 'rgb('+r+','+g+',0)';
}
