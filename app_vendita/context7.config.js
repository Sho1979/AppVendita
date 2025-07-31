module.exports = {
  // Configurazione del progetto
  project: {
    name: 'app_vendita',
    type: 'react-native',
    framework: 'expo',
  },

  // Configurazione del codice
  code: {
    // Directory da analizzare
    include: [
      'src/**/*.{ts,tsx,js,jsx}',
      'App.tsx',
      'package.json',
      'app.json',
    ],

    // Directory da escludere
    exclude: ['node_modules/**', '.expo/**', 'dist/**', 'build/**'],

    // Configurazione TypeScript
    typescript: {
      strict: true,
      checkJs: true,
    },
  },

  // Configurazione dell'analisi
  analysis: {
    // Analisi dell'architettura
    architecture: {
      patterns: [
        'clean-architecture',
        'repository-pattern',
        'provider-pattern',
      ],
      layers: ['presentation', 'domain', 'data'],
    },

    // Analisi delle dipendenze
    dependencies: {
      track: true,
      circular: true,
      unused: true,
    },

    // Analisi delle performance
    performance: {
      reRenders: true,
      memory: true,
      bundle: true,
    },

    // Analisi della qualità del codice
    quality: {
      complexity: true,
      maintainability: true,
      testability: true,
    },
  },

  // Configurazione del reporting
  reporting: {
    output: {
      console: true,
      file: './context7-report.json',
    },

    format: {
      detailed: true,
      summary: true,
      recommendations: true,
    },
  },

  // Configurazione MCP
  mcp: {
    enabled: true,
    port: 3001,
    host: 'localhost',
    protocol: 'http',
  },
};
