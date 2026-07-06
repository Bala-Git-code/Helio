const express = require('express');
const router = express.Router();
const whatsappAdapter = require('../services/medication/WhatsAppProviderAdapter');
const QueueService = require('../services/medication/QueueService');

// Express middleware to capture raw body for webhook verification
router.use(express.raw({ type: 'application/json' }));

/**
 * Webhook Verification (Challenge handshakes)
 */
router.get('/whatsapp', (req, res) => {
  try {
    const challenge = whatsappAdapter.verifyWebhook(req.query);
    res.status(200).send(challenge);
  } catch (err) {
    console.error('[Webhooks] Challenge failed:', err.message);
    res.status(403).send('Forbidden');
  }
});

/**
 * Webhook Inbound Message Processing (Enqueues raw body to persistent queue)
 */
router.post('/whatsapp', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.body;

  // Signature validation check
  if (process.env.WHATSAPP_APP_SECRET && !whatsappAdapter.isValidSignature(rawBody, signature)) {
    console.warn('[Webhooks] Warning: invalid hub signature received. Dropping event.');
    return res.status(401).send('Invalid signature');
  }

  // Parse JSON
  let body;
  try {
    body = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).send('Invalid JSON');
  }

  // Respond quickly to avoid Meta Cloud timeouts and retries
  res.status(200).send('EVENT_RECEIVED');

  // Process asynchronously by enqueuing into the database queue
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message) return; // skip events without messages (e.g. status updates without body)

    const correlationId = `webhook_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = message.id || correlationId;

    await QueueService.enqueue(
      'webhook-processing',
      'process-whatsapp-webhook',
      body,
      {
        correlationId,
        idempotencyKey
      }
    );
  } catch (err) {
    console.error('[Webhooks] Failed to enqueue webhook event:', err.message);
  }
});

module.exports = router;
