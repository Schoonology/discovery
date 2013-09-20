'use strict';
var Discovery = require('../index.js').Discovery;
var discover = new Discovery();
discover.on('available', function(name, available, data, reason) {
  console.log(name,':','available: '+available,reason);
  console.log(data);
});
