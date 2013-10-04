var expect = require('chai').expect;
var common = require('./fixtures/common');
var discovery = require('../');

describe('HTTP', function () {
  var registry;
  var events;
  var tracker;

  beforeEach(function (done) {
    // tracker = common.forkTracker();
    // tracker.on('ready', function () {
      registry = discovery.createRegistry({
        manager: discovery.Http({ interval: 100 })
      });

      registry.on('available', function (name, service) {
        expect(service.available).to.equal(true);
        events.push('available');
      });

      registry.on('unavailable', function (name, service) {
        expect(service.available).to.equal(false);
        events.push('unavailable');
      });

      registry.on('update', function (name, service) {
        events.push('update');
      });

      events = [];

      done();
    // });
  });

  afterEach(function () {
    if (registry) {
      registry.destroy();
    }

    if (tracker) {
      tracker.kill();
    }
  });

  it('up-down', function (done) {
    registry.on('available', function (name, service) {
      expect(name).to.equal('test:http-updown');
      expect(service.name).to.equal('test:http-updown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
    });

    registry.on('unavailable', function (name, service) {
      expect(name).to.equal('test:http-updown');
      expect(service.name).to.equal('test:http-updown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
    });

    common.forkServiceTest('http-updown')
      .on('exit', function (code) {
        expect(code).to.equal(0, 'Subprocess did not exit nicely.');

        expect(events).to.deep.equal([
          'available',
          'unavailable'
        ]);

        done();
      });
  });

  it('up-down-up', function (done) {
    registry.once('available', function (name, service) {
      expect(name).to.equal('test:http-updownup');
      expect(service.name).to.equal('test:http-updownup');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
    });

    registry.once('unavailable', function (name, service) {
      expect(name).to.equal('test:http-updownup');
      expect(service.name).to.equal('test:http-updownup');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
    });

    common.forkServiceTest('http-updownup')
      .on('exit', function (code) {
        expect(code).to.equal(0, 'Subprocess did not exit nicely.');

        expect(events).to.deep.equal([
          'available',
          'unavailable',
          'available'
        ]);

        done();
      });
  });

  it('up-update-down', function (done) {
    registry.once('available', function (name, service) {
      expect(name).to.equal('test:http-upupdatedown');
      expect(service.name).to.equal('test:http-upupdatedown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.not.exist;
    });

    registry.once('update', function (name, service) {
      expect(name).to.equal('test:http-upupdatedown');
      expect(service.name).to.equal('test:http-upupdatedown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.equal('foo');
    });

    registry.once('unavailable', function (name, service) {
      expect(name).to.equal('test:http-upupdatedown');
      expect(service.name).to.equal('test:http-upupdatedown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.equal('foo');
    });

    common.forkServiceTest('http-upupdatedown')
      .on('exit', function (code) {
        expect(code).to.equal(0, 'Subprocess did not exit nicely.');

        expect(events).to.deep.equal([
          'available',
          'update',
          'unavailable'
        ]);

        done();
      });
  });

  it('up-down-up-update-down', function (done) {
    function phaseOne() {
      registry.once('available', function (name, service) {
        expect(name).to.equal('test:http-multi');
        expect(service.name).to.equal('test:http-multi');
        expect(service.local).to.equal(false);
        expect(service.data.foo).to.equal('bar');
        expect(service.data.bar).to.not.exist;
      });

      registry.once('unavailable', function (name, service) {
        expect(name).to.equal('test:http-multi');
        expect(service.name).to.equal('test:http-multi');
        expect(service.local).to.equal(false);
        expect(service.data.foo).to.equal('bar');
        expect(service.data.bar).to.not.exist;

        phaseTwo();
      });
    }

    function phaseTwo() {
      registry.once('available', function (name, service) {
        expect(name).to.equal('test:http-multi');
        expect(service.name).to.equal('test:http-multi');
        expect(service.local).to.equal(false);
        expect(service.data.foo).to.equal('bar');
        expect(service.data.bar).to.not.exist;
      });

      registry.once('update', function (name, service) {
        expect(name).to.equal('test:http-multi');
        expect(service.name).to.equal('test:http-multi');
        expect(service.local).to.equal(false);
        expect(service.data.foo).to.equal('bar');
        expect(service.data.bar).to.equal('foo');
      });

      registry.once('unavailable', function (name, service) {
        expect(name).to.equal('test:http-multi');
        expect(service.name).to.equal('test:http-multi');
        expect(service.local).to.equal(false);
        expect(service.data.foo).to.equal('bar');
        expect(service.data.bar).to.equal('foo');
      });
    }

    phaseOne();

    common.forkServiceTest('http-multi')
      .on('exit', function (code) {
        expect(code).to.equal(0, 'Subprocess did not exit nicely.');

        expect(events).to.deep.equal([
          'available',
          'unavailable',
          'available',
          'update',
          'unavailable'
        ]);

        done();
      });
  });

  it('up-update-update-down', function (done) {
    registry.once('available', function (name, service) {
      expect(name).to.equal('test:http-dblupdate');
      expect(service.name).to.equal('test:http-dblupdate');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.not.exist;
    });

    registry.once('update', function (name, service) {
      expect(name).to.equal('test:http-dblupdate');
      expect(service.name).to.equal('test:http-dblupdate');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.equal('foo');
    });

    registry.once('unavailable', function (name, service) {
      expect(name).to.equal('test:http-dblupdate');
      expect(service.name).to.equal('test:http-dblupdate');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.equal('foo');
    });

    common.forkServiceTest('http-dblupdate')
      .on('exit', function (code) {
        expect(code).to.equal(0, 'Subprocess did not exit nicely.');

        expect(events).to.deep.equal([
          'available',
          'update',
          'unavailable'
        ]);

        done();
      });
  });

  it.only('up-timeout', function (done) {
    var child;

    registry.on('available', function (name, service) {
      expect(name).to.equal('test:http-updown');
      expect(service.name).to.equal('test:http-updown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');

      child.kill();
    });

    registry.on('unavailable', function (name, service) {
      expect(name).to.equal('test:http-updown');
      expect(service.name).to.equal('test:http-updown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
    });

    child = common.forkServiceTest('http-updown')
      .on('exit', function () {
        setTimeout(function () {
          expect(events).to.deep.equal([
            'available',
            'unavailable'
          ]);

          done();
        }, 200);
      });
  });
});
