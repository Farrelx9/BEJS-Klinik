// patch-punycode.js
const Module = require("module");
const originalRequire = Module.prototype.require;

Module.prototype.require = function (request) {
  if (request === "punycode") {
    return require("punycode.js");
  }
  return originalRequire.apply(this, arguments);
};
