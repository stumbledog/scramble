var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');

var word_controller = require('./controllers/word');
//var leaderBoard = require('./controllers/leaderboard');
var routes = require('./routes/index');

var app = express();
var server = app.listen(5000);
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

word_controller.init();

/* Socket */
io.sockets.on('connection', function (socket) {	

	console.log('A new user connected!');

	socket.on('scrambled', function(difficulty_level){
		word_controller.getWord(difficulty_level, function(data){
			socket.word = data.word;
			socket.anagram = word_controller.anagram(data.word);
			socket.emit('scrambled', { word:data.word, scrambled: data.scrambled });
			console.log(data);
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

		var clients = [];
		var clients_in_the_room = adapter.rooms[socket.room]; 
		for (var clientId in clients_in_the_room ) {
			clients.push(clientId);
		}

		if(socket.host){
			socket.emit('host', {room:socket.room});
		}else{
			socket.to(socket.room).emit('join', {id:socket.id});
			socket.emit('guest', {clients:clients});
		}
	});

	socket.on('submit', function(word){
		var points;
		console.log(word, socket.word);
		if(word === socket.anagram){
			points = word.length *2;
			io.sockets.in(socket.id).emit('submit', {id:socket.id, correct:true, anagram:true, points:points});
		}else if(word === socket.word){
			points = word.length;
			io.sockets.in(socket.id).emit('submit', {id:socket.id, correct:true, anagram:false, points:points});
		}else{
			io.sockets.in(socket.id).emit('submit', {id:socket.id, correct:false, anagram:false, points:0});
		}
	});

	socket.on('submit points', function(points){
		user_controller.submitPoints(socket.id, "user name", points, function(myrecord){
			user_controller.getLeaderBoard(function(leaderboard){
				socket.emit('submit points', { myrecord:myrecord, leaderboard:leaderboard });
			})
		});
	});

	socket.on('multiplay start', function(){

	});
});


module.exports = app;