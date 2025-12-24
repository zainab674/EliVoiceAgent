// server/livekit-room.js
import express from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import Assistant from './models/Assistant.js';

export const livekitRoomRouter = express.Router();



/**
 * Get room status
 * GET /api/v1/livekit/room/:roomName/status
 */
livekitRoomRouter.get('/room/:roomName/status', async (req, res) => {
  try {
    const { roomName } = req.params;

    // This would typically check with LiveKit API for room status
    // For now, just return a basic response
    res.json({
      success: true,
      roomName,
      status: 'active'
    });

  } catch (error) {
    console.error('Error getting room status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room status'
    });
  }
});
