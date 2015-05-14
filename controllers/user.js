var cookie = require('cookie');
var UserModel = require('../models/user');
var WordController = require('../controllers/word');

exports.init = function(socket){
	socket.user_id = cookie.parse(socket.handshake.headers.cookie).user_id.split('"')[1];

	UserModel.findById(socket.user_id, function(err, user){
		socket.user_name = user.name;
		console.log(socket.user_name + " connected");
		socket.best_points = user.points;
		socket.emit("init", {user_id:user.id, user_name:socket.user_name, best_points:socket.best_points});
	});
}

exports.setUserName = function(socket, user_name){
	socket.user_name = user_name;
	UserModel.update({_id:socket.user_id}, {name:socket.user_name}, function(){
		socket.emit("update user name", socket.user_name);
	})
}

exports.getRoomList = function(io, socket){

}

exports.scrambled = function(socket){
	WordController.getWord(function(data){
		socket.word = data.word;
		socket.anagram = WordController.anagram(data.word);
		socket.emit('scrambled', { scrambled: data.scrambled });
		socket.to(socket.room).emit('clinet scrambled', { id:socket.id, scrambled: data.scrambled });
		console.log(data);
	});
}

exports.submit = function(io, socket, word){
	var anagram = word === socket.anagram;
	var correct = anagram || word === socket.word;
	var points = correct ? (anagram ? word.length *2 : word.length) : 0;
	console.log(word, socket.word);
	socket.total_points += points;
	socket.emit('submit', {id:socket.id, correct:correct, anagram:anagram, points:points, total_points:socket.total_points});
	socket.to(socket.room).emit('client submit', {id:socket.id, correct:correct, anagram:anagram, points:points, total_points:socket.total_points});
}

exports.submitPoints = function(socket){
	socket.to(socket.room).emit('client total points', {id:socket.id, total_points:socket.total_points});
	UserModel.update({_id:socket.user_id, points:{$lt:socket.total_points}},{points:socket.total_points},function(err, result){
		if(result.n === 1){
			socket.best_points = socket.total_points;
			socket.emit("best points", socket.best_points);
		}
	});
}

exports.getLeaderboard = function(socket){
	UserModel.find({}).sort('-points').exec(function(err, users){
		socket.emit('users order by points', users);
	});
}

exports.requestGameStart = function(io, socket){
	var adapter = io.sockets.adapter;
	var connected = io.sockets.connected;

	if(adapter.rooms[socket.room]){
		Object.keys(adapter.rooms[socket.room]).filter(function(user_key){
			connected[user_key].total_points = 0;
		});
	}else{
		socket.total_points = 0;
	}

	socket.emit('game start');
	socket.to(socket.room).emit('game start');
}

exports.saveUserAndHome = function(res, callback){
	var user = new UserModel();
	user.save(function(){
		res.cookie('user_id', user._id, {maxAge: 10 * 365 * 24 * 60 * 60 * 1000, httpOnly: true });
		res.render('index');
	});
}

exports.disconnected = function(io, socket){
	console.log(socket.user_name + " disconnected");
	socket.to(socket.room).emit('client left', {id:socket.id, user_name:socket.user_name});
	var adapter = io.sockets.adapter;
	var connected = io.sockets.connected;

	var room = socket.room;
	socket.leave(room);
	if(socket.host){
		socket.host = false;
		console.log(adapter.rooms[room]);
		if(adapter.rooms[room]){
			var user_keys = Object.keys(adapter.rooms[room]);
			if(user_keys.length > 0){
				var host = connected[user_keys[0]];
				host.host = true;
				user_keys.forEach(function(user_key){
					var user = connected[user_key];
					user.leave(user.room);
					user.join(host.id);
					user.room = host.id;
					user.emit("change host", {host_id:host.id});
				});

			}
		}
	}
	console.log(adapter.rooms);
	socket.room = null;
}

exports.online = function(io, socket){
	socket.host = true;
	socket.room = socket.id;
	socket.join(socket.room);

	var adapter = io.sockets.adapter;
	var connected = io.sockets.connected;

	Object.keys(connected).every(function(user_key){
		if(socket.id !== connected[user_key].id && connected[user_key].host && adapter.rooms[user_key] && Object.keys(adapter.rooms[user_key]).length < 4){
			socket.leave(socket.id);
			socket.join(user_key);
			socket.room = user_key;
			socket.host = false;
			return false;
		}else{
			return true;
		}
	});

	console.log(adapter.rooms);

	var users = this.getUsersInRoom(io, socket.room);

	if(socket.host){
		socket.emit('host', {host_id:socket.id, clients:users});
	}else{
		socket.emit('join', {host_id:socket.room, clients:users, user_name:socket.user_name});
		socket.to(socket.room).emit('client joined', {clients:users, user_name:socket.user_name});
	}
}

exports.getUsersInRoom = function(io, room){
	var adapter = io.sockets.adapter;
	var connected = io.sockets.connected;

	var user_arr = [];

	var user_keys = Object.keys(adapter.rooms[room]);
	user_keys.forEach(function(user_key){
		var socket = connected[user_key];
		user_arr.push({id:socket.id, user_name:socket.user_name});
	});

	return user_arr;
}