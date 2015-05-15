var express = require('express');
var router = express.Router();

var UserModel = require('../models/user');
var UserController = require('../controllers/user');

router.get('/', function(req, res, next) {
	if(req.cookies.user_id){
		UserModel.findById(req.cookies.user_id, function(err, user){
			if(user){
				res.render('index');
			}else{
				UserController.saveUserAndHome(res);
			}
		});
	}else{
		UserController.saveUserAndHome(res);
	}
});

module.exports = router;