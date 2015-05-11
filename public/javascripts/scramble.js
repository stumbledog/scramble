function Scramble(){
	this.socket = io.connect();
	//this.difficulty_level;
	//this.scrambled;
	this.playing = false;
	this.points = 0;

	this.clients = [];


	initEventListener.call(this);

	function initEventListener(){
		$("#single-player, #select-level").click(function(){
			this.selectLevel();
		}.bind(this));

		$("#multi-player").click(function(){
			//this.multiplay();
		}.bind(this));

		$("#play-again").click(function(){
			this.start();
		}.bind(this));

		$(".level").click(function(e){
			$target = $(e.target);
			this.difficulty_level = $target.val();
			this.start();
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
			$("#multi-start").show();
		});

		this.socket.on('guest', function(res){
			this.host = false;
			this.clients = res.clients;
		});


		this.socket.on('join', function(res){
			this.clients.push(res.id);
		});

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

		$("#scrambled").on("click", ".character", this.input.bind(this));
		$("#input").on("click", ".character", function(){
			if(this.playing){
				$("#scrambled").append(this);
			}

		});

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
}

Scramble.prototype.selectLevel = function(){
	$("#play-type, #result, #game").hide();
	$("#difficulty-level").show();
}

Scramble.prototype.start = function(){
	$(".character").remove();
	$("#difficulty-level, #result").hide();
	$("#game").show();
	this.playing = true;
	this.points = 0;
	$("#points").html(this.points+" pts");
	this.socket.emit('scrambled', this.difficulty_level);
	this.countDown();
}

Scramble.prototype.countDown = function(){
	var start_time, now, remain_time, interval, alert = false;
  	start_time = new Date();
	interval = setInterval(function(){
		now = new Date();
		remain_time = Math.ceil((60000 - parseInt(now - start_time))/1000);
		$("#count").html(remain_time+"s");
		if(!alert && remain_time <= 10){
			$("#count").addClass("alert");
		}
		if(remain_time <= 0){
			clearInterval(interval);
			$("#count").removeClass("alert");
			this.gameOver();
		}
	}.bind(this), 100);
}

Scramble.prototype.gameOver = function(){
	this.playing = false;
	$("#result").show();
	$("#your-points").html(this.points);
}

Scramble.prototype.renderScrambled = function(word){
	for(var i=0;i<word.scrambled.length;i++){
		$("#scrambled").append("<button class='btn btn-default character'>"+word.scrambled[i]+"</button>")
	}
	$("#scrambled").addClass("bounceInUp");
	$("#scrambled").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e){
		$(this).removeClass("bounceInUp");
	});
}

Scramble.prototype.input = function(event){
	if(this.playing){
		if(typeof event === "string"){
			$("#scrambled .character").each(function(scrambled_character){
				if($(this).text() === event){
					$("#input").append(this);
					return false;
				}
			});
		}else{
			$("#input").append($(event.target));
		}

		if($("#scrambled .character").length === 0){
			var word = "";
			$("#input .character").each(function(){
				word += $(this).text();
			});
			this.socket.emit("submit", word);
		}
	}
}

Scramble.prototype.popInput = function(){
	$("#scrambled").append($("#input .character").last());
}

Scramble.prototype.correct = function(res){
	if(res.anagram){
		$("#anagram").show().addClass("flash");
		$("#anagram").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e){
			$(this).removeClass("flash").hide();
		});
	}

	this.points += res.points;
	$("#points").html(this.points+" pts");

	$("#input .character").addClass("fadeout");
	this.socket.emit('scrambled', this.difficulty_level);
	$("#input").removeClass("typing").addClass("correct").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e){
		$(".fadeout").remove();
		$(this).removeClass("correct").addClass("typing");
	});
}

Scramble.prototype.worng = function(){
	$("#input").addClass("wrong").one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(){
		$(this).removeClass("wrong");
	});
}

Scramble.prototype.multiplay = function(){
	$("#play-type").hide();
	$("#multiplay-game").show();
	this.socket.emit('multiplay');
}

Scramble.prototype.userJoin = function(){

}