var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');

var word_controller = require('./controllers/word');
var routes = require('./routes/index');
//var users = require('./routes/users');

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

word_controller.init();

/* Socket */
io.sockets.on('connection', function (socket) {
	console.log('A new user connected!');

	socket.on('scrambled', function(difficulty_level){
		word_controller.getWord(difficulty_level, function(data){
			socket.word = data.word;
			socket.emit('scrambled', { word:data.word, scrambled: data.scrambled });
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

		//console.log(adapter.rooms);
		//console.log(io.sockets.manager.roomClients[socket.id]);

		console.log(socket.room);
		console.log(socket.rooms);
	});

	socket.on('submit', function(word){
		console.log(word, socket.word);
	});

	socket.on('play', function(){

	});

/*
	socket.on('create room', function(){
		socket.status = "host";

	});

	socket.on('join room', function(){
		socket.status = "join";

	});
*/
});


module.exports = app;