const https = require('https');
const http = require('http');

class SmsService {
    /**
     * Sanitize phone number for Fast2SMS (10-digit Indian phone number)
     * @param {string} mobile
     * @returns {string} 10-digit number
     */
    _sanitizeMobile(mobile) {
        if (!mobile) return '';
        // Strip non-digits and leading +91 / 91 if present
        let cleaned = mobile.toString().replace(/\D/g, '');
        if (cleaned.startsWith('91') && cleaned.length > 10) {
            cleaned = cleaned.substring(2);
        }
        return cleaned;
    }

    /**
     * Send HTTP POST request to Fast2SMS endpoint
     * @param {object} payload
     * @param {string} apiKey
     * @returns {Promise<object>}
     */
    _postToFast2Sms(payload, apiKey) {
        return new Promise((resolve, reject) => {
            const rawUrl = process.env.FAST2SMS_API_URL || process.env.FAST_TO_SMS_API_URL || 'https://www.fast2sms.com/dev/bulkV2';
            let parsedUrl;
            try {
                parsedUrl = new URL(rawUrl);
            } catch (_) {
                parsedUrl = new URL('https://www.fast2sms.com/dev/bulkV2');
            }

            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;
            const data = JSON.stringify(payload);

            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'POST',
                headers: {
                    authorization: apiKey,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
                timeout: 10000,
            };

            const req = client.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        resolve({
                            statusCode: res.statusCode,
                            body: parsed,
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            body: { raw: responseBody },
                        });
                    }
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Fast2SMS request timed out'));
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.write(data);
            req.end();
        });
    }

    /**
     * Send OTP specifically via Fast2SMS dedicated OTP route
     * @param {string} mobile - Recipient mobile number
     * @param {string} otp - 6-digit OTP code
     */
    async sendOtp(mobile, otp) {
        const provider = (process.env.SMS_PROVIDER || 'MOCK').toUpperCase();
        const apiKey = process.env.FAST2SMS_API_KEY || process.env.FAST_TO_SMS_API_KEY || process.env.SMS_API_KEY || '';
        const cleanMobile = this._sanitizeMobile(mobile);

        // If provider is set to FAST2SMS and API key is present
        if (provider === 'FAST2SMS' && apiKey) {
            try {
                const payload = {
                    route: 'otp',
                    variables_values: otp,
                    numbers: cleanMobile,
                };

                const response = await this._postToFast2Sms(payload, apiKey);

                if (response.body && response.body.return === true) {
                    console.log(`✅ [Fast2SMS] OTP sent successfully to ${cleanMobile}`);
                    return { success: true, data: response.body };
                } else {
                    const errorMsg = response.body?.message || `Status code ${response.statusCode}`;
                    console.warn(`⚠️ [Fast2SMS Notice] Gateway response for ${cleanMobile}: ${errorMsg}`);

                    // In non-production or fallback mode, log dev OTP
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`🔑 [DEV OTP FALLBACK] ${mobile}: ${otp}`);
                    }
                    return { success: false, message: errorMsg };
                }
            } catch (err) {
                console.error(`❌ [Fast2SMS Error] Failed to send to ${cleanMobile}:`, err.message);
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`🔑 [DEV OTP FALLBACK] ${mobile}: ${otp}`);
                }
                return { success: false, message: err.message };
            }
        }

        // Mock / Service Off mode (Logs to terminal without external API call)
        console.log(`\n========================================`);
        console.log(`[SMS GATEWAY - ${provider} (Service Off / Test Mode)]`);
        console.log(`To: ${mobile} (10-digit: ${cleanMobile})`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Note: Set SMS_PROVIDER=FAST2SMS in .env to turn live SMS ON`);
        console.log(`========================================\n`);

        return { success: true };
    }

    /**
     * General SMS dispatcher (Supports custom messages and OTP route)
     * @param {string} mobile - Recipient mobile number
     * @param {string} message - Full message body
     * @param {object} [options] - Optional params ({ otp })
     */
    async sendSms(mobile, message, options = {}) {
        if (options.otp) {
            return this.sendOtp(mobile, options.otp);
        }

        const provider = (process.env.SMS_PROVIDER || 'MOCK').toUpperCase();
        const apiKey = process.env.FAST2SMS_API_KEY || process.env.FAST_TO_SMS_API_KEY || process.env.SMS_API_KEY || '';
        const cleanMobile = this._sanitizeMobile(mobile);

        if (provider === 'FAST2SMS' && apiKey) {
            try {
                // Quick SMS route (route 'q')
                const payload = {
                    route: 'q',
                    message,
                    language: 'english',
                    numbers: cleanMobile,
                };

                const response = await this._postToFast2Sms(payload, apiKey);

                if (response.body && response.body.return === true) {
                    console.log(`✅ [Fast2SMS] Message sent successfully to ${cleanMobile}`);
                    return { success: true, data: response.body };
                } else {
                    const errorMsg = response.body?.message || `Status code ${response.statusCode}`;
                    console.warn(`⚠️ [Fast2SMS Notice] Gateway response for ${cleanMobile}: ${errorMsg}`);
                    return { success: false, message: errorMsg };
                }
            } catch (err) {
                console.error(`❌ [Fast2SMS Error] Failed to send SMS to ${cleanMobile}:`, err.message);
                return { success: false, message: err.message };
            }
        }

        // Mock / Service Off mode
        console.log(`\n========================================`);
        console.log(`[SMS GATEWAY - ${provider} (Service Off / Test Mode)]`);
        console.log(`To: ${mobile}`);
        console.log(`Message: ${message}`);
        console.log(`========================================\n`);

        return { success: true };
    }
}

module.exports = new SmsService();
