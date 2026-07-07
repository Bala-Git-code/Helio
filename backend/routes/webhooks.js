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

/**
 * GitHub Ingestion Webhook Handler
 */
router.post('/github', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.body;

  const GitHubProviderAdapter = require('../services/repository/GitHubProviderAdapter');
  const githubAdapter = new GitHubProviderAdapter();

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test_secret';

  // Signature validation check
  req.rawBody = rawBody.toString('utf8'); // populate rawBody for adapter
  const isValid = await githubAdapter.verifyWebhook(req, secret);
  if (!isValid) {
    console.warn('[Webhooks] Warning: invalid GitHub signature received. Dropping event.');
    return res.status(401).send('Invalid signature');
  }

  // Parse JSON
  let body;
  try {
    body = JSON.parse(req.rawBody);
  } catch (err) {
    return res.status(400).send('Invalid JSON');
  }

  // Parse details
  let eventDetails;
  try {
    eventDetails = await githubAdapter.parseWebhookEvent(req.headers, body);
  } catch (err) {
    return res.status(400).send(err.message);
  }

  // Deduplicate using WebhookReceipt
  const RepositoryWebhookReceipt = require('../models/RepositoryWebhookReceipt');
  let receipt;
  try {
    receipt = await RepositoryWebhookReceipt.create({
      providerId: 'github',
      deliveryId: eventDetails.deliveryId,
      eventType: eventDetails.eventType,
      signatureValidated: true,
      payloadHash: eventDetails.payloadHash,
      status: 'PENDING',
      traceId: req.headers['x-request-id'] || `trace_${Date.now()}`
    });
  } catch (err) {
    if (err.code === 11000) {
      console.log(`[Webhooks] Webhook delivery duplicate: ${eventDetails.deliveryId}. Skipping.`);
      return res.status(200).send('EVENT_DUPLICATE_SKIPPED');
    }
    return res.status(500).send('Error saving receipt');
  }

  res.status(200).send('EVENT_RECEIVED');

  // Asynchronous processing of the hook
  try {
    const Repository = require('../models/Repository');
    const RepositorySync = require('../models/RepositorySync');

    // Find all repositories matching the source repository ID
    const repositories = await Repository.find({
      providerId: 'github',
      sourceRepositoryId: eventDetails.sourceRepositoryId
    });

    if (repositories.length === 0) {
      receipt.status = 'FAILED';
      receipt.errorCode = 'REPOSITORY_NOT_FOUND';
      await receipt.save();
      return;
    }

    for (const repo of repositories) {
      const correlationId = receipt.traceId;
      
      const sync = await RepositorySync.create({
        tenantId: repo.tenantId,
        repositoryId: repo._id,
        triggerType: 'WEBHOOK',
        requestedRevision: eventDetails.resolvedRevision || eventDetails.ref,
        status: 'QUEUED',
        requestedBy: 'SYSTEM_WEBHOOK',
        correlationId,
        traceId: correlationId
      });

      await QueueService.enqueue(
        'repository-ingestion',
        'sync-repository-job',
        { syncId: sync._id },
        {
          tenantId: repo.tenantId,
          correlationId,
          idempotencyKey: `sync_webhook_${repo._id}_${eventDetails.deliveryId}`,
          maxAttempts: 3
        }
      );
    }

    receipt.status = 'PROCESSED';
    receipt.processedAt = new Date();
    await receipt.save();
  } catch (err) {
    console.error('[Webhooks] Failed processing GitHub webhook:', err.message);
    receipt.status = 'FAILED';
    receipt.errorCode = err.message;
    await receipt.save();
  }
});

module.exports = router;
