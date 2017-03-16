var INTERVAL=50;

function Game(arenaId, w, h, socket)
{
	this.blobs = [];
	this.width = w;
	this.height = h;
	this.$arena = $(arenaId);
	this.$arena.css('width', w);
	this.$arena.css('height', h);
	this.socket = socket;

	setInterval(function()
	{
          this.mainLoop();
	}, INTERVAL);
}

Game.prototype = {

        addBlob: function(id, type, isLocal, x, y, hp){
                var t = new Blob(id, type, this.$arena, this, isLocal, x, y);
                if(isLocal){
                        this.localBlob = t;
                }else{
                        this.blobs.push(t);
                }
        },

        removeBlob: function(blobId){
                //Remove blob object
                this.blobs = this.blobs.filter( function(t){return t.id != blobId} );
                //remove blob from dom
                $('#' + blobId).remove();
                $('#info-' + blobId).remove();
        },
	
	mainLoop: function()
	{
		if(this.localBlob != undefined)
		{
		  this.sendData();
		}
                if(this.localBlob != undefined){
                        //move local tank
                        this.localBlob.move();
                }


	},

        sendData: function(){
                //Send local data to server
                var gameData = {};

                //Send blob data
                var t = {
                        id: this.localBlob.id,
                        x: this.localBlob.x,
                        y: this.localBlob.y,
                };
                gameData.blob = t;
                //the server controls that part
                this.socket.emit('sync', gameData);
        },

        receiveData: function(serverData){
                var game = this;

                serverData.blobs.forEach( function(serverBlob){

                        
                        //Update foreign blobs
                        var found = false;
                        game.blobs.forEach( function(clientBlob){
                                //update foreign tanks
                                if(clientBlob.id == serverBlob.id){
                                        clientBlob.x = serverBlob.x;
                                        clientBlob.y = serverBlob.y;
                                        clientBlob.refresh();
                                        found = true;
                                }
                        });
                        if(!found &&
                                (game.localBlob == undefined || serverBlob.id != game.localBlob.id)){
                                //I need to create it
                                game.addBlob(serverBlob.id, serverBlob.type, false, serverBlob.x, serverBlob.y);
                        }
                });
	}

}



function Blob(id, type, $arena, game, isLocal, x, y){
        this.id = id;
        this.type = type;
        this.speed = 5;
        this.$arena = $arena;
        this.w = 60;
        this.h = 80;
        this.x = x;
        this.y = y;
        this.dir = [0, 0, 0, 0];
        this.game = game;
        this.isLocal = isLocal;

        this.materialize();
}

Blob.prototype = {

        materialize: function(){
                this.$arena.append('<div id="' + this.id + '" class="tank tank' + this.type + '"></div>');
                this.$body = $('#' + this.id);
                this.$body.css('width', this.w);
                this.$body.css('height', this.h);

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
                });

        },

        move: function(){

                var moveX = this.speed * this.dir[0];
                var moveY = this.speed * this.dir[1]
                if(this.x + moveX > (0 + ARENA_MARGIN) && (this.x + moveX) < (this.$arena.width() - ARENA_MARGIN)){
                        this.x += moveX;
                }
                if(this.y + moveY > (0 + ARENA_MARGIN) && (this.y + moveY) < (this.$arena.height() - ARENA_MARGIN)){
                        this.y += moveY;
                }
                this.refresh();
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

