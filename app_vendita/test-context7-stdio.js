/**
 * Test Context7 MCP con stdio transport
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Test Context7 MCP con stdio...');

// Usa il percorso completo per npx
const npxPath = path.join(process.cwd(), 'node_modules', '.bin', 'npx.cmd');
console.log('📁 Percorso npx:', npxPath);

// Test con stdio transport
const context7 = spawn('npx', ['@upstash/context7-mcp', '--transport', 'stdio'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

console.log('✅ Context7 avviato con PID:', context7.pid);

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

console.log('📤 Invio messaggio di inizializzazione...');
context7.stdin.write(JSON.stringify(initMessage) + '\n');

context7.stdout.on('data', (data) => {
  console.log('📤 Risposta:', data.toString());
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

// Termina dopo 5 secondi
setTimeout(() => {
  console.log('⏰ Terminazione test...');
  context7.kill();
}, 5000); 