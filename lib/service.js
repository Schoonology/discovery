'use strict';
/*!
 * TODO: Description.
 */
var assert = require('assert');
var events = require('events');
var util = require('util');
var clone = require('clone');

/**
 * Creates a new instance of Service with the provided `options`.
 *
 * A Service is a simple wrapper around its `data` to ease managing the
 * Service's representation within its Registry and the announcements thereof.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function Service(options) {
  if (!(this instanceof Service)) {
    return new Service(options);
  }

  options = options || {};

  // There's no reasonable way to protect this, so we let it be writable with
  // the understanding that .update is called in the future. TL;DR - Write at
  // your own risk.
  this.data = clone(options.data || {});

  this._initProperties(options);

  assert(this.name, 'Name is required.');
}
util.inherits(Service, events.EventEmitter);

/**
 * TODO: Description.
 */
Service.prototype.update = update;
function update(data) {
  var self = this;

  util._extend(self.data, data);
  self.emit('update', self);

  return self;
}

/**
 * TODO: Description.
 */
Service.prototype._initProperties = _initProperties;
function _initProperties(options) {
  var self = this;
  var _available = options.available || false;

  Object.defineProperty(self, 'name', {
    value: options.name
  });
  Object.defineProperty(self, 'local', {
    value: options.local || false
  });
  Object.defineProperty(self, 'available', {
    get: function () {
      return _available;
    },
    set: function (value) {
      value = !!value;

      if (_available === value) {
        return;
      }

      _available = value;

      self.emit(_available ? 'available' : 'unavailable', self);
    }
  });

  return self;
}

/*!
 * Export `Service`.
 */
module.exports = Service;
