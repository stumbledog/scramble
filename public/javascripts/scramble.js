function Scramble(){
	this.socket = io.connect();
	//this.difficulty_level;
	//this.scrambled;





	initEventListener.call(this);

	function initEventListener(){
		$("#single_play").click(function(){
			this.selectLevel();
		}.bind(this));

		$("#multi_play").click(function(){
			this.multiplay();
		}.bind(this));

		$(".level").click(function(e){
			$target = $(e.target);
			this.difficulty_level = $target.val();
			this.start();
			//this.socket.emit('scrambled', $target.val());
		}.bind(this));

		this.socket.on('scrambled', function(res){
			this.renderScrambled(res);
			//console.log(res);
		}.bind(this));

		this.socket.on('submit', function(res){
			console.log(res);
		}.bind(this));

	};
}

Scramble.prototype.selectLevel = function(){
	$("#play-type").hide();
	$("#difficulty-level").show();
}

Scramble.prototype.start = function(){
	$("#difficulty-level").hide();
	$("#game").show();
	this.socket.emit('scrambled', $target.val());
}

Scramble.prototype.renderScrambled = function(word){
	$("#scrambled").html("");
	console.log(word);
	for(var i=0;i<word.scrambled.length;i++){
		$("#scrambled").append("<button class='btn btn-danger character'>"+word.scrambled[i]+"</button>")
	}
	$("#input").append("<div class='input-character active'></div>")

}

Scramble.prototype.multiplay = function(){
	$("#play-type").hide();
}

Scramble.prototype.submit = function(){
	this.socket.emit('submit', $target.val());
}

Scramble.prototype.getWord = function(){
	/*
	this.socket.emit('get shuffled word');
	this.socket.on('get shuffled word', function(res){
		console.log(res);
	});*/
	this.socket.emit('multiplay');
}