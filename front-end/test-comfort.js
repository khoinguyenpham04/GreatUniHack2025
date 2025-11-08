#!/usr/bin/env node

const http = require('http');

const testMessages = [
  "i miss sarah",
  "i am missing my relatives",
  "i want to see photos of my daughter",
];

function testMessage(message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      messages: [
        { role: "user", content: message }
      ],
      actions: []
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/copilotkit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n📤 Testing: "${message}"`);
    console.log('─'.repeat(60));

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', parsed);
          resolve(parsed);
        } catch (e) {
          console.log('Raw response:', data.substring(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Comfort Agent Routing\n');
  
  for (const message of testMessages) {
    try {
      await testMessage(message);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    } catch (error) {
      console.error('Test failed:', error.message);
    }
  }
  
  console.log('\n✅ All tests completed');
}

runTests();
