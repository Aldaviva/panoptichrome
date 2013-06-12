var SERVER_PORT = 8081;

var apiServer = require('./apiServer');
require('./browserApi');
require('./staticServer');


apiServer.listen(SERVER_PORT, function(err){
	if(err != null){
		console.error(err);
	} else {
		console.info("Listening on %s.", apiServer.url);

		apiServer.io.disable('browser client');
	}
});
