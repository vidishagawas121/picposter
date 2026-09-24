class SmsService {
    /**
     * Send OTP SMS using Fast2SMS template or Mock gateway
     * @param {string} mobile - Recipient mobile number (e.g. +919876543210 or 9876543210)
     * @param {string} otp - 6-digit OTP code
     * @param {string} message - Optional fallback text message
     */
    async sendOtpSms(mobile, otp, message = '') {
        const provider = (process.env.SMS_PROVIDER || 'MOCK').toUpperCase();
        const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
        const otpId = process.env.FAST2SMS_OTP_ID || '45f33d9f8a';

        // Extract last 10 digits for Indian numbers
        const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

        if (cleanMobile.length !== 10) {
            console.error(`[SMS Service] Invalid 10-digit phone number format: ${mobile}`);
            throw new Error('Invalid mobile number format for SMS delivery.');
        }

        if (provider === 'FAST2SMS' && apiKey) {
            try {
                const payload = {
                    mobile: cleanMobile,
                    otp_id: otpId,
                    otp_expiry: 10,
                    otp_length: 6,
                    otp: String(otp),
                    variables_values: 'Fourise',
                };

                const response = await fetch('https://www.fast2sms.com/dev/otp/send', {
                    method: 'POST',
                    headers: {
                        authorization: apiKey.trim(),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (!response.ok || data.return === false) {
                    console.error('[Fast2SMS API Error]', data);
                    throw new Error(data.message?.[0] || data.message || 'Fast2SMS failed to deliver OTP');
                }

                console.log(`[Fast2SMS] OTP sent successfully to ${cleanMobile} (Request ID: ${data.request_id})`);
                return { success: true, requestId: data.request_id, data };
            } catch (err) {
                console.error('[Fast2SMS Error]', err.message);
                throw new Error(`Failed to send SMS through gateway: ${err.message}`);
            }
        }

        // Mock / Development mode fallback
        console.log(`\n========================================`);
        console.log(`[SMS GATEWAY - ${provider}]`);
        console.log(`To: ${cleanMobile} (Raw: ${mobile})`);
        console.log(`OTP: ${otp}`);
        if (message) console.log(`Message: ${message}`);
        console.log(`========================================\n`);

        return { success: true, mock: true };
    }

    /**
     * Backward-compatible sendSms method
     */
    async sendSms(mobile, message, otp = null) {
        if (otp) {
            return this.sendOtpSms(mobile, otp, message);
        }
        // Extract OTP from message if not provided explicitly
        const match = message && message.match(/\b\d{6}\b/);
        const extractedOtp = match ? match[0] : null;

        if (extractedOtp) {
            return this.sendOtpSms(mobile, extractedOtp, message);
        }

        return this.sendOtpSms(mobile, '000000', message);
    }
}

module.exports = new SmsService();

