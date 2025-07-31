/**
 * Test semplificato per Context7 MCP
 */

const { spawn } = require('child_process');

console.log('🧪 Test Context7 MCP...');

// Test diretto del comando usando npm exec
const context7 = spawn('npm', ['exec', 'npx', '-y', '@upstash/context7-mcp'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log('✅ Context7 avviato');

// Test di inizializzazione
const initMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

context7.stdin.write(JSON.stringify(initMessage) + '\n');

context7.stdout.on('data', (data) => {
  console.log('📤 Risposta:', data.toString());
});

context7.stderr.on('data', (data) => {
  console.log('⚠️ Errore:', data.toString());
});

context7.on('close', (code) => {
  console.log(`🔚 Terminato con codice: ${code}`);
});

// Termina dopo 3 secondi
setTimeout(() => {
  context7.kill();
  console.log('⏰ Test completato');
}, 3000); 