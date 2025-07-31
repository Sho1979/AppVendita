/**
 * Test completo delle funzionalità Context7 MCP
 */

const { spawn } = require('child_process');

console.log('🧪 Test funzionalità Context7 MCP...');

const context7 = spawn('npx', ['@upstash/context7-mcp', '--transport', 'stdio'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let messageId = 1;

// Funzione per inviare messaggi
function sendMessage(method, params = {}) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  context7.stdin.write(JSON.stringify(message) + '\n');
  console.log(`📤 Invio: ${method}`);
}

// Test di inizializzazione
sendMessage('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'test-client',
    version: '1.0.0'
  }
});

// Test per ottenere la lista degli strumenti disponibili
setTimeout(() => {
  sendMessage('tools/list');
}, 1000);

// Test per risolvere una libreria
setTimeout(() => {
  sendMessage('tools/call', {
    name: 'resolve-library-id',
    arguments: {
      libraryName: 'react'
    }
  });
}, 2000);

// Test per ottenere documentazione
setTimeout(() => {
  sendMessage('tools/call', {
    name: 'get-library-docs',
    arguments: {
      context7CompatibleLibraryID: '/facebook/react',
      topic: 'hooks',
      tokens: 5000
    }
  });
}, 3000);

context7.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log('📤 Risposta:', JSON.stringify(response, null, 2));
  } catch {
    console.log('📤 Risposta raw:', data.toString());
  }
});

context7.stderr.on('data', (data) => {
  console.log('⚠️ Errore:', data.toString());
});

context7.on('error', (error) => {
  console.log('❌ Errore spawn:', error.message);
});

context7.on('close', (code) => {
  console.log(`🔚 Terminato con codice: ${code}`);
});

// Termina dopo 8 secondi
setTimeout(() => {
  console.log('⏰ Terminazione test...');
  context7.kill();
}, 8000); 