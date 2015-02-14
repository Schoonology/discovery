'use strict';
/*!
 * TODO: Description.
 */
var dgram = require('dgram');
var util = require('util');
var ip = require('ip');
var debug = require('../debug')('discovery:UdpBroadcast');
var Manager = require('../manager');

var Defaults = {
  DGRAM_TYPE: 'udp4',
  PORT: 44201,
  INTERVAL: 3000,
  MULTICAST_ADDRESS: '224.0.0.234'
};

/**
 * Creates a new instance of UdpBroadcastManager with the provided `options`.
 *
 * The UdpBroadcastManager provides a client connection to the
 * zero-configuration, UDP-based discovery system that is used by Discovery
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

  Manager.call(this, options);

  debug('New UdpBroadcastManager: %j', options);

  this.dgramType = options.dgramType ? String(options.dgramType).toLowerCase() : Defaults.DGRAM_TYPE;
  this.port = options.port || Defaults.PORT;
  this.address = options.address || null;
  this.multicastAddress = options.multicastAddress || Defaults.MULTICAST_ADDRESS;

  this.interval = options.interval || Defaults.INTERVAL;
  this.timeout = options.timeout || this.interval * 2.5;

  this._timeoutTimerIds = {};
  this._announceTimerId = null;

  this._initSocket();
  this._startAnnouncements();
}
util.inherits(UdpBroadcastManager, Manager);
UdpBroadcastManager.Defaults = Defaults;

/**
 * Signals a graceful shutdown of the UdpBroadcastManager.
 *
 * @see Manager.prototype.destroy
 *
 * @return {UdpBroadcastManager} The UdpBroadcastManager instance, for cascading.
 */
UdpBroadcastManager.prototype.destroy = destroy;
function destroy() {
  var self = this;

  self._stopAnnouncements();
  self.socket.close();

  Object.keys(self._timeoutTimerIds)
    .forEach(function (key) {
      clearTimeout(self._timeoutTimerIds[key]);
    });

  return self;
}

/**
 * Returns a UDP-specific unique identifier using the machine's IP address
 * and the configured port number.
 *
 * See Manager.generateId for more information.
 *
 * @return {String} The indentifier.
 */
UdpBroadcastManager.prototype.generateId = generateId;
function generateId() {
  var self = this;

  return ip.address() + ':' + self.port;
}

/**
 * For each of these methods, we want to replicate what Manager does, but send
 * and extra announcement.
 */
['addLocalService', 'removeLocalService', 'updateLocalService']
  .forEach(function (name) {
    UdpBroadcastManager.prototype[name] = function (service) {
      Manager.prototype[name].call(this, service);
      this._sendAnnouncement();
      return this;
    };
  });

/**
 * @private
 *
 * Creates the required UDP socket, binding events to the Manager.
 */
UdpBroadcastManager.prototype._initSocket = _initSocket;
function _initSocket() {
  var self = this;

  self.socket = dgram.createSocket(self.dgramType);
  self.socket.bind(self.port, self.address);

  self.socket.on('listening', function () {
    debug('Adding UDP multicast membership at `%s`.', self.multicastAddress);

    self.socket.setMulticastTTL(1);
    self.socket.setMulticastLoopback(true);
    self.socket.addMembership(self.multicastAddress);
  });

  self.socket.on('error', function (err) {
    self.emit('error', err);
  });

  self.socket.on('message', function (message, rinfo) {
    debug('Received "%s" over the network.', message);

    try {
      message = JSON.parse(message);
    } catch (e) {
      // Ignore.
      return;
    }

    self._handleAnnouncement(message, rinfo);
  });

  return self;
}

/**
 * @private
 *
 * Starts broadcasting all local services over UDP as configured, at
 * `interval` milliseconds.
 */
UdpBroadcastManager.prototype._startAnnouncements = _startAnnouncements;
function _startAnnouncements() {
  var self = this;

  self._announceTimerId = setInterval(function () {
    self._sendAnnouncement();
  }, self.interval);

  return self;
}

/**
 * @private
 *
 * Sends a single announcement to all peers. Called periodically and
 * to flush updates.
 */
UdpBroadcastManager.prototype._sendAnnouncement = _sendAnnouncement;
function _sendAnnouncement() {
  var self = this;
  var body = new Buffer(JSON.stringify(self.services));

  debug('Sending: %s', body);

  self.socket.send(body, 0, body.length, self.port, self.multicastAddress);

  return self;
}

/**
 * @private
 *
 * Stops broadcasting regular updates to peers. Any updates in progress
 * should complete.
 */
UdpBroadcastManager.prototype._stopAnnouncements = _stopAnnouncements;
function _stopAnnouncements() {
  var self = this;

  if (!self._announceTimerId) {
    return self;
  }

  clearInterval(self._announceTimerId);
  self._announceTimerId = null;

  return self;
}

/**
 * @private
 *
 * Updates any associated Registries with the Service data in `body`.
 *
 * @param {Object} body
 */
UdpBroadcastManager.prototype._handleAnnouncement = _handleAnnouncement;
function _handleAnnouncement(body, rinfo) {
  var self = this;

  Object.keys(body).forEach(function (id) {
    var service = body[id];

    service.rinfo = rinfo;

    self.emit(service.available ? 'available' : 'unavailable', id, service);
    self.emit('update', id, service);

    if (self._timeoutTimerIds[id]) {
      clearTimeout(self._timeoutTimerIds[id]);
    }

    debug('Setting timeout for %s to %s ms.', id, self.timeout);

    self._timeoutTimerIds[id] = setTimeout(function () {
      self._timeoutTimerIds[id] = null;

      debug('Timeout: %s', id);

      self.emit('unavailable', id, service);
    }, self.timeout);
  });

  return self;
}

/*!
 * Export `UdpBroadcastManager`.
 */
module.exports = UdpBroadcastManager;
