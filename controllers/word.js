var word_api_url = "http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=10&maxDictionaryCount=-1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
var request = require('request');
var words = [[],[],[]];

exports.init = function(){
	for(var i=0;i<300;i++){
		var difficulty_level = parseInt(i/100);
		this.getWordnik(difficulty_level);
	}
}

exports.getWord = function(difficulty_level, callback){
	console.log("word count: ",words[0].length,words[1].length,words[2].length);
	if(words[difficulty_level].length > 0){
		callback(words[difficulty_level].shift());
		this.getWordnik(difficulty_level);
	}else{
		this.getWordnik(difficulty_level, function(){
			callback(words[difficulty_level].shift());
		});
	}
}

exports.getWordnik = function(difficulty_level, callback){
	var min_length = difficulty_level * 2 + 3;
	var max_length = min_length + 1;
	request(word_api_url + "&minLength=" + min_length + "&maxLength=" + max_length, function(err, res, body){
		var word = JSON.parse(body).word.toLowerCase();
		words[difficulty_level].push({word:word, scrambled:this.scramble(word)});
		if(typeof(callback) == "function"){
			callback();
		}
	}.bind(this));
}

exports.scramble = function(word){
	var temp, scrambled, index;
	do{
		temp = word, scrambled = "";
		while(temp.length){
			index = Math.floor(Math.random() * temp.length);
			scrambled += temp[index];
			temp = temp.slice(0, index) + temp.slice(index + 1, temp.length);
		}
	}while(word === scrambled)
	return scrambled;
}

exports.anagram = function(word){
	return word.split('').reverse().join('');
}
