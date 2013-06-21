(function(){

	var socket;
	var cycleIntervalId;

	function main(){
		var installationId = localStorage.getItem("installationId");
		if(!installationId){
			installationId = generateUUID();
			localStorage.setItem("installationId", installationId);
		}

		socket = io.connect('http://10.4.4.251:8081/browsers');
		socket.on('connect', onConnection);
		connectEvents();

		setIsCyclePaused(isCyclePaused()); //restart timers
		setInterval(uploadScreenshot, 5000);
	}

	function onConnection(){
		Q.all([getTabs(), getCurrentWindow()])
			.spread(function(tabs, currentWindow){
				socket.emit('online', {
					id: localStorage.getItem("installationId"),
					name: localStorage.getItem("installationName") || "Untitled",
					isFullscreen: (currentWindow.state == 'fullscreen'),
					screenSize: _.pick(window.screen, 'width', 'height'),
					tabs: tabs,
					isCyclePaused: isCyclePaused(),
					cycleTabDuration: getCycleTabDuration()
				});

				uploadScreenshot();
				
			});

		registerChromeTabListeners();
	}

	function connectEvents(){
		socket.on('tabs:add',              addTab);
		socket.on('tabs:activate',         activateTab);
		socket.on('tabs:remove',           removeTab);
		socket.on('tabs:reload',           reloadTab);
		socket.on('fullscreen:set',        setFullscreen);
		socket.on('name:set',              setName);
		socket.on('cycle:tabduration:set', setCycleTabDuration);
		socket.on('cycle:ispaused:set',    setIsCyclePaused);
	}

	var registerChromeTabListeners = _.once(function(){
		['onCreated', 'onUpdated', 'onMoved', 'onActivated', 'onRemoved', 'onReplaced'].forEach(function(eventName){
			chrome.tabs[eventName].addListener(reportTabs);
		});
	});

	function reportTabs(){
		getTabs()
			.then(function(tabs){
				socket.emit('tabs:list', tabs);
			});

		uploadScreenshot();
	}

	function uploadScreenshot(){
		captureVisibleTab()
			.then(function(dataUri){
				// console.log("captured a dataUri of length "+dataUri.length);
				if(!dataUri){
					throw "Invalid screenshot";
				} else {
					return dataUri;
				}
			})
			// .then(resampleScreenshot)
			.then(function(dataUri){
				// console.log('uploading datauri of length '+dataUri.length)
				socket.emit('screenshot', dataUri);
				// console.info("uploaded screenshot");
			})
			.fail(function(err){
				err && console.error(err);
				console.log("missing screenshot, ignoring");
				//invalid screenshot, ignore
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
		console.log((shouldBeFullscreen ? 'enabling' : 'disabling') + 'fullscreen');
		var desiredState = (shouldBeFullscreen) ? 'fullscreen' : 'normal';

		return getCurrentWindow()
			.then(function(currentWindow){
				return updateWindow(currentWindow.id, { state: desiredState });
			})
			/*.then(function(){
				socket.emit('fullscreen:changed', shouldBeFullscreen);
			})*/;
	});

	function setName(name){
		localStorage.setItem("installationName", name);
	}

	function isCyclePaused(){
		var serialized = localStorage.getItem('isCyclePaused');
		if(serialized !== null){
			return JSON.parse(serialized);
		} else {
			return true;
		}
	}

	function getCycleTabDuration(){
		var serialized = localStorage.getItem("cycleTabDuration");
		if(serialized !== null){
			return parseInt(serialized, 10);
		} else {
			return 3*1000;
		}
	}

	function setCycleTabDuration(duration){
		localStorage.setItem("cycleTabDuration", duration);

		if(cycleIntervalId){
			clearInterval(cycleIntervalId);
			startCycling();
		}
	}

	function setIsCyclePaused(shouldBePaused){
		localStorage.setItem("isCyclePaused", shouldBePaused);

		var wasPaused = !cycleIntervalId;
		if(shouldBePaused && !wasPaused){
			clearInterval(cycleIntervalId);
			cycleIntervalId = null;
		} else if(!shouldBePaused && wasPaused){
			startCycling();
		}
	}

	function startCycling(){
		var intervalMillis = getCycleTabDuration();
		cycleIntervalId = setInterval(activateNextTab, intervalMillis);
		activateNextTab();
	}

	var addTabHelper = _wrapWithPromise(chrome.tabs.create);
	var activateTab = _wrapWithPromise(function(tabId, resolve){
		chrome.tabs.update(tabId, { active: true }, resolve);
	});
	var updateWindow = _wrapWithPromise(chrome.windows.update);
	var updateTab = _wrapWithPromise(chrome.tabs.update);
	var removeTab = _wrapWithPromise(chrome.tabs.remove);
	var reloadTab = _wrapWithPromise(function(tabId, resolve){
		chrome.tabs.reload(tabId, { bypassCache: true }, resolve);
	});
	var getCurrentWindow = _wrapWithPromise(_.partial(chrome.windows.getCurrent, { populate: true }));
	var getActiveTab = function(){
		return getTabs({ active: true }).get(0);
	};
	var captureVisibleTab = _wrapWithPromise(_.partial(chrome.tabs.captureVisibleTab, { format: 'jpeg', quality: 10 }));

	var activateNextTab = function(){
		Q.all([
				getActiveTab().get("index"),
				getCurrentWindow().get('tabs').get('length')
			])
			.spread(function(currentTabIndex, numTabs){
				var nextIndex = (currentTabIndex + 1) % numTabs;
				return getTabs({ index: nextIndex });
			})
			.get(0)
			.get("id")
			.then(activateTab)
			.done();
	};

	function getTabDimensions(){
		var originalSizeDeferred = Q.defer();

		chrome.tabs.executeScript(null, { code: "[window.innerWidth, window.innerHeight]" }, function(originalSize){
			console.log("originalSize from injected script: ", originalSize);
			originalSizeDeferred.resolve(originalSize[0]);
		});

		return originalSizeDeferred.promise;
	}

	function resampleScreenshot(dataUri){
		var LONGEST_EDGE_SIZE = 200;

		var resultHeight;
		var resultWidth;

		return getTabDimensions().then(function(originalSize){
			var originalWidth = originalSize[0];
			var originalHeight = originalSize[1];
			console.log("original image is "+originalWidth+' x '+originalHeight);

			if(originalHeight > originalWidth){
				resultHeight = LONGEST_EDGE_SIZE;
				resultWidth = Math.round(LONGEST_EDGE_SIZE / originalHeight * originalWidth);
			} else {
				resultHeight = Math.round(LONGEST_EDGE_SIZE / originalWidth * originalHeight);
				resultWidth = LONGEST_EDGE_SIZE;
			}

			var originalImage = document.createElement("image");
			originalImage.src = dataUri;
			console.log('image src length = '+originalImage.src.length);

			var canvas = document.createElement("canvas");
			canvas.width = resultWidth;
			canvas.height = resultHeight;
			console.log("creating screenshot thumbnail of size "+resultWidth+" x "+resultHeight);
			var canvasContext = canvas.getContext("2d");

			canvasContext.drawImage(originalImage, 0, 0, resultWidth, resultHeight);
			// canvas.width = resultWidth;
			// canvas.height = resultHeight;

			var resampled = canvas.toDataURL("image/png");
			console.log('resampled into a datauri of length '+resampled.length);
			return resampled;
		});
	}

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
