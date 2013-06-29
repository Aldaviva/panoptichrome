(function(){
	var serverEl = document.getElementById('server');
	serverEl.value = localStorage.getItem('serverAddress') || '';

	server.addEventListener('blur', saveServerAddress, false);
	server.addEventListener('keyup', function(event){
		if(event.keyCode == 13){
			event.preventDefault();
			saveServerAddress();
		}
	});

	function saveServerAddress(){
		localStorage.setItem('serverAddress', serverEl.value);
		chrome.runtime.sendMessage("change:serverAddress");
		//tell extension to reload
	}
		
})();