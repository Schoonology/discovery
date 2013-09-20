'use strict';
var Discovery = require('../index.js').Discovery;
var discover = new Discovery();

var name = 'test';
var interval = 500;

var serv = {
  port: 80,
  proto: 'tcp',
  annInterval: 500,
  addrFamily: 'IPv4',
  bonus: {
    name: 'Edmond',
    day: 2233,
    week: [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday' ]
  }
};

discover.announce(name, interval, serv);
