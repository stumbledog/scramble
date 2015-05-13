var UserModel = require('../models/user');


exports.init = function(socket){
	UserModel.findById(socket.user_id, function(err, user){
		socket.user_name = user.name;
		socket.points = user.points;
		socket.emit("init", {user_name:socket.user_name, points:socket.points});
	});
}

exports.submitPoints = function(socket, points, callback){
	UserModel.update({_id:socket.user_id, points:{$lt:points}},{points:points},function(err, result){
		if(result.n === 1){
			socket.points = points;
			socket.emit("best points", socket.points);
		}
		console.log(err, result);
	});
}

exports.getRanking = function(){

}

exports.saveUserAndHome = function(res, callback){
	var user = new UserModel();
	user.save(function(){
		res.cookie('user_id', user._id, {maxAge: 10 * 365 * 24 * 60 * 60 * 1000, httpOnly: true });
		res.render('index');
	});
}

exports.setUserName = function(socket){
	UserModel.update({_id:socket.user_id}, {name:socket.user_name}, function(){
		socket.emit("update user name", socket.user_name);
	})
}