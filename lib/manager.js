'use strict';
/*!
 * TODO: Description.
 */
var events = require('events');
var util = require('util');

/**
 * Creates a new instance of Manager with the provided `options`.
 *
 * This class provides the abstract interface for more specific Manager
 * implementations.
 *
 * See UdpBroadcastManager for a specific example, and the README for more
 * information about the design.
 *
 * @param {Object} options
 */
function Manager(options) {
  if (!(this instanceof Manager)) {
    return new Manager(options);
  }

  options = options || {};


}
util.inherits(Manager, events.EventEmitter);

/**
 * TODO: Description.
 */
Manager.prototype.generateId = generateId;
function generateId() {
  var self = this;
  var seed = Math.random().toString();

  return seed.slice(2, 6) + '-' + seed.slice(6, 10);
}

/*!
 * Export `Manager`.
 */
module.exports = Manager;
