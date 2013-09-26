'use strict';
/*!
 * TODO: Description.
 */
var dgram = require('dgram');
var util = require('util');
var Manager = require('../manager');

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


}
util.inherits(UdpBroadcastManager, Manager);

/*!
 * Export `UdpBroadcastManager`.
 */
module.exports = UdpBroadcastManager;
