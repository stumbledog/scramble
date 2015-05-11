var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LeaderBoardSchema = new Schema({
	points:Number,
});

module.exports =  mongoose.model('LeaderBoard', LeaderBoardSchema);