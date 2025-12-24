import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';
import { SMSAssistantService } from './services/sms-assistant-service.js';
import { SMSDatabaseService } from './services/sms-database-service.js';
import { SMSAIService } from './services/sms-ai-service.js';
import SMSMessage from './models/SMSMessage.js';
import PhoneNumber from './models/PhoneNumber.js';

const smsDatabaseService = new SMSDatabaseService();
const smsAIService = new SMSAIService();
const smsAssistantService = new SMSAssistantService(smsDatabaseService, smsAIService, null);

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'SMS router is working!' });
});

/**
 * Send SMS message using Twilio
 * POST /api/v1/twilio/sms/send
 */
router.post('/send', async (req, res) => {
  try {
    console.log('SMS send request received:', { body: req.body });

    const {
      accountSid,
      authToken,
      to,
      from,
      body,
      userId
    } = req.body;

    if (!accountSid || !authToken || !to || !body) {
      return res.status(400).json({
        success: false,
        message: 'accountSid, authToken, to, and body are required'
      });
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Get user's actual Twilio phone number from database
    let fromNumber = from;
    if (!from || from === '+1234567890' || from === '') {
      try {
        // Find an active phone number. 
        // Ideal: Filter by userId if available.
        const query = { status: 'active' };
        if (userId) {
          query.userId = userId;
        }

        const phoneNumber = await PhoneNumber.findOne(query);
        if (phoneNumber) {
          fromNumber = phoneNumber.number;
        } else {
          // Fallback
          const twilioNumbers = await client.incomingPhoneNumbers.list({ limit: 1 });
          if (twilioNumbers.length > 0) fromNumber = twilioNumbers[0].phoneNumber;
        }
      } catch (dbError) {
        console.error('Error fetching phone number from database:', dbError);
      }
    }

    // Send SMS message
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
      ...((process.env.NGROK_URL || (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('localhost'))) && {
        statusCallback: `${process.env.NGROK_URL || process.env.BACKEND_URL}/api/v1/twilio/sms/status-callback`,
        statusCallbackEvent: ['sent', 'delivered', 'failed', 'undelivered']
      })
    });

    // Store message in database
    await SMSMessage.create({
      messageSid: message.sid,
      userId,
      toNumber: to,
      fromNumber: fromNumber,
      body,
      direction: 'outbound',
      status: message.status,
      dateCreated: message.dateCreated || new Date(),
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated || new Date()
    });

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        messageSid: message.sid,
        status: message.status,
        body: message.body
      }
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS'
    });
  }
});

/**
 * Get SMS messages for a conversation
 * GET /api/v1/twilio/sms/conversation/:conversationId
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    // The conversationId here might be a phone number or a specific ID.
    // For now, let's assume it's the specific phone number of the USER (client).

    // NOTE: This endpoint needs proper authentication/authorization in a real scenario
    // to prevent fetching anyone's messages.

    const messages = await SMSMessage.find({
      $or: [
        { toNumber: conversationId },
        { fromNumber: conversationId }
      ]
    }).sort({ dateCreated: -1 }).limit(50);

    // If no specific conversation logic, fallback to generic latest (removed for security)
    // const messages = await SMSMessage.find({}).sort({ dateCreated: -1 }).limit(50);

    res.json({ success: true, data: messages });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

/**
 * Webhook endpoint for incoming SMS messages
 * POST /api/v1/twilio/sms/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const {
      MessageSid,
      From,
      To,
      Body,
      MessageStatus,
      DateCreated
    } = req.body;

    console.log('🔔 SMS WEBHOOK TRIGGERED:', { MessageSid, From, To });

    // Process the SMS using our new SMS assistant service
    try {
      await smsAssistantService.processIncomingSMS({
        fromNumber: From,
        toNumber: To,
        messageBody: Body,
        messageSid: MessageSid
      });

      res.status(200).send('SMS processed');

    } catch (error) {
      console.error('Error processing SMS:', error);
      res.status(500).send('Error processing SMS');
    }

  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process SMS webhook'
    });
  }
});

/**
 * Status callback endpoint for SMS delivery status
 * POST /api/v1/twilio/sms/status-callback
 */
router.post('/status-callback', async (req, res) => {
  try {
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
      DateSent,
      DateUpdated
    } = req.body;

    console.log('SMS status callback:', { MessageSid, MessageStatus });

    // Update message status in database
    await SMSMessage.findOneAndUpdate(
      { messageSid: MessageSid },
      {
        status: MessageStatus,
        errorCode: ErrorCode,
        errorMessage: ErrorMessage,
        dateSent: DateSent,
        dateUpdated: DateUpdated || new Date()
      }
    );

    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error) {
    console.error('Error processing SMS status callback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process status callback'
    });
  }
});

export { router as twilioSmsRouter };
