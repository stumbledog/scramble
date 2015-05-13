var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');

var WordController = require('./controllers/word');
var UserController = require('./controllers/user');

//var leaderBoard = require('./controllers/leaderboard');
var routes = require('./routes/index');

var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

mongoose.connect('mongodb://localhost/scramble');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("db connected");
});

WordController.init();


io.sockets.on('connection', function (socket) {
	var cookies = cookie.parse(socket.handshake.headers.cookie);
	socket.user_id = cookies.user_id.split('"')[1];
	console.log('User(' + socket.user_id + ') connected!');

	UserController.init(socket);

	socket.on('scrambled', function(){
		WordController.getWord(function(data){
			socket.word = data.word;
			socket.anagram = WordController.anagram(data.word);
			socket.emit('scrambled', { word:data.word, scrambled: data.scrambled });
			console.log(data);
		});
	});

	socket.on('submit', function(word){
		console.log(word, socket.word);
		if(word === socket.anagram){
			io.sockets.in(socket.id).emit('submit', {id:socket.id, correct:true, anagram:true, points:word.length *2});
		}else if(word === socket.word){
			io.sockets.in(socket.id).emit('submit', {id:socket.id, correct:true, anagram:false, points:word.length});
		}else{
			io.sockets.in(socket.id).emit('submit', {id:socket.id, correct:false, anagram:false, points:0});
		}
	});

	socket.on('submit points', function(points){
		UserController.submitPoints(socket, points, function(myrecord){
			// UserController.getLeaderBoard(function(leaderboard){
			// 	socket.emit('submit points', { myrecord:myrecord, leaderboard:leaderboard });
			// });
		});
	});


	socket.on('multiplay', function(){
		socket.host = true;
		socket.play = false;
		socket.room = socket.id;

		var adapter = io.sockets.adapter;
		var connected = io.sockets.connected;

		Object.keys(connected).every(function(user_key){
			if(socket.id !== connected[user_key].id && connected[user_key].host && !connected[user_key].play && adapter.rooms[user_key] && Object.keys(adapter.rooms[user_key]).length < 4){
				socket.leave(socket.id);
				socket.join(user_key);
				socket.room = user_key;
				socket.host = false;
				return false;
			}else{
				return true;
			}
		});

		socket.clients = [];
		var clients_in_the_room = adapter.rooms[socket.room]; 
		for (var clientId in clients_in_the_room ) {
			socket.clients.push(clientId);
		}

		if(socket.host){
			socket.emit('host', {room:socket.room});
		}else{
			socket.to(socket.room).emit('join', {id:socket.id, user_name:socket.user_name});
			socket.emit('client', {clients:socket.clients});
		}
	});

	socket.on('request game start', function(){
		socket.emit('game start');
		socket.to(socket.room).emit('game start');
	});

	socket.on('set user name', function(user_name){
		socket.user_name = user_name;
		UserController.setUserName(socket);
	})

	socket.on('disconnect', function () {
		if(socket.host){
			console.log("change host");
			//socket.to(socket.room).emit('host start game');
		}else{
			socket.to(socket.room).emit('leave', {id:socket.id, user_name:socket.user_name});
		}
	});
});


module.exports = app;
