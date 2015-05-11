var express = require('express');
var router = express.Router();

//var LeaderBoard = require('../models/leaderboard');
var User = require('../controllers/user');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

module.exports = router;