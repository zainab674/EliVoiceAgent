
import router from './routes/user.js';
console.log('Loaded user router successfully');
if (typeof router !== 'function') {
    console.error('FAIL: Router is not a function');
} else {
    console.log('PASS: Router is a function');
}
