(function(){

	function main(){
		var installationId = localStorage.getItem("installationId");
		if(!installationId){
			installationId = generateUUID();
			localStorage.setItem("installationId", installationId);
		}

		var socket = io.connect('http://10.4.4.251:8081');

		socket.emit('online', { id: installationId });
		reportTabs();

		socket.on('tabs:add', function(url){
			addTab(url).then(reportTabs);
		});
	}

	function reportTabs(){
		getTabs()
			.then(function(tabs){
				socket.emit('tabs:list', tabs);
			});
	}

	var getTabs = _wrapWithPromise(function(query, resolve){
		if(!resolve){
			resolve = query;
			query = {};
		}
		chrome.tabs.query(_.extend({ windowType: 'normal' }, query), resolve);
	});

	var addTab = function(url){
		return getTabs({ url: url })
			.then(function(tabs){
				if(!tabs.length){
					return addTabHelper({
						url: url,
						active: true
					});
				}
			});
	};

	var addTabHelper = _wrapWithPromise(chrome.tabs.create);

	function _wrapWithPromise(method){
		return _.wrap(method, function(func){
			var deferred = Q.defer();
			var args = _.tail(arguments).concat([deferred.resolve]);
			func.apply(null, args);
			return deferred.promise;
		});
	}

	function generateUUID(){
		return (function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b})();
	}

	main();

})();
