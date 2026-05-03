const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
