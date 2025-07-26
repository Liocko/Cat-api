import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TARGET_RPS = 120; // Target RPS (above threshold 100)
const DURATION_SECONDS = 120; // Load duration in seconds (2 minutes)
const INTERVAL_MS = 1000 / TARGET_RPS; // Interval between requests

console.log(`Starting DB load test:`);
console.log(`   Target RPS: ${TARGET_RPS}`);
console.log(`   Duration: ${DURATION_SECONDS} seconds`);
console.log(`   Interval: ${INTERVAL_MS.toFixed(2)}ms between requests`);
console.log('');

let requestCount = 0;
let startTime = Date.now();

async function makeDbRequest() {
  try {
    const response = await fetch(`${BASE_URL}/api/test/dbload?count=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.error(`Response: ${text.substring(0, 200)}...`);
      return null;
    }
    
    const data = await response.json();
    requestCount++;
    
    const elapsed = (Date.now() - startTime) / 1000;
    const currentRPS = requestCount / elapsed;
    
    if (requestCount % 20 === 0) {
      console.log(`Requests: ${requestCount}, Time: ${elapsed.toFixed(1)}s, Current RPS: ${currentRPS.toFixed(1)}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request error: ${error.message}`);
    return null;
  }
}

async function runLoadTest() {
  console.log('Starting load test...');
  
  // First check if service is available
  try {
    console.log('Checking service availability...');
    const testResponse = await fetch(`${BASE_URL}/api/test/dbload?count=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!testResponse.ok) {
      console.error(`Service unavailable: HTTP ${testResponse.status}`);
      return;
    }
    console.log('Service is available');
  } catch (error) {
    console.error(`Cannot connect to service: ${error.message}`);
    return;
  }
  
  const promises = [];
  const totalRequests = TARGET_RPS * DURATION_SECONDS;
  
  for (let i = 0; i < totalRequests; i++) {
    const delay = i * INTERVAL_MS;
    
    const promise = new Promise(resolve => {
      setTimeout(async () => {
        const result = await makeDbRequest();
        resolve(result);
      }, delay);
    });
    
    promises.push(promise);
  }
  
  console.log(`Planning ${totalRequests} requests...`);
  
  try {
    await Promise.all(promises);
    
    const totalTime = (Date.now() - startTime) / 1000;
    const finalRPS = requestCount / totalTime;
    
    console.log('');
    console.log('Load test completed!');
    console.log(`Total requests: ${requestCount}`);
    console.log(`Total time: ${totalTime.toFixed(1)}s`);
    console.log(`Final RPS: ${finalRPS.toFixed(1)}`);
    console.log('');
    console.log('Now check alerts in Prometheus and Telegram!');
    
  } catch (error) {
    console.error('Error in load test:', error);
  }
}

// Handle termination
process.on('SIGINT', () => {
  console.log('');
  console.log('Load test interrupted by user');
  process.exit(0);
});

// Start test
runLoadTest(); 