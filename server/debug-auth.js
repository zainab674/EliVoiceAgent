
import { authenticateToken } from './utils/auth.js';
console.log('authenticateToken type:', typeof authenticateToken);
if (typeof authenticateToken !== 'function') {
    console.error('FAIL: authenticateToken is not a function');
    process.exit(1);
} else {
    console.log('PASS: authenticateToken is a function');
}
