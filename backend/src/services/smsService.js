class SmsService {
    /**
     * Send SMS to recipient phone number
     */
    async sendSms(mobile, message) {
        const provider = process.env.SMS_PROVIDER || 'MOCK';

        const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
        const apiUrl = process.env.FAST2SMS_API_URL || 'https://www.fast2sms.com/dev/bulkV2';

        if (provider === 'FAST2SMS') {
            if (!apiKey) {
                console.error('[FAST2SMS Error] FAST2SMS_API_KEY is missing in environment variables');
                throw new Error('SMS gateway API key is missing');
            }

            try {
                // Fast2SMS requires 10-digit number without +91 prefix
                const cleanMobile = mobile.replace(/^\+?91/, '').replace(/\D/g, '');

                const payload = {
                    route: 'q',
                    message,
                    language: 'english',
                    flash: 0,
                    numbers: cleanMobile,
                };

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        authorization: apiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (!response.ok || data.return === false) {
                    console.error('[FAST2SMS API Error]', data);
                    throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'SMS delivery rejected'));
                }

                console.log(`[FAST2SMS Success] Sent to ${cleanMobile}, Request ID: ${data.request_id || 'N/A'}`);
                return { success: true, requestId: data.request_id || null };
            } catch (err) {
                console.error('[FAST2SMS Error]', err.message);
                throw new Error(`Failed to send SMS: ${err.message}`);
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
