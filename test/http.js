var expect = require('chai').expect;
var obcheckt = require('obcheckt');
var common = require('./fixtures/common');
var discovery = require('../');

describe('HTTP', function () {
  var registry;
  var events;
  var tracker;

  beforeEach(function (done) {
    tracker = common.forkTracker();
    tracker.on('ready', function () {
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
    });
  });

  afterEach(function (done) {
    if (registry) {
      registry.destroy();
    }

    if (tracker) {
      tracker.kill();
      tracker.on('exit', function () {
        done();
      });
    } else {
      done();
    }
  });

  it('up-down', function (done) {
    var service = common.createRemoteServiceSpec('test', {
      foo: 'bar'
    });

    common.expectEvent(registry, 'available', service);
    common.expectEvent(registry, 'unavailable', service);

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
    var service = common.createRemoteServiceSpec('test', {
      foo: 'bar'
    });

    common.expectEvent(registry, 'available', service);
    common.expectEvent(registry, 'unavailable', service);

    registry.on('available', function () {
      common.expectEvent(registry, 'available', service);
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
    var original = common.createRemoteServiceSpec('test', {
      foo: 'bar',
      bar: obcheckt.Undefined
    });
    var updated = common.createRemoteServiceSpec('test', {
      foo: 'bar',
      bar: 'foo'
    });

    common.expectEvent(registry, 'available', original);
    common.expectEvent(registry, 'update', updated);
    common.expectEvent(registry, 'unavailable', updated);

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
    var original = common.createRemoteServiceSpec('test', {
      foo: 'bar',
      bar: obcheckt.Undefined
    });
    var updated = common.createRemoteServiceSpec('test', {
      foo: 'bar',
      bar: 'foo'
    });

    function phaseOne() {
      common.expectEvent(registry, 'available', original);
      common.expectEvent(registry, 'unavailable', original);

      registry.once('unavailable', function (name, service) {
        phaseTwo();
      });
    }

    function phaseTwo() {
      common.expectEvent(registry, 'available', original);
      common.expectEvent(registry, 'update', updated);
      common.expectEvent(registry, 'unavailable', updated);
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
    var original = common.createRemoteServiceSpec('test', {
      foo: 'bar',
      bar: obcheckt.Undefined
    });
    var updated = common.createRemoteServiceSpec('test', {
      foo: 'bar',
      bar: 'foo'
    });

    common.expectEvent(registry, 'available', original);
    common.expectEvent(registry, 'update', updated);
    common.expectEvent(registry, 'unavailable', updated);

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

  it('up-timeout', function (done) {
    var child;
    var service = common.createRemoteServiceSpec('test', {
      foo: 'bar'
    });

    common.expectEvent(registry, 'available', service);
    common.expectEvent(registry, 'unavailable', service);

    registry.on('available', function (name, service) {
      child.kill();
    });

    child = common.forkServiceTest('http-updown')
      .on('exit', function () {
        setTimeout(function () {
          expect(events).to.deep.equal([
            'available',
            'unavailable'
          ]);

          done();
        }, 250);
      });
  });
});
