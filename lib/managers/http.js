'use strict';
var http = require('http');
var util = require('util');
var ip = require('ip');
var debug = require('../debug')('discovery:Http');
var Manager = require('../manager');

var Defaults = {
  PORT: 4201,
  INTERVAL: 3000
};

/**
 * Creates a new instance of HttpManager with the provided `options`.
 *
 * The HttpManager provides a client connection to the HTTP-based, Tracker
 * discovery system.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function HttpManager(options) {
  if (!(this instanceof HttpManager)) {
    return new HttpManager(options);
  }

  options = options || {};

  Manager.call(this, options);

  debug('New HttpManager: %j', options);

  this.hostname = options.hostname || null;
  this.port = options.port || Defaults.PORT;

  this.interval = options.interval || Defaults.INTERVAL;

  this._announceTimerId = null;

  this._startAnnouncements();
}
util.inherits(HttpManager, Manager);
HttpManager.Defaults = Defaults;

/**
 * Signals a graceful shutdown of the HttpManager.
 *
 * @see Manager.prototype.destroy
 *
 * @return {HttpManager} The HttpManager instance, for cascading.
 */
HttpManager.prototype.destroy = destroy;
function destroy() {
  var self = this;

  self._stopAnnouncements();

  return self;
}

/**
 * Returns an HTTP-specific unique identifier using the machine's IP address
 * and the configured port number.
 *
 * See Manager.generateId for more information.
 *
 * @return {String} The indentifier.
 */
HttpManager.prototype.generateId = generateId;
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
    HttpManager.prototype[name] = function (service) {
      Manager.prototype[name].call(this, service);

      if (this._announceTimerId) {
        this._sendAnnouncement();
      }

      return this;
    };
  });

/**
 * @private
 *
 * Starts broadcasting all local services over HTTP as configured, at
 * `interval` milliseconds.
 */
HttpManager.prototype._startAnnouncements = _startAnnouncements;
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
 * Sends a single announcement to the server. Called periodically and
 * to flush updates.
 */
HttpManager.prototype._sendAnnouncement = _sendAnnouncement;
function _sendAnnouncement() {
  var self = this;
  var body = new Buffer(JSON.stringify({ services: self.services }));

  debug('Sending: %s', body);

  http
    .request({
      hostname: self.hostname,
      port: self.port,
      method: 'POST'
    })
    .on('error', function (err) {
      self.emit('error', err);
    })
    .on('response', function (res) {
      var buffer = '';

      res
        .on('data', function (chunk) {
          buffer += String(chunk);
        })
        .on('end', function () {
          try {
            buffer = JSON.parse(buffer);
          } catch (e) {
            return;
          }

          self._handleAnnouncement(buffer);
        })
        .on('error', function (err) {
          self.emit('error', err);
        });
    })
    .end(body);

  return self;
}

/**
 * @private
 *
 * Stops broadcasting regular updates to the server. Any updates in progress
 * should complete.
 */
HttpManager.prototype._stopAnnouncements = _stopAnnouncements;
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
HttpManager.prototype._handleAnnouncement = _handleAnnouncement;
function _handleAnnouncement(body) {
  var self = this;

  Object.keys(body).forEach(function (id) {
    var service = body[id];

    self.emit(service.available ? 'available' : 'unavailable', id, service);
    self.emit('update', id, service);
  });

  return self;
}

/*!
 * Export `HttpManager`.
 */
module.exports = HttpManager;
