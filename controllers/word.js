var get_word_api_url = "http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=100&maxCorpusCount=-1&minDictionaryCount=20&maxDictionaryCount=-1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5&minLength=3&maxLength=6";
var check_word_api_url = "http://api.wordnik.com:80/v4/words.json/search/#search#?caseSensitive=false&minCorpusCount=5&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=#length#&maxLength=#length#&skip=0&limit=1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";

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
	request(get_word_api_url, function(err, res, body){
		try{
			var word = JSON.parse(body).word.toLowerCase();
			words.push({word:word, scrambled:this.scramble(word)});
			if(typeof(callback) == "function"){
				callback();
			}

		}catch(e){
			console.log("word parsing error: "+e);
			console.log(body);
			this.getWordnik(callback);
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

exports.checkAnswer = function(word, callback){
	var api_url = check_word_api_url.replace("#search#",word).replace(/#length#/g,word.length);
	request(api_url, function(err, res, body){
		console.log(body);
		callback(JSON.parse(body).totalResults > 0);
	}.bind(this));
}