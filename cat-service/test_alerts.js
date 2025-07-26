import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const DURATION_SECONDS = 60;

// Utility function to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test high API RPS (without /api/test/dbload)
async function testApiRps() {
    console.log('\nTesting High API RPS...');
    console.log('Making 120 requests per second to /api/cat...');
    
    const startTime = Date.now();
    let requestCount = 0;
    
    while (Date.now() - startTime < DURATION_SECONDS * 1000) {
        const promises = [];
        for (let i = 0; i < 12; i++) { // 12 requests every 100ms = 120 RPS
            promises.push(fetch(`${BASE_URL}/api/cat`));
        }
        await Promise.all(promises);
        requestCount += 12;
        
        if (requestCount % 120 === 0) {
            console.log(`Requests: ${requestCount}, Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        }
        await sleep(100);
    }
}

// Test high latency
async function testHighLatency() {
    console.log('\nTesting High Latency...');
    console.log('Making requests with 1s delay...');
    
    const startTime = Date.now();
    let requestCount = 0;
    
    while (Date.now() - startTime < DURATION_SECONDS * 1000) {
        const promises = [];
        for (let i = 0; i < 5; i++) { // 5 parallel requests every 200ms
            promises.push(fetch(`${BASE_URL}/api/test/latency?ms=1000`));
        }
        await Promise.all(promises);
        requestCount += 5;
        
        console.log(`Requests: ${requestCount}, Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        await sleep(200);
    }
}

// Test 5xx errors
async function test5xxErrors() {
    console.log('\nTesting 5xx Errors...');
    console.log('Making requests to trigger 500 errors...');
    
    const startTime = Date.now();
    let requestCount = 0;
    
    while (Date.now() - startTime < DURATION_SECONDS * 1000) {
        try {
            await fetch(`${BASE_URL}/api/test/error`);
            requestCount++;
            
            if (requestCount % 10 === 0) {
                console.log(`Error Requests: ${requestCount}, Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
            }
        } catch (error) {
            // Expected error
        }
        await sleep(100); // 10 errors per second
    }
}

// Test DB operations (already have load_db.js for this)
async function testDbOperations() {
    console.log('\nTesting High DB RPS...');
    console.log('Making requests to generate DB load...');
    
    const startTime = Date.now();
    let requestCount = 0;
    
    while (Date.now() - startTime < DURATION_SECONDS * 1000) {
        const response = await fetch(`${BASE_URL}/api/test/dbload?count=100`, { method: 'POST' });
        if (!response.ok) {
            console.error(`HTTP ${response.status}: ${response.statusText}`);
            const text = await response.text();
            console.error(`Response: ${text.substring(0, 200)}...`);
            break;
        }
        requestCount += 100;
        console.log(`DB Operations: ${requestCount}, Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        await sleep(1000); // Wait 1 second between batches
    }
}

// Main test function
async function runTests() {
    try {
        // First check if service is available
        console.log('Checking service availability...');
        const testResponse = await fetch(`${BASE_URL}/api/cat`);
        if (!testResponse.ok) {
            console.error(`Service unavailable: HTTP ${testResponse.status}`);
            return;
        }
        console.log('Service is available\n');

        // Run tests
        console.log('Starting alert tests...');
        
        console.log('\n=== Test 1: High DB RPS ===');
        await testDbOperations();
        console.log('Waiting 30s for alerts to resolve...');
        await sleep(30000);
        
        console.log('\n=== Test 2: High API RPS ===');
        await testApiRps();
        console.log('Waiting 30s for alerts to resolve...');
        await sleep(30000);
        
        console.log('\n=== Test 3: High Latency ===');
        await testHighLatency();
        console.log('Waiting 30s for alerts to resolve...');
        await sleep(30000);
        
        console.log('\n=== Test 4: 5xx Errors ===');
        await test5xxErrors();
        console.log('Waiting 30s for alerts to resolve...');
        await sleep(30000);
        
        console.log('\nAll tests completed!');
        
    } catch (error) {
        console.error('Error in tests:', error);
    }
}

// Handle termination
process.on('SIGINT', () => {
    console.log('\nTests interrupted by user');
    process.exit(0);
});

// Start tests
runTests(); 