const micro = require('micro')
const api = require('./api/index');

const port = 3000
micro(api).listen(port)

console.log('server started at http://locahost:' + port);
