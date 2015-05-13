var word_api_url = "http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=100&maxCorpusCount=-1&minDictionaryCount=20&maxDictionaryCount=-1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5&minLength=3&maxLength=6";
var request = require('request');
var words = [];

exports.init = function(){
	for(var i=0;i<100;i++){
		this.getWordnik();
	}
}

exports.getWord = function(callback){
	console.log("word count: ",words.length);
	if(words.length > 0){
		callback(words.shift());
		this.getWordnik();
	}else{
		this.getWordnik(function(){
			callback(words.shift());
		});
	}
}

exports.getWordnik = function(callback){
	request(word_api_url, function(err, res, body){
		var word = JSON.parse(body).word.toLowerCase();
		words.push({word:word, scrambled:this.scramble(word)});
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
