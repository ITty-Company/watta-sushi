// Basic Metro config for React Native
const {getDefaultConfig} = require('metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig();
  return config;
})();


