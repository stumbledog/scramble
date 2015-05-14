var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');

var WordController = require('./controllers/word');
var UserController = require('./controllers/user');

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
db.once('open', console.log.bind(console, 'Scramble DB connected'));

WordController.init();

io.sockets.on('connection', function (socket) {
	UserController.init(socket);
	socket.on('set user name', UserController.setUserName.bind(null, socket));
	socket.on('scrambled', UserController.scrambled.bind(null, socket));
	socket.on('submit unscrambled', UserController.submitAnswer.bind(UserController, io, socket));
	socket.on('submit points', UserController.submitPoints.bind(null, socket));
	socket.on('online', UserController.online.bind(UserController, io, socket));
	socket.on('request game start', UserController.requestGameStart.bind(null, io, socket));
	socket.on('disconnect', UserController.disconnected.bind(null, io, socket));
	socket.on('leave', UserController.disconnected.bind(null, io, socket));
	socket.on('show leaderboard', UserController.getLeaderboard.bind(null, socket));
});

module.exports = app;