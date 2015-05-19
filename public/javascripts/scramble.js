function Scramble(){
	this.points = 0;
	this.best_points = 0;
	this.playing = false;
	this.online = false;
	this.socket = io.connect();

	initEventListener.call(this);

	function initEventListener(){
		// Socket response handlers
		this.socket.on("init", this.init.bind(this));
		this.socket.on("set host", this.setHost.bind(this));
		this.socket.on("change host", this.setHost.bind(this));
		this.socket.on("join room", this.joinRoom.bind(this));
		this.socket.on("client joined", this.clientJoined.bind(this));
		this.socket.on("client left", this.clientLeft.bind(this));
		this.socket.on("game start", this.play.bind(this));
		this.socket.on("update user name", this.updateUserName.bind(this));
		this.socket.on("best points", this.setBestPoints.bind(this));
		this.socket.on("clinet scrambled", this.renderClientScrambledWord.bind(this))
		this.socket.on("result of client submit", this.clientSubmitWordResult.bind(this));
		this.socket.on("client total points", this.renderClientTotalPoints.bind(this));
		this.socket.on("users order by points", this.renderLeaderboard.bind(this));
		this.socket.on("scrambled", this.renderScrambledWord.bind(this));

		this.socket.on("result of submit", function(res){
			if(this.socket.id === res.id && res.correct){
				this.correct(res);
			}else{
				this.worng();
			}
		}.bind(this));

		$("#user-name-submit").click(function(){
			this.socket.emit("set user name", $("#user_name_input").val());
		}.bind(this));

		$(".play").click(function(){
			if(!$("#game").hasClass("active")){
				this.singlePlay();
			}
		}.bind(this));

		$(".play-online").click(function(){
			if(!$("#online-game").hasClass("active")){
				this.playOnline();
			}
		}.bind(this));

		$(".leaderboard").click(function(){
			if(!$("#leaderboard").hasClass("active")){
				this.leaderboard();
			}
		}.bind(this));

		$(".site-wrapper").on("click", ".active .scrambled .character", this.input.bind(this));
		$(".site-wrapper").on("click", ".active .input .character", this.popSelectedCharacter.bind(this));

		$(document).on("keydown", this.keydown.bind(this));
	};
}

Scramble.prototype.init = function(res){
	this.best_points = res.best_points;
	this.user_id = res.user_id;
	$(".best-points").text(this.best_points + " pts");
	if(!res.user_name){
		this.typingUserName = true;
		$("#user_name_container").show();
		$("#home").hide();
		$("#user_name_input").focus();
	}else{
		this.user_name = res.user_name;
	}
}

Scramble.prototype.updateUserName = function(user_name){
	this.user_name = user_name;
	this.typingUserName = false;
	$("#user_name_container").hide();
	$("#home").show();
}

Scramble.prototype.singlePlay = function(){
	$(".character").remove();
	$("#home, #online-game, #leaderboard").hide();
	$("#game, #bottom-menu").show();
	$("#game").addClass("active");
	$("#online-game, #leaderboard").removeClass("active");

	if(this.online){
		this.leave();
	}

	this.playing = false;
	this.renderScrambledWord({scrambled:"Start"}, "start");

	clearInterval(this.interval);
}

Scramble.prototype.playOnline = function(){
	$(".character").remove();
	$("#home, #game, #leaderboard").hide();
	$("#online-game, #bottom-menu").show();
	$("#online-game").addClass("active");
	$("#game, #leaderboard").removeClass("active");
	this.online = true;
	this.playing = false;
	this.socket.emit('online');
	clearInterval(this.interval);
}

Scramble.prototype.leaderboard = function(){
	$("#home, #game, #online-game").hide();
	$("#leaderboard, #bottom-menu").show();
	$("#leaderboard").addClass("active");
	$("#game, #online-game").removeClass("active");

	if(this.online){
		this.leave();
	}
	this.playing = false;
	this.socket.emit('show leaderboard');
	clearInterval(this.interval);
}

Scramble.prototype.play = function(){
	$(".character").remove();
	this.playing = true;
	this.points = 0;
	$(".my-points").html("0 pts");
	this.socket.emit('get scrambled word');
	this.countDown(60);
}

Scramble.prototype.countDown = function(count){
	var start_time, now, remain_time, interval;

  	start_time = new Date();
  	clearInterval(this.interval);

	this.interval = setInterval(function(){
		now = new Date();
		remain_time = Math.ceil((count * 1000 - parseInt(now - start_time))/1000);

		$(".count").html(remain_time+"s");

		if(remain_time <= 0){
			clearInterval(this.interval);
			this.gameOver();
		}

	}.bind(this), 100);
}

Scramble.prototype.gameOver = function(){
	$(".character").remove();

	setTimeout(function(){
		var str = this.points+" Points";
		if(this.online && this.host !== this.socket.id){
			str.split("").forEach(function(character){
				$(".active .input").append("<button class='btn btn-default character'>"+character+"</button>");
			});
		}else{
			str.split("").forEach(function(character){
				$(".active .input").append("<button class='btn btn-default character start'>"+character+"</button>");
			});
			this.renderScrambledWord({scrambled:"Play Again"}, "start");			
		}
		this.playing = false;
		this.socket.emit('submit points',this.points);
	}.bind(this), 500);

}

Scramble.prototype.setBestPoints = function(best_points){
	this.best_points = best_points;
	$(".best-points").text(this.best_points + " pts");
}

Scramble.prototype.renderScrambledWord = function(word, class_name){
	$(".active .scrambled").html("");
	class_name = (typeof class_name === "undefined")?"":class_name;
	for(var i=0;i<word.scrambled.length;i++){
		$(".active .scrambled").append("<button class='btn btn-default character " + class_name + "'>"+word.scrambled[i]+"</button>")
	}
	$(".active .scrambled").addClass("bounceInUp");
	$(".active .scrambled").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e){
		$(this).removeClass("bounceInUp");
	});
}

Scramble.prototype.input = function(e){
	if(this.playing){
		if(typeof e === "string"){
			$(".active .scrambled .character").each(function(scrambled_character){
				if($(this).text() === e){
					$(".active .input").append(this);
					return false;
				}
			});
		}else{
			$(".active .input").append($(e.target));
		}

		if($(".active .scrambled .character").length === 0){
			var word = "";
			$(".active .input .character").each(function(){
				word += $(this).text();
			});
			if(word){
				this.socket.emit("submit unscrambled", word);
			}
		}
	}else{
		if($(e.currentTarget).hasClass("start")){
			this.socket.emit("request game start");
		}
	}
}

Scramble.prototype.popSelectedCharacter = function(e){
	if(this.playing){
		$(".active .scrambled").append($(e.target));
	}else{
		if($(e.currentTarget).hasClass("start")){
			this.socket.emit("request game start");
		}
	}
}

Scramble.prototype.correct = function(res){
	this.points = res.total_points;
	if(this.online){
		$("#mygame .points").html(this.points+" pts");
	}else{
		$("#game .points").html(this.points+" pts");
	}

	$(".active .input .character").addClass("fadeout");
	this.socket.emit('get scrambled word');
	$(".active .input").removeClass("typing").addClass("correct").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e){
		$(".fadeout").remove();
		$(this).removeClass("correct").addClass("typing");
	});
}

Scramble.prototype.worng = function(){
	$(".active .input").addClass("wrong").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(){
		$(this).removeClass("wrong");
	});
}

Scramble.prototype.joinRoom = function(res){
	this.host = res.host_id;
	
	this.renderClients(res.clients);

	$(".host").removeClass("host");
	$("#"+this.host).addClass("host");
}

Scramble.prototype.setHost = function(res){
	this.host = res.host_id;

	$(".host").removeClass("host");
	if(this.host === this.socket.id){
		$("#mygame").addClass("host");
	}else{
		$("#"+this.host).addClass("host");
	}

	if(!this.playing && this.online && this.socket.id === this.host){
		this.renderScrambledWord({scrambled:"Start"}, "start");
	}
}

Scramble.prototype.clientJoined = function(res){
	console.log(res.user_name + " joined");
	this.renderClients(res.clients);
}

Scramble.prototype.renderClients = function(clients){
	var index = 1;
	clients.forEach(function(client){
		if(client.id !== this.socket.id){
			$("#clients .client:nth-child("+index+")").attr("id", client.id).find(".client-name").html(client.user_name);
			$("#xs-clients .xs-client:nth-child("+index+")").attr("id", "xs-"+client.id).find(".client-name").html(client.user_name.length > 6 ? client.user_name.substring(0,6)+"..." : client.user_name);
			index++;
		}
	}.bind(this));
}

Scramble.prototype.leave = function(){
	this.socket.emit("leave");
	this.host = false;
	this.online = false;
	this.playing = false;
	this.clinet = [];
	$(".client").removeAttr('id').find(".client-name, .points, .client-scrambled, .result").html("");
	$(".xs-client").removeAttr('id').find(".client-name, .client-points").html("");
}

Scramble.prototype.clientLeft = function(res){
	$("#"+res.id + ".client").removeAttr('id').find(".client-name, .points, .client-scrambled, .result").html("");
	$("#xs-"+res.id + ".xs-client").removeAttr('id').find(".client-name, .client-points").html("");
	console.log(res.user_name +" left");
}

Scramble.prototype.renderClientScrambledWord = function(res){
	$("#" + res.id + " .client-scrambled").html("");
	for(var i=0;i<res.scrambled.length;i++){
		$("#" + res.id + " .client-scrambled").append("<button class='btn btn-default character'>"+res.scrambled[i]+"</button>");
	}
}

Scramble.prototype.clientSubmitWordResult = function(res){
	var result = res.correct ? res.points + " Points " : "Wrong";
	$("#" + res.id + " .result").html(result);
	$("#" + res.id + " .points").html(res.total_points + " pts");
	$("#xs-"+res.id + ".xs-client .client-points").html(res.total_points + " pts");
}

Scramble.prototype.renderClientTotalPoints = function(res){
	var result = res.total_points + " Points";
	$("#" + res.id + " .result").html("");
	for(var i=0;i<result.length;i++){
		$("#" + res.id + " .result").append("<button class='btn btn-default character'>"+result[i]+"</button>");
		$("#xs-"+res.id + ".xs-client .client-points").html(res.total_points + " pts");
	}
}

Scramble.prototype.renderLeaderboard = function(users){
	$("#user-list tbody").html("");

	users.forEach(function(user, index){
		if(this.user_id === user._id){
			$("#user-list tbody").append("<tr class='background2 color0'><td>"+(index+1)+"</td><td>"+user.name+"</td><td>"+user.points+"</td><td>"+user.correct+"</td></tr>");
		}else{
			$("#user-list tbody").append("<tr><td>"+(index+1)+"</td><td>"+user.name+"</td><td>"+user.points+"</td><td>"+user.correct+"</td></tr>");
		}
	}.bind(this));
}

Scramble.prototype.keydown = function(e){
	if(this.typingUserName){
		if(e.keyCode === 13){
			$("#user-name-submit").click();
		}
	}else if(this.playing){
		if(e.keyCode === 8){
			$(".active .scrambled").append($(".active .input .character").last());
			return false;
		}else if(e.keyCode === 222){
			this.input("'");
		}else if(e.keyCode === 189){
			this.input("-");
		}else{
			this.input(String.fromCharCode(e.keyCode).toLowerCase());
		}
	}else{
		if(e.keyCode === 8){
			return false;
		}
	}
}