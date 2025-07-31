const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurazione per host fisso
config.server = {
  port: 8081,
  host: 'localhost',
};

module.exports = config;
