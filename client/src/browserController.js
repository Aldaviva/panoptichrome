(function(){

	var socket;
	var cycleIntervalId;

	chrome.runtime.onMessage && chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
		if(message == 'change:serverAddress'){
			console.log("serverAddress changed to "+localStorage.getItem("serverAddress"));
		}
	});

	function main(){
		Q.stopUnhandledRejectionTracking(); //Q's logic is broken, causing warnings to be fired spuriously

		var installationId = localStorage.getItem("installationId");
		if(!installationId){
			installationId = generateUUID();
			localStorage.setItem("installationId", installationId);
		}

		var serverAddress = localStorage.getItem('serverAddress');
		if(serverAddress){
			socket = io.connect('http://'+serverAddress+'/browsers');
			socket.on('connect', onConnection);
			connectEvents();

			setIsCyclePaused(isCyclePaused()); //restart timers
			// setInterval(uploadScreenshot, 10*1000);
		}
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

				// uploadScreenshot();
			});

		registerChromeTabListeners();
	}

	function connectEvents(){
		socket.on('tabs:add',               addTab);
		socket.on('tabs:activate',          activateTab);
		socket.on('tabs:activate:adjacent', activateAdjacentTab);
		socket.on('tabs:remove',            removeTab);
		socket.on('tabs:reload',            reloadTab);
		socket.on('tabs:reorder',           reorderTab);
		socket.on('tabs:setUrl',            setTabUrl);
		socket.on('fullscreen:set',         setFullscreen);
		socket.on('name:set',               setName);
		socket.on('cycle:tabduration:set',  setCycleTabDuration);
		socket.on('cycle:ispaused:set',     setIsCyclePaused);
		socket.on('message:post',           postMessageToActiveTab);
	}

	var registerChromeTabListeners = _.once(function(){
		['onCreated', 'onUpdated', 'onMoved', 'onActivated', 'onRemoved', 'onReplaced'].forEach(function(eventName){
			if(chrome.tabs[eventName]){
				chrome.tabs[eventName].addListener(reportTabs);
			}
		});
	});

	var reportTabs = _.throttle(function(){
		getTabs()
			.then(function(tabs){
				socket.emit('tabs:list', tabs);
			});

		// uploadScreenshot();
	}, 200);

	var mostRecentScreenshotCompletion = 0;

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
			// .then(function(dataUri){
			// 	console.log(dataUri);
			// 	return dataUri;
			// })
			.then(resampleScreenshot)
			.then(function(dataUri){
				// console.log('uploading datauri of length '+dataUri.length)
				socket.emit('screenshot', dataUri);
				// console.info("uploaded screenshot");
			})
			.fail(function(err){
				// err && console.error(err);
				// console.log("missing screenshot, ignoring");
				//invalid screenshot, ignore
			})
			.then(function(){
				var now = +new Date();
				console.log(now - mostRecentScreenshotCompletion);
				mostRecentScreenshotCompletion = now;
				setTimeout(uploadScreenshot, 0);
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
			return 10*1000;
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
		cycleIntervalId = setInterval(activateAdjacentTab, intervalMillis);
		activateAdjacentTab();
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
	var captureVisibleTab = _wrapWithPromise(_.partial(chrome.tabs.captureVisibleTab, { format: 'png' }));
	var reorderTab = _wrapWithPromise(function(tabId, newIndex, resolve){
		chrome.tabs.move(tabId, { index: newIndex }, resolve);
	});
	var setTabUrl = function(tabId, url){
		console.log('setting tab '+tabId+' to url '+url);
		return updateTab(tabId, { url: url });
	};

	var activateAdjacentTab = function(shouldActivatePreviousTab){
		return Q.all([
				getActiveTab().get("index"),
				getCurrentWindow().get('tabs').get('length')
			])
			.spread(function(currentTabIndex, numTabs){
				var tabIndexOffset = (shouldActivatePreviousTab) ? -1 : 1;
				var nextIndex = (currentTabIndex + tabIndexOffset + numTabs) % numTabs;
				return getTabs({ index: nextIndex });
			})
			.get(0)
			.get("id")
			.then(activateTab);
	};

	function getTabDimensions(){
		var originalSizeDeferred = Q.defer();

		chrome.tabs.executeScript(null, { code: "[window.innerWidth, window.innerHeight]" }, function(originalSize){
			if(originalSize){
				originalSizeDeferred.resolve(originalSize[0]);
			} else {
				originalSizeDeferred.reject();
			}
		});

		return originalSizeDeferred.promise;
	}

	function postMessageToActiveTab(message){
		chrome.tabs.executeScript(null, {
			code: "window.postMessage("+JSON.stringify(message)+", '*')"
		});
	}

	function resampleScreenshot(dataUri){
		var LONGEST_EDGE_SIZE = 200;

		var resultHeight;
		var resultWidth;

		return getTabDimensions().then(function(originalSize){
			var deferred = Q.defer();

			var originalWidth = originalSize[0];
			var originalHeight = originalSize[1];

			if(originalHeight > originalWidth){
				resultHeight = LONGEST_EDGE_SIZE;
				resultWidth = Math.round(LONGEST_EDGE_SIZE / originalHeight * originalWidth);
			} else {
				resultHeight = Math.round(LONGEST_EDGE_SIZE / originalWidth * originalHeight);
				resultWidth = LONGEST_EDGE_SIZE;
			}

			var originalImage = document.createElement("image");
			originalImage.src = dataUri;
			originalImage.onload = function(){
				var resampledCanvas = document.createElement("canvas");
				resampledCanvas.width = resultWidth;
				resampledCanvas.height = resultHeight;
				var canvasContext = resampledCanvas.getContext("2d");

				canvasContext.drawImage(originalImage, 0, 0, resultWidth, resultHeight);

				var resampled = resampledCanvas.toDataURL("image/png");
				deferred.resolve(resampled);

				delete originalImage;
				// delete canvasContext;
				// delete resampledCanvas;
			};
			return deferred.promise;
		})
		.fail(function(err){
			console.error(err, err.stack || "");
			throw err;
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
