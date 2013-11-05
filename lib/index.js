'use strict';

var Registry = require('./registry');
var Service = require('./service');
var Manager = require('./manager');
var UdpBroadcast = require('./managers/broadcast');
var Http = require('./managers/http');

module.exports = {
  Registry: Registry,
  createRegistry: Registry.createRegistry,
  Service: Service,
  Manager: Manager,
  UdpBroadcast: UdpBroadcast,
  Http: Http
};
