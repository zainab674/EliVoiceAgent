
// server/recording-webhook.js
import express from 'express';

export const recordingWebhookRouter = express.Router();

/**
 * Twilio Recording Status Callback
 * POST /api/v1/recording/status
 * 
 * This endpoint receives recording status updates from Twilio
 */
recordingWebhookRouter.post('/status', async (req, res) => {
  try {
    const {
      AccountSid,
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingStatus,
      RecordingDuration,
      RecordingChannels,
      RecordingStartTime,
      RecordingSource,
      RecordingTrack
    } = req.body;

    console.log('RECORDING_STATUS_CALLBACK', {
      AccountSid,
      CallSid,
      RecordingSid,
      RecordingStatus,
      RecordingDuration,
      RecordingUrl: RecordingUrl ? 'present' : 'missing'
    });

    // Validate required fields
    if (!CallSid || !RecordingSid || !RecordingStatus) {
      console.error('Missing required fields in recording callback', req.body);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: CallSid, RecordingSid, RecordingStatus'
      });
    }

    // Prepare recording data for database update
    const updateData = {
      recordingSid: RecordingSid,
      recordingUrl: RecordingUrl,
      recordingStatus: RecordingStatus,
      recordingChannels: RecordingChannels ? parseInt(RecordingChannels) : null,
      updatedAt: new Date()
    };

    if (RecordingDuration) {
      updateData.callDuration = parseInt(RecordingDuration);
    }



    console.log('RECORDING_STATUS_UPDATED', {
      CallSid,
      RecordingSid,
      RecordingStatus
    });

    res.json({
      success: true,
      message: 'Recording status updated successfully',
      callSid: CallSid,
      recordingSid: RecordingSid,
    });

  } catch (error) {
    console.error('Recording status callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get recording information for a call
 * GET /api/v1/recording/:callSid
 */
recordingWebhookRouter.get('/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;



    res.json({
      success: true,
      recording: {
        recording_sid: call.recordingSid,
        recording_url: call.recordingUrl,
        recording_status: call.recordingStatus,
        recording_duration: call.callDuration
      }
    });

  } catch (error) {
    console.error('Get recording info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/v1/recording/health
 */
recordingWebhookRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Recording webhook service is running',
    timestamp: new Date().toISOString()
  });
});
