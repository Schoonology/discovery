'use strict';
var assert = require('assert');
var Discovery = require('../index.js').Discovery;
var discover = new Discovery();

var serv = {
  debug: true,
  name: 'test',
  annInterval: 500,
  port: 80,
  proto: 'tcp',
  addrFamily: 'IPv4',
  userData: {
    name: 'Edmond',
    day: 2233,
    week: [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday' ]
  }
};

var count = 0;

describe('Discover time out', function() {
  it('Should remove the service from the table in less than 2100 ms', function(cb) {
    this.timeout(2100);
    discover.on('available', function(name, available, msg, reason) {
      count++;
      if (count === 1)
        assert.ok(reason==='new');
      if (count === 2) {
        assert.ok(reason==='timedOut');
        assert.ok(typeof discover.services !== 'undefined');
        assert.ok(typeof discover.services.test === 'undefined');
        cb();
      }
    });

    discover.announce('test', 500, serv, true);
    discover.stopAnnounce('test');
  });
});
