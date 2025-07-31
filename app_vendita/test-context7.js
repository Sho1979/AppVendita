/**
 * Test script per Context7 MCP
 * Verifica l'integrazione con il server MCP
 */

const { spawn } = require('child_process');

// Test del server Context7
async function testContext7() {
  console.log('🧪 Testando Context7 MCP...');

  const context7 = spawn('npx', ['-y', '@upstash/context7-mcp'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Test di base
  const testMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  };

  context7.stdin.write(JSON.stringify(testMessage) + '\n');

  context7.stdout.on('data', data => {
    console.log('✅ Context7 risposta:', data.toString());
  });

  context7.stderr.on('data', data => {
    console.log('⚠️ Context7 errore:', data.toString());
  });

  context7.on('close', code => {
    console.log(`🔚 Context7 terminato con codice: ${code}`);
  });

  // Termina dopo 5 secondi
  setTimeout(() => {
    context7.kill();
  }, 5000);
}

testContext7().catch(console.error);
