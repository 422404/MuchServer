const Path = require('path');
const HttpKernel = require(Path.normalize(__dirname + '/app/HttpKernel.js'));

const config = require(Path.normalize(__dirname + '/config/config.json'));
const app = new HttpKernel(config.port, config.debug);

app.start();