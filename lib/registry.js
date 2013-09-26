'use strict';
/*!
 * TODO: Description.
 */
var assert = require('assert');
var events = require('events');
var util = require('util');
var debug = require('debug')('discovery:Registry');
var Service = require('./service');
var UdpBroadcast = require('./managers/broadcast');

/**
 * Creates a new instance of Registry with the provided `options`.
 *
 * The Registry is the cornerstone of the SuperCluster Discovery system. Each
 * node in the cluster is expected to have at least one Registry, with that
 * Registry being responsible for one or more local Services. Its Manager, in
 * turn, synchronizes the Registry's understanding of the cluster and its
 * remotely-available Services.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function Registry(options) {
  if (!(this instanceof Registry)) {
    return new Registry(options);
  }

  options = options || {};

  this.manager = options.manager || new UdpBroadcast();
  this.services = {};

  this._initProperties(options);
  this._initManager();
}
util.inherits(Registry, events.EventEmitter);
Registry.createRegistry = Registry;

/**
 * TODO: Description.
 */
Registry.prototype.createService = createService;
function createService(name, data, available) {
  var self = this;

  if (!name || typeof name !== 'string' || name === '__proto__') {
    console.trace('Valid name is required for createService.');
    return null;
  }

  if (!data) {
    // TODO(schoon) - Use `debug` instead?
    console.warn('No data passed to createService. This is usually accidental.');
  }

  if (available == null) {
    available = true;
  }

  // We start the Service as unavailable to let it trigger the first 'available'
  // event later, if appropriate.
  var service = new Service({
    name: name,
    data: data,
    available: false,
    local: true
  });

  self.services[name] = service;
  self._bindToServiceEvents(service);

  // If `available` is true, this will kick of the 'available' event.
  service.available = available;

  return service;
}

/**
 * TODO: Description.
 */
Registry.prototype.generateId = generateId;
function generateId() {
  var self = this;
  var salt = Math.random().toString().slice(2, 6);

  return self.manager.generateId() + ':' + salt;
}

/**
 * TODO: Description.
 */
Registry.prototype.getFullServiceName = getFullServiceName;
function getFullServiceName(service) {
  var self = this;

  return service.name + ':' + self.id;
}

/**
 * TODO: Description.
 */
Registry.prototype._bindToServiceEvents = _bindToServiceEvents;
function _bindToServiceEvents(service) {
  var self = this;

  service.on('update', function () {
    // TODO
  });
  service.on('available', function () {
    // TODO
  });
  service.on('unavailable', function () {
    // TODO
  });

  return self;
}

/**
 * TODO: Description.
 */
Registry.prototype._initProperties = _initProperties;
function _initProperties(options) {
  var self = this;
  var _id = options.id;

  Object.defineProperty(self, 'id', {
    get: function () {
      if (!_id) {
        _id = self.generateId();
        debug('Generated new Registry ID: %s', _id);
      }

      return _id;
    }
  });

  return self;
}

/**
 * TODO: Description.
 */
Registry.prototype._initManager = _initManager;
function _initManager() {
  var self = this;

  self.manager.on('available', function () {
    // TODO
  });
  self.manager.on('unavailable', function () {
    // TODO
  });

  return self;
}

/*!
 * Export `Registry`.
 */
module.exports = Registry;
