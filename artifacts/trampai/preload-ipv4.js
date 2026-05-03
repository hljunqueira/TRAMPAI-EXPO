/**
 * preload-ipv4.js
 * Loaded via NODE_OPTIONS=--require to force Metro's HTTP server to bind on
 * 0.0.0.0 (IPv4) instead of :: / localhost (IPv6).  Replit's workflow health
 * check reads /proc/net/tcp (IPv4 only), so Metro must be reachable there.
 */
'use strict';
const net = require('net');
const orig = net.Server.prototype.listen;

net.Server.prototype.listen = function (arg0, arg1, ...rest) {
  // Cases where the second argument is a hostname string
  if (typeof arg1 === 'string') {
    if (arg1 === 'localhost' || arg1 === '::1' || arg1 === '::') {
      arg1 = '0.0.0.0';
    }
  }
  // Cases where options object carries a host field
  if (arg0 && typeof arg0 === 'object' && !Array.isArray(arg0)) {
    const h = arg0.host;
    if (h === 'localhost' || h === '::1' || h === '::' || h == null) {
      arg0 = { ...arg0, host: '0.0.0.0' };
    }
  }
  return orig.call(this, arg0, arg1, ...rest);
};
