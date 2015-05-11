var ranking = [];

exports.submitPoint = function(points){
	ranking.push({id:socket_id, points:points});
	ranking.sort(function(a,b){
		return a.last_nom < b.last_nom ? -1 : a.last_nom > b.last_nom ? 1 : 0;
	});
}

exports.getRanking = function(){
	return ranking;
}