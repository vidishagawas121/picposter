require('dotenv').config();
const smsService = require('./src/services/smsService');

async function testSms() {
    console.log('Testing Fast2SMS configuration...');
    console.log('Provider:', process.env.SMS_PROVIDER);
    console.log('OTP ID:', process.env.FAST2SMS_OTP_ID);
    
    // Test with a sample mobile number without throwing if not live, or log result
    try {
        const testMobile = '9999999999';
        const testOtp = '123456';
        console.log(`Attempting test send to ${testMobile}...`);
        const result = await smsService.sendOtpSms(testMobile, testOtp);
        console.log('Result:', result);
    } catch (err) {
        console.log('Test caught expected error or gateway response:', err.message);
    }
}

testSms();
