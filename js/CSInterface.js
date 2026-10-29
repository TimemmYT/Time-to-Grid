/* CSInterface minimal wrapper - Time to Grid */
function CSInterface() {}

CSInterface.prototype.evalScript = function (script, callback) {
  callback = callback || function () {};
  window.__adobe_cep__.evalScript(script, callback);
};

CSInterface.prototype.getHostEnvironment = function () {
  return JSON.parse(window.__adobe_cep__.getHostEnvironment());
};

CSInterface.prototype.getSystemPath = function (pathType) {
  var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
  return path.replace('file:///', '').replace('file://', '');
};

CSInterface.prototype.getApplicationID = function () {
  return this.getHostEnvironment().appId;
};
