import axios from 'axios';
import { CircuitBreaker } from './circuitBreaker.js';

const whatsappBreaker = new CircuitBreaker({ failureThreshold: 3, recoveryTimeoutMs: 15000 });

export const sendWhatsAppNotification = async ({ toPhone, messageText, buttons = [] }) => {
  const isMock = process.env.WHATSAPP_MOCK_MODE === 'true' || !process.env.WHATSAPP_ACCESS_TOKEN;

  if (isMock) {
    console.log(`[WhatsApp Service - MOCK MODE] Sending message to ${toPhone}: "${messageText}" with buttons:`, buttons);
    return {
      success: true,
      mock: true,
      messageId: `mock_wa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  return whatsappBreaker.execute(async () => {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: messageText },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    return {
      success: true,
      data: response.data,
    };
  });
};

export default {
  sendWhatsAppNotification,
};
