'use strict';
/*!
 * TODO: Description.
 */
var dgram = require('dgram');
var util = require('util');
var debug = require('../debug')('discovery:UdpBroadcast');
var Manager = require('../manager');

var Defaults = {
  DGRAM_TYPE: 'udp4',
  PORT: 44201,
  TIMEOUT: 1000,
  ANNOUNCE_INTERVAL: 3000,
  MULTICAST_ADDRESS: '224.0.0.234'
};

/**
 * Creates a new instance of UdpBroadcastManager with the provided `options`.
 *
 * The UdpBroadcastManager provides a client connection to the
 * zero-configuration, UDP-based discovery system that is used by SuperCluster
 * by default. Because it requires zero configuration to use, it's ideal for
 * initial exploration and development. However, it's not expected to work
 * at-scale, and should be replaced with the included HTTP-based version.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function UdpBroadcastManager(options) {
  if (!(this instanceof UdpBroadcastManager)) {
    return new UdpBroadcastManager(options);
  }

  options = options || {};

  debug('New UdpBroadcastManager: %j', options);

  this.dgramType = options.dgramType ? String(options.dgramType).toLowerCase() : Defaults.DGRAM_TYPE;
  this.port = options.port || Defaults.PORT;
  this.address = options.address || null;
  this.multicastAddress = options.multicastAddress || Defaults.MULTICAST_ADDRESS;

  this._initSocket();
}
util.inherits(UdpBroadcastManager, Manager);
UdpBroadcastManager.Defaults = Defaults;

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype.destroy = destroy;
function destroy() {
  var self = this;

  self.socket.close();

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype.generateId = generateId;
function generateId() {
  var self = this;
  var data = self.socket.address();

  // TODO(schoon) - Add a 'ready' event for Managers before generateId is
  // available. Add a similar event to Registry for generateId/createService.

  // TODO(schoon) - Implemented this way, this isn't unique.

  return data.address + ':' + data.port;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype.addLocalService = addLocalService;
function addLocalService(service, reason) {
  var self = this;

  self._send('available', service, reason);

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype.removeLocalService = removeLocalService
function removeLocalService(service, reason) {
  var self = this;

  self._send('unavailable', service, reason);

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype.updateLocalService = updateLocalService;
function updateLocalService(service, reason) {
  var self = this;

  self._send('update', service, reason);

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype._send = _send;
function _send(event, service, reason) {
  var self = this;
  var buf = JSON.stringify({
    event: event,
    service: service,
    reason: reason
  });

  debug('Sending: %s', buf);

  buf = new Buffer(buf);

  self.socket.send(buf, 0, buf.length, self.port, self.multicastAddress);

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype._initSocket = _initSocket;
function _initSocket() {
  var self = this;

  self.socket = dgram.createSocket(self.dgramType);
  self.socket.bind(self.port, self.address);

  self.socket.on('listening', function () {
    debug('Adding UDP multicast membership at `%s`.', self.multicastAddress);
    self.socket.addMembership(self.multicastAddress);
  });
  self.socket.on('error', function (err) {
    self.emit('error', err);
  });
  self.socket.on('message', function (message) {
    message = JSON.parse(message);

    var event = message.event;
    var service = message.service;
    var reason = message.reason;

    debug('Received "%s" over the network for Service "%s".', event, service.name);

    self.emit(event, service.name, service, reason);
  });

  return self;
}

/*!
 * Export `UdpBroadcastManager`.
 */
module.exports = UdpBroadcastManager;
