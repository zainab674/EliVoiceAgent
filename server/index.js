import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AccessToken, RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';
import { twilioAdminRouter } from './twilio-admin.js';
import { twilioUserRouter } from './twilio-user.js';
import { twilioSmsRouter } from './twilio-sms.js';
import { livekitSipRouter } from './livekit-sip.js';
import { livekitPerAssistantTrunkRouter } from './livekit-per-assistant-trunk.js';
import { recordingWebhookRouter } from './recording-webhook.js';
import { getCallRecordingInfo } from './twilio-trunk-service.js';
import smsWebhookRouter from './sms-webhook.js';
import { csvManagementRouter } from './csv-management.js';
import { livekitRoomRouter } from './livekit-room.js';
import { connect } from '@ngrok/ngrok';
import minutesRouter from './routes/minutes.js';
import minutesPricingRouter from './routes/minutes-pricing.js';
import adminRouter from './routes/admin.js';

import userRouter from './routes/user.js';
import authRouter from './routes/auth.js';
import assistantRouter from './routes/assistant.js';
import bookingRouter from './routes/booking.js';
import calendarRouter from './routes/calendar.js';
import plansRouter from './routes/plans.js';
import billingRouter from './routes/billing.js';
import contactRouter from './routes/contact.js';
import callRouter from './routes/call.js';
import callEmailRouter from './routes/call-email.js';
import conversationRouter from './routes/conversation.js';
import phoneNumberRouter from './routes/phoneNumber.js';
import emailRouter from './routes/emails.js';
import smsRouter from './routes/sms.js';
import integrationRoutes from './routes/integration.js';

import connectDB from './lib/mongodb.js';

// Connect to MongoDB
connectDB();





const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



app.use('/api/v1/twilio', twilioAdminRouter);
app.use('/api/v1/twilio/user', twilioUserRouter);
app.use('/api/v1/twilio/sms', twilioSmsRouter);
app.use('/api/v1/livekit', livekitSipRouter);
app.use('/api/v1/livekit', livekitPerAssistantTrunkRouter);
app.use('/api/v1/recording', recordingWebhookRouter);
app.use('/api/v1/sms', smsWebhookRouter);
app.use('/api/v1/csv', csvManagementRouter);
app.use('/api/v1/livekit', livekitRoomRouter);
app.use('/api/v1/minutes', minutesRouter);
app.use('/api/v1', minutesPricingRouter); // Minutes pricing routes (includes /admin/minutes-pricing and /minutes-pricing)
app.use('/api/v1/admin', adminRouter);

app.use('/api/v1/user', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/assistants', assistantRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/plans', plansRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/contacts', contactRouter);
app.use('/api/v1/calls', callRouter);
app.use('/api/v1/calls', callEmailRouter);
app.use('/api/v1/conversations', conversationRouter);
app.use('/api/v1/phone-numbers', phoneNumberRouter);
app.use('/api/v1/emails', emailRouter);
app.use('/api/v1/sms', smsRouter);
console.log('Minutes routes registered at /api/v1/minutes');
console.log('Minutes pricing routes registered at /api/v1/minutes-pricing and /api/v1/admin/minutes-pricing');
console.log('Admin routes registered at /api/v1/admin');

console.log('User routes registered at /api/v1/user');

import campaignsRouter from './routes/campaigns.js';
import emailCampaignsRouter from './routes/emailCampaigns.js';
import uploadRouter from './routes/upload.js';
import aiGenerateRouter from './routes/ai-generate.js';
import { campaignExecutionEngine } from './lib/campaign-execution-engine.js';
app.use('/api/v1/campaigns', campaignsRouter);
app.use('/api/v1/email-campaigns', emailCampaignsRouter);
import smsCampaignRouter from './routes/smsCampaignRoute.js';
app.use('/api/v1/sms-campaigns', smsCampaignRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/ai', aiGenerateRouter);

// Serve uploads directory
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Start Campaign Engine
campaignExecutionEngine.start();

// Start Email Worker
import { emailWorker } from './workers/email-worker.js';
emailWorker.start();

// Start MongoDB Sync Worker
import mongoDBSyncWorker from './workers/mongodb-sync-worker.js';
mongoDBSyncWorker.start();


// Recording routes (matching voiceagents pattern exactly)

// Get recording information for a call
app.get('/api/v1/call/:callSid/recordings', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { accountSid, authToken } = req.query;

    if (!accountSid || !authToken) {
      return res.status(400).json({
        success: false,
        message: 'accountSid and authToken are required'
      });
    }

    const result = await getCallRecordingInfo({ accountSid, authToken, callSid });
    res.json(result);
  } catch (error) {
    console.error('Error getting call recording info:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Proxy endpoint to serve recording audio files with authentication
app.get('/api/v1/call/recording/:recordingSid/audio', async (req, res) => {
  try {
    const { recordingSid } = req.params;
    const { accountSid, authToken } = req.query;

    // Decode URL-encoded parameters
    const decodedAccountSid = decodeURIComponent(accountSid);
    const decodedAuthToken = decodeURIComponent(authToken);

    if (!decodedAccountSid || !decodedAuthToken) {
      return res.status(400).json({
        success: false,
        message: 'accountSid and authToken are required'
      });
    }

    // Construct the Twilio recording URL
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${decodedAccountSid}/Recordings/${recordingSid}.wav`;

    // Debug: Log credential info
    console.log('Audio request debug:', {
      recordingSid,
      accountSid: decodedAccountSid,
      accountSidLength: decodedAccountSid?.length,
      authTokenLength: decodedAuthToken?.length,
      authTokenPreview: decodedAuthToken?.substring(0, 10) + '...',
      recordingUrl
    });

    // Make authenticated request to Twilio
    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${decodedAccountSid}:${decodedAuthToken}`).toString('base64')}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch recording from Twilio:', response.status, response.statusText);

      // Get the error response body for better debugging
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error('Twilio error response:', errorBody);
      } catch (e) {
        console.error('Could not read error response body');
      }

      return res.status(response.status).json({
        success: false,
        message: `Failed to fetch recording: ${response.statusText}`,
        error: errorBody
      });
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Send the audio data
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('Error proxying recording audio:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});





const PORT = process.env.PORT || 4000;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

/**
 * Dispatch an agent to a LiveKit room
 * POST /api/v1/livekit/dispatch
 */
app.post('/api/v1/livekit/dispatch', async (req, res) => {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST;

    const { roomName, agentName = 'ai', metadata = {} } = req.body;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        message: 'roomName is required'
      });
    }

    console.log(`Dispatching agent '${agentName}' to room '${roomName}'`);

    // Create or update room with agent dispatch metadata
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    try {
      // Update room metadata to include agent dispatch information
      await roomService.updateRoomMetadata(roomName, JSON.stringify({
        agentName,
        ...metadata,
        source: 'web',
        dispatched: true,
      }));

      console.log(`Agent '${agentName}' dispatched to room '${roomName}'`);

      res.json({
        success: true,
        message: `Agent ${agentName} dispatched to room ${roomName}`,
        roomName,
        agentName,
      });
    } catch (error) {
      // If room doesn't exist, create it
      await roomService.createRoom({
        name: roomName,
        metadata: JSON.stringify({
          agentName,
          ...metadata,
          source: 'web',
          dispatched: true,
        }),
      });

      console.log(`Created new room '${roomName}' and dispatched agent '${agentName}'`);

      res.json({
        success: true,
        message: `Room created and agent ${agentName} dispatched`,
        roomName,
        agentName,
      });
    }

  } catch (err) {
    console.error('Error dispatching agent:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch agent',
      error: err.message
    });
  }
});

app.post('/api/v1/livekit/create-token', async (req, res) => {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST;

    const { roomName, identity: requestedIdentity, metadata = {}, dispatch, roomConfig } = req.body;

    // Use provided room name or generate one
    const room = roomName || `room-${Math.random().toString(36).slice(2, 8)}`;
    const identity = requestedIdentity || `web-${Math.random().toString(36).slice(2, 8)}`;

    console.log('Creating LiveKit token:', { room, identity, hasDispatch: !!dispatch });

    // If dispatch is requested, create room with agent configuration
    if (dispatch || roomConfig) {
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

      try {
        // Prepare room metadata with assistant configuration
        const assistantId = metadata.assistantId || dispatch?.metadata?.assistantId;
        const roomMetadata = {
          ...metadata,
          assistantId,
          source: 'web',
          callType: 'web',
          agentName: dispatch?.agentName || 'ai',
        };

        // Create room with agent dispatch metadata
        await roomService.createRoom({
          name: room,
          metadata: JSON.stringify(roomMetadata),
        });

        console.log(`✅ Room '${room}' created with agent dispatch metadata`);

        // Wait a moment for room to be fully created before dispatching
        await new Promise(resolve => setTimeout(resolve, 500));

        // Dispatch agent using AgentDispatchClient (same as voiceagents)
        try {
          // Convert WebSocket URL to HTTP/HTTPS for API calls
          let httpUrl = livekitUrl;
          if (livekitUrl.startsWith('wss://')) {
            httpUrl = livekitUrl.replace('wss://', 'https://');
          } else if (livekitUrl.startsWith('ws://')) {
            httpUrl = livekitUrl.replace('ws://', 'http://');
          }

          console.log(`🤖 Dispatching agent to room '${room}' via ${httpUrl}`);

          // Create AgentDispatchClient (same pattern as voiceagents)
          const agentDispatchClient = new AgentDispatchClient(
            httpUrl,
            apiKey,
            apiSecret
          );

          const agentName = dispatch?.agentName || 'ai';
          const agentMetadata = {
            agentId: assistantId,
            callType: 'web',
            roomName: room,
            source: 'web',
            ...(dispatch?.metadata || {}),
          };

          console.log(`📤 Dispatching agent with params:`, {
            room,
            agentName,
            metadata: agentMetadata
          });

          const dispatchResult = await agentDispatchClient.createDispatch(
            room,
            agentName,
            {
              metadata: JSON.stringify(agentMetadata),
            }
          );

          console.log('✅ Agent dispatched successfully:', JSON.stringify(dispatchResult, null, 2));

        } catch (dispatchError) {
          console.error('❌ Failed to dispatch agent:', dispatchError.message);
          console.error('❌ Dispatch error details:', dispatchError);
          console.error('❌ Full error:', JSON.stringify(dispatchError, Object.getOwnPropertyNames(dispatchError), 2));
          // Continue anyway - user can still connect
        }

      } catch (roomError) {
        // Room might already exist, continue
        console.warn(`Room creation note: ${roomError.message}`);
      }
    }

    // Create access token
    const grant = {
      room,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      metadata: JSON.stringify(metadata),
    });
    at.addGrant(grant);
    const jwt = await at.toJwt();

    res.json({
      success: true,
      message: 'Token created successfully',
      result: { identity, accessToken: jwt },
    });
  } catch (err) {
    console.error('Error creating LiveKit token:', err);
    res.status(500).json({ success: false, message: 'Failed to create token', error: err.message });
  }
});

// Minimal Cal.com setup endpoint: creates an event type and returns its id/slug
app.post('/api/v1/calendar/setup', async (req, res) => {
  try {
    const {
      cal_api_key,
      cal_event_type_slug,
      cal_timezone = 'UTC',
      cal_event_title = 'Assistant Meeting',
      cal_event_length = 30,
    } = req.body || {};

    if (!cal_api_key || !cal_event_type_slug) {
      return res.status(400).json({ success: false, message: 'cal_api_key and cal_event_type_slug are required' });
    }

    const slug = String(cal_event_type_slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'voice-agent-meeting';

    const resp = await fetch('https://api.cal.com/v2/event-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cal_api_key}`,
      },
      body: JSON.stringify({
        title: cal_event_title || 'Assistant Meeting',
        slug,
        length: Number(cal_event_length) || 30,
        timeZone: cal_timezone || 'UTC',
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      // Bubble up Cal.com error for easier debugging
      return res.status(resp.status).json({ success: false, message: 'Cal.com error', error: data });
    }

    const id = data?.data?.id || data?.id || data?.eventType?.id;
    const retSlug = data?.data?.slug || data?.slug || slug;

    return res.json({ success: true, eventTypeId: String(id), eventTypeSlug: String(retSlug) });
  } catch (err) {
    console.error('Calendar setup failed', err);
    return res.status(500).json({ success: false, message: 'Calendar setup failed' });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);



  // Start ngrok tunnel for Twilio webhooks
  if (process.env.NGROK_AUTHTOKEN) {
    try {
      const listener = await connect({
        addr: PORT,
        authtoken_from_env: true
      });

      console.log(`🌐 ngrok tunnel established at: ${listener.url()}`);
      console.log(`📱 Use this URL for Twilio webhooks: ${listener.url()}/api/v1/twilio/sms/webhook`);
      console.log(`📞 Use this URL for Twilio status callbacks: ${listener.url()}/api/v1/twilio/sms/status-callback`);

      // Store the ngrok URL for use in SMS sending
      process.env.NGROK_URL = listener.url();

      // SMS webhooks are configured automatically when phone numbers are assigned to assistants

    } catch (error) {
      console.error('❌ Failed to start ngrok tunnel:', error.message);
      console.log('💡 Make sure NGROK_AUTHTOKEN is set in your .env file');
    }
  } else {
    console.log('⚠️  NGROK_AUTHTOKEN not set - webhooks will not work with localhost');
    console.log('💡 Add NGROK_AUTHTOKEN to your .env file to enable ngrok tunnel');

    // SMS webhooks are configured automatically when phone numbers are assigned to assistants
  }
});


