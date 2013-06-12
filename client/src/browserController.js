(function(){

	var socket;
	var installationId;

	function main(){
		installationId = localStorage.getItem("installationId");
		if(!installationId){
			installationId = generateUUID();
			localStorage.setItem("installationId", installationId);
		}

		socket = io.connect('http://10.4.4.251:8081/browsers');
		socket.on('connect', onConnection);
		onConnection();
		connectEvents();
	}

	function onConnection(){
		socket.emit('online', { id: installationId });
		reportTabs();
		chrome.windows.getCurrent(function(currentWindow){
			var isFullscreen = (currentWindow.state == 'fullscreen');
			socket.emit('fullscreen:changed', isFullscreen);
		});

		socket.emit('screenSize', _.pick(window.screen, 'width', 'height'));
	}

	function connectEvents(){
		socket.on('tabs:add',       addTab);
		socket.on('tabs:activate',  activateTab);
		socket.on('fullscreen:set', setFullscreen);

		['onCreated', 'onUpdated', 'onMoved', 'onActivated', 'onRemoved'].forEach(function(eventName){
			chrome.tabs[eventName].addListener(reportTabs);
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
		var DEFAULT_QUERY = { 
			windowType: 'normal', //hide popups and web inspector
			//url: '*://*/*' //show http or https, hide chrome, ftp, and file
		};
		chrome.tabs.query(_.extend(DEFAULT_QUERY, query), resolve);
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

	var setFullscreen = _wrapWithPromise(function(shouldBeFullscreen, resolve){
		var desiredState = (shouldBeFullscreen) ? 'fullscreen' : 'maximized';

		return getCurrentWindow()
			.then(function(currentWindow){
				return updateWindow(currentWindow.id, { state: desiredState });
			})
			.then(function(){
				socket.emit('fullscreen:changed', shouldBeFullscreen);
			});
	});

	var addTabHelper = _wrapWithPromise(chrome.tabs.create);
	var activateTab = _wrapWithPromise(function(tabId, resolve){
		chrome.tabs.update(tabId, { active: true }, resolve);
	});
	var updateWindow = _wrapWithPromise(chrome.windows.update);
	var getCurrentWindow = _wrapWithPromise(chrome.windows.getCurrent);

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
