/**
 * Logger Test Script
 * Tests Winston logging functionality
 */

const logger = require('./src/utils/logger');

console.log('Testing Winston Logger...\n');

// Test different log levels
logger.error('Test error message', {
    errorCode: 'TEST_001',
    details: 'This is a test error'
});

logger.warn('Test warning message', {
    warningType: 'TEST_WARNING',
    details: 'This is a test warning'
});

logger.info('Test info message', {
    action: 'test',
    status: 'success'
});

logger.http('Test HTTP message', {
    method: 'GET',
    url: '/test',
    status: 200
});

logger.debug('Test debug message', {
    debugInfo: 'Detailed debugging information'
});

// Test helper methods
logger.logAlert('test_alert_key', 'test_vehicle', 'accident', [40.7128, -74.0060]);

logger.logBlockchain('test_action', {
    txHash: '0x1234567890abcdef',
    blockNumber: 12345
});

logger.logSignature(true, 'test_vehicle');
logger.logSignature(false, 'test_vehicle', 'Invalid signature');

logger.logError('test_context', new Error('Test error'), {
    additionalInfo: 'Extra context'
});

console.log('\n✅ Logger test complete!');
console.log('Check the following files:');
console.log('  - node/logs/error.log');
console.log('  - node/logs/combined.log');
console.log('  - node/logs/access.log');
