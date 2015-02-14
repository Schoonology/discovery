var expect = require('chai').expect;
var discovery = require('../');

describe('Registry', function () {
  var registry;

  afterEach(function () {
    if (registry) {
      registry.destroy();
    }
  });

  it('should provide defaults', function () {
    registry = discovery.createRegistry();
  });

  it('should resolve service names', function () {
    registry = discovery.createRegistry({
      manager: discovery.Manager()
    });

    var fullName = registry.getUniqueServiceId({ name: 'test' });

    expect(fullName.slice(0, 5)).to.equal('test:');
    expect(fullName.slice(5)).to.equal(registry.id);
  });
});
