class SmsService {
    /**
     * Send SMS to recipient phone number
     */
    async sendSms(mobile, message) {
        const provider = (process.env.SMS_PROVIDER || 'MOCK').toUpperCase();
        const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;

        if (provider === 'FAST2SMS' && apiKey) {
            try {
                // Strip +91 country code for Indian numbers as required by Fast2SMS
                const cleanNumber = mobile.replace(/^\+91/, '').replace(/\D/g, '');
                const otpMatch = message.match(/\b\d{6}\b/);
                const otp = otpMatch ? otpMatch[0] : '';

                const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                    method: 'POST',
                    headers: {
                        authorization: apiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        route: 'otp',
                        variables_values: otp,
                        numbers: cleanNumber,
                    }),
                });

                const data = await response.json();
                if (data && data.return) {
                    console.log(`[FAST2SMS] OTP sent successfully to ${cleanNumber}`);
                } else {
                    console.error('[FAST2SMS Error Response]', data);
                }
                return { success: true };
            } catch (err) {
                console.error('[FAST2SMS Gateway Error]', err.message);
                return { success: false, error: err.message };
            }
        }

        // Mock / Development mode
        console.log(`\n========================================`);
        console.log(`[SMS GATEWAY - ${provider}]`);
        console.log(`To: ${mobile}`);
        console.log(`Message: ${message}`);
        console.log(`========================================\n`);

        return { success: true };
    }
}

module.exports = new SmsService();
