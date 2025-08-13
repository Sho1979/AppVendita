const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurazione per host fisso
config.server = {
  port: 8081,
  host: 'localhost',
};

// Assicura il supporto a moduli legacy/mjs richiesti da pdfjs-dist legacy
config.resolver = config.resolver || {};
config.resolver.sourceExts = config.resolver.sourceExts || ['js','json','ts','tsx'];
['mjs','cjs'].forEach(ext => {
  if (!config.resolver.sourceExts.includes(ext)) config.resolver.sourceExts.push(ext);
});

module.exports = config;
