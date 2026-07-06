const crypto = require('crypto');
const { getCircuitBreaker } = require('./CircuitBreaker');

class WhatsAppProviderAdapter {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'helio_verify_token_default';
    this.appSecret = process.env.WHATSAPP_APP_SECRET || '';
    
    // Register circuit breaker for WhatsApp
    this.circuitBreaker = getCircuitBreaker('whatsapp-meta-api', {
      failureThreshold: 3,
      cooldownPeriodMs: 15000
    });
  }

  /**
   * Validates inbound Webhook Challenge requests from Meta Cloud API
   */
  verifyWebhook(query) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('[WhatsApp Adapter] Webhook validation verified.');
      return challenge;
    }
    throw new Error('Verification token mismatch or invalid hub mode.');
  }

  /**
   * Verifies x-hub-signature-256 header matches payload HMAC digest using app secret
   */
  isValidSignature(rawBody, signatureHeader) {
    if (!this.appSecret) return true; // Skip verification if secret not configured locally
    if (!signatureHeader) return false;

    const parts = signatureHeader.split('=');
    const signature = parts[1];

    const hmac = crypto.createHmac('sha256', this.appSecret);
    const digest = hmac.update(rawBody).digest('hex');

    return signature === digest;
  }

  /**
   * Classifies error string into normalized categories
   */
  classifyError(err) {
    const msg = (err.message || '').toUpperCase();
    
    if (msg.includes('AUTH') || msg.includes('SIGNATURE') || msg.includes('TOKEN') || msg.includes('CREDENTIAL')) {
      return { category: 'AUTHENTICATION_ERROR', retryable: false, isFallbackEligible: true };
    }
    if (msg.includes('LIMIT') || msg.includes('RATE') || msg.includes('TOO MANY REQUESTS')) {
      return { category: 'RATE_LIMITED', retryable: true, isFallbackEligible: true };
    }
    if (msg.includes('RECIPIENT') || msg.includes('PHONE') || msg.includes('NUMBER') || msg.includes('VALID')) {
      return { category: 'INVALID_RECIPIENT', retryable: false, isFallbackEligible: true };
    }
    if (msg.includes('TEMPLATE') || msg.includes('APPROVED')) {
      return { category: 'INVALID_TEMPLATE', retryable: false, isFallbackEligible: false };
    }
    if (msg.includes('TIMEOUT') || msg.includes('NETWORK') || msg.includes('ABORT') || msg.includes('FETCH')) {
      return { category: 'NETWORK_TIMEOUT', retryable: true, isFallbackEligible: true };
    }
    if (msg.includes('CIRCUIT') || msg.includes('BLOCKED')) {
      return { category: 'PROVIDER_UNAVAILABLE', retryable: true, isFallbackEligible: true };
    }
    return { category: 'TRANSIENT_PROVIDER_ERROR', retryable: true, isFallbackEligible: true };
  }

  /**
   * Dispatch a template message through WhatsApp Cloud API
   */
  async sendTemplateMessage(toPhone, templateName, components = []) {
    const cleanPhone = toPhone.replace(/[\s\-\+\(\)]/g, ''); // strip characters
    
    console.log(`[WhatsApp Adapter] Send template "${templateName}" requested to: ${cleanPhone}`);

    if (!this.accessToken || !this.phoneNumberId) {
      // Mock Sandbox Simulation Mode
      const messageId = `wamid.HBgL${Math.random().toString(36).substring(2).toUpperCase()}`;
      console.log(`[WhatsApp Adapter] [Sandbox Mode] Simulated message sent to ${cleanPhone}. Message ID: ${messageId}`);
      return {
        success: true,
        messageId,
        status: 'delivered'
      };
    }

    try {
      // Wrap Graph API call in our custom Circuit Breaker
      return await this.circuitBreaker.execute(async () => {
        const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000) // 5s timeout guard
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'Meta API request failed.');
        }

        return {
          success: true,
          messageId: data.messages?.[0]?.id,
          status: 'accepted'
        };
      });
    } catch (err) {
      console.error(`[WhatsApp Adapter] Meta API call failed:`, err.message);
      const classified = this.classifyError(err);
      
      // Attach metadata to the thrown error to allow worker decision making
      err.category = classified.category;
      err.retryable = classified.retryable;
      err.isFallbackEligible = classified.isFallbackEligible;
      throw err;
    }
  }
}

module.exports = new WhatsAppProviderAdapter();
