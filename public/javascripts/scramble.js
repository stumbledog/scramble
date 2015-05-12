function Scramble(){
	this.socket = io.connect();
	this.playing = false;
	this.points = 0;
	this.best_points = 0;
	this.clients = [];
	this.online = false;

	initEventListener.call(this);
	this.cssAnimation = supportsTransitions();
	console.log(this.cssAnimation);

	function initEventListener(){
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

		this.socket.on('scrambled', function(res){
			this.renderScrambled(res);
		}.bind(this));

		this.socket.on('submit', function(res){
			if(this.socket.id === res.id && res.correct){
				this.correct(res);
			}else{
				this.worng();
			}
		}.bind(this));

		this.socket.on('host', function(res){
			this.host = true;
			this.clients = [];
			this.renderScrambled({scrambled:"Start"}, "start");

			//$("#multi-start").show();
		}.bind(this));

		this.socket.on('client', function(res){
			this.host = false;
			this.clients = res.clients.filter(function(client){
				console.log(this);
				return client != this.socket.id;
			}.bind(this));
			console.log(this.clients);
		}.bind(this));

		this.socket.on('join', this.userJoin.bind(this));

		// this.socket.on('join', function(res){
		// 	console.log(res.id+" joined");
		// 	this.clients.push(res.id);
		// 	console.log(this.clients);
		// }.bind(this));

		this.socket.on('leave', function(res){
			console.log(res.id +" left");
			console.log(res);
			console.log(this.clients);
			this.clients = this.clients.filter(function(client){
				return client != res.id;
			});
			console.log(this.clients);
			//this.clients.push(res.id);
		});

		this.socket.on('host start game', function(res){
			console.log("host started game");
		});

		this.socket.on('submit points', function(res){
			console.log(res);
		});

		this.socket.on('best points', function(best_points){
			this.best_points = best_points;
			$(".best-points").text(this.best_points + " pts");
		}.bind(this));

		// this.socket.on('submit points', function(res){
		// 	$("#result").show();
		// 	$("#your-points").html(res.myrecord.points);
		// 	$("#your-rank").html(res.leaderboard.length);
		// 	var table = $("<table class='table table-striped'></table>");
		// 	table.append($("<thead><tr><th>Rank</th><th>Username</th><th>Points</th></tr></thead>"));
		// 	var body = $("<tbody></tbody>");
		// 	res.leaderboard.forEach(function(record, index){
		// 		body.append($("<tr id='rank"+(index+1)+"'><td>"+(index+1)+"</td><td>"+record.name+"</td><td>"+record.points+"</td></tr>"));
		// 	});
		// 	table.append(body);
		// 	$("#leaderboard").html(table);
		// 	location.href = "#rank"+res.leaderboard.length;
		// });

		$(".site-wrapper").on("click", ".active .scrambled .character", this.input.bind(this));
		$(".site-wrapper").on("click", ".active .input .character", function(e){
			if(this.playing){
				$(".active .scrambled").append($(e.target));
			}else{
				if($(e.currentTarget).hasClass("start")){
					this.play();
				}
			}
		}.bind(this));

		$(document).on("keydown", function(e){
			if(this.playing){
				if(e.keyCode === 8){
					this.popInput();
					return false;
				}
				if(e.keyCode === 222){
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
		}.bind(this))
	};

	function supportsTransitions(){
		var b = document.body || document.documentElement,
		s = b.style,
		p = 'transition';

		if (typeof s[p] == 'string') { return true; }

		// Tests for vendor specific prop
		var v = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'];
		p = p.charAt(0).toUpperCase() + p.substr(1);

		for (var i=0; i<v.length; i++) {
			if (typeof s[v[i] + p] == 'string') { return true; }
		}

		return false;
	}
}

Scramble.prototype.singlePlay = function(){
	$(".character").remove();
	$("#home, #online-game").hide();
	$("#game, #bottom-menu").show();
	$("#game").addClass("active");
	$("#online-game").removeClass("active");

	this.online = false;
	this.playing = false;
	this.renderScrambled({scrambled:"Start"}, "start");
	clearInterval(this.interval);
}

Scramble.prototype.playOnline = function(){
	$(".character").remove();
	$("#home, #game").hide();
	$("#online-game, #bottom-menu").show();
	$("#online-game").addClass("active");
	$("#game").removeClass("active");

	this.online = true;
	this.playing = false;
	this.host = false;
	this.socket.emit('multiplay');
	clearInterval(this.interval);
}

Scramble.prototype.play = function(){
	$(".character").remove();

	if(!this.online){
		this.playing = true;
		this.points = 0;
		$("#points").html(this.points+" pts");
		this.socket.emit('scrambled');
		this.countDown();		
	}else{
		this.socket.emit("request start");
	}

}

Scramble.prototype.userJoin = function(res){
	console.log(this);
	console.log(res);

	console.log(res.id+" joined");
	this.clients.push(res.id);
	console.log(this.clients);
}

Scramble.prototype.countDown = function(){
	var start_time, now, remain_time, interval;

  	start_time = new Date();
  	clearInterval(this.interval);

	this.interval = setInterval(function(){
		now = new Date();
		remain_time = Math.ceil((5000 - parseInt(now - start_time))/1000);

		$(".count").html(remain_time+"s");

		if(remain_time <= 0){
			clearInterval(this.interval);
			this.gameOver();
		}

	}.bind(this), 100);
}

Scramble.prototype.gameOver = function(){
	this.socket.emit('submit points',this.points);
	$(".character").remove();

	setTimeout(function(){
		var str = this.points+" Points";
		str.split("").forEach(function(character){
			$(".active .input").append("<button class='btn btn-default character start'>"+character+"</button>");
		});
		this.renderScrambled({scrambled:"Play Again"}, "start");
		this.playing = false;
	}.bind(this), 500);
}

Scramble.prototype.renderScrambled = function(word, class_name){
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
			this.socket.emit("submit", word);
		}
	}else{
		if($(e.currentTarget).hasClass("start")){
			this.play();
		}
	}
}

Scramble.prototype.popInput = function(){
	$(".active .scrambled").append($(".active .input .character").last());
}

Scramble.prototype.correct = function(res){
	if(res.anagram){
		$("#anagram").show().addClass("flash");
		$("#anagram").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e){
			$(this).removeClass("flash").hide();
		});
	}

	this.points += res.points;
	$(".points").html(this.points+" pts");

	$(".active .input .character").addClass("fadeout");
	this.socket.emit('scrambled');
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