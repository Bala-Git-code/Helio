import express from 'express';
import { AdherenceLog } from '../models/AdherenceLog.js';
import { Medication } from '../models/Medication.js';
import { User } from '../models/User.js';

const router = express.Router();

// GET /api/v1/webhooks/whatsapp - Webhook Verification Challenge from Meta
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'helio_verify_token_123';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[WhatsApp Webhook] Verification successful.');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  res.sendStatus(400);
});

// POST /api/v1/webhooks/whatsapp - Inbound button response handling (Confirm / Skip dose)
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const fromPhone = message.from;
        let action = null;
        let medicationId = null;

        // Check if interactive button click
        if (message.type === 'interactive' && message.interactive?.button_reply) {
          const buttonId = message.interactive.button_reply.id; // e.g. "CONFIRM_DOSE_<medId>" or "SKIP_DOSE_<medId>"
          if (buttonId.startsWith('CONFIRM_DOSE_')) {
            action = 'TAKEN';
            medicationId = buttonId.replace('CONFIRM_DOSE_', '');
          } else if (buttonId.startsWith('SKIP_DOSE_')) {
            action = 'SKIPPED';
            medicationId = buttonId.replace('SKIP_DOSE_', '');
          }
        } else if (message.type === 'text') {
          const text = message.text.body.trim().toLowerCase();
          if (text.includes('took') || text.includes('confirm') || text.includes('yes')) {
            action = 'TAKEN';
          } else if (text.includes('skip') || text.includes('missed') || text.includes('no')) {
            action = 'SKIPPED';
          }
        }

        if (action) {
          // Find matching user by phone number
          const user = await User.findOne({ phone: fromPhone });
          if (user) {
            let med = null;
            if (medicationId) {
              med = await Medication.findById(medicationId);
            } else {
              med = await Medication.findOne({ patientId: user._id, status: 'ACTIVE' });
            }

            if (med) {
              await AdherenceLog.create({
                patientId: user._id,
                medicationId: med._id,
                scheduledTime: new Date(),
                takenAt: action === 'TAKEN' ? new Date() : null,
                status: action,
                notes: `Logged via WhatsApp Webhook (${action})`,
              });

              if (action === 'TAKEN' && med.remainingQuantity > 0) {
                med.remainingQuantity -= 1;
                await med.save();
              }
              console.log(`[WhatsApp Webhook] Processed ${action} for patient ${user.name} / med ${med.name}`);
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    res.sendStatus(404);
  } catch (err) {
    console.error('[WhatsApp Webhook] Handler error:', err.message);
    res.status(500).send('Webhook Handler Error');
  }
});

export default router;
