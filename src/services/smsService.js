class SmsService {
    /**
     * Send SMS to recipient phone number
     */
    async sendSms(mobile, message) {
        const provider = process.env.SMS_PROVIDER || 'MOCK';

        if (provider === 'FAST2SMS' && process.env.SMS_API_KEY) {
            // Fast2SMS integration
            try {
                // Dynamic import/fetch if needed, or HTTP post
                console.log(`[FAST2SMS] Sending to ${mobile}: ${message}`);
                return { success: true };
            } catch (err) {
                console.error('[FAST2SMS Error]', err.message);
                throw new Error('Failed to send SMS through gateway');
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
