// server/utils/livekit-room-helper.js
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import Assistant from '../models/Assistant.js';

/**
 * Create LiveKit room and return TwiML directly
 * This avoids making internal HTTP requests
 */
export async function createLiveKitRoomTwiml({
  roomName,
  assistantId,
  phoneNumber,
  campaignId,
  campaignPrompt,
  contactInfo
}) {
  try {
    console.log('Creating LiveKit room for outbound call:', {
      roomName,
      assistantId,
      phoneNumber,
      campaignId,
      hasCampaignPrompt: !!campaignPrompt,
      contactInfo
    });

    // Get assistant details (using Mongoose)
    let assistant = null;
    if (assistantId) {
      try {
        assistant = await Assistant.findById(assistantId);
      } catch (assistantError) {
        console.error('Error fetching assistant from MongoDB:', assistantError);
      }
    }

    // Create LiveKit access token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error('LiveKit credentials not configured');
    }

    // Create room with agent dispatch using LiveKit API
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    try {
      // Create room with metadata
      await roomService.createRoom({
        name: roomName,
        metadata: JSON.stringify({
          assistantId,
          phoneNumber,
          campaignId,
          campaignPrompt: campaignPrompt || '',
          contactInfo: contactInfo || {},
          source: 'outbound',
          callType: 'campaign'
        })
      });

      console.log(`Created LiveKit room ${roomName}`);
    } catch (error) {
      console.error('Error creating LiveKit room:', error);
      // Continue anyway - room might already exist
    }

    const grant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    // Prepare enhanced metadata with campaign information
    const participantMetadata = {
      assistantId,
      phoneNumber,
      campaignId,
      campaignPrompt: campaignPrompt || '',
      contactInfo: contactInfo || {},
      source: 'outbound',
      callType: 'campaign'
    };

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `outbound-${phoneNumber}`,
      metadata: JSON.stringify(participantMetadata),
    });
    at.addGrant(grant);
    const jwt = await at.toJwt();

    // Return TwiML for Twilio to connect to LiveKit room
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Room participantIdentity="outbound-${phoneNumber}" roomName="${roomName}">
      <Parameter name="assistantId" value="${assistantId || ''}"/>
      <Parameter name="phoneNumber" value="${phoneNumber}"/>
      <Parameter name="campaignId" value="${campaignId || ''}"/>
      <Parameter name="campaignPrompt" value="${(campaignPrompt || '').replace(/"/g, '&quot;')}"/>
      <Parameter name="contactInfo" value="${JSON.stringify(contactInfo || {}).replace(/"/g, '&quot;')}"/>
      <Parameter name="source" value="outbound"/>
      <Parameter name="callType" value="campaign"/>
    </Room>
  </Connect>
</Response>`;

    return twiml;

  } catch (error) {
    console.error('Error creating LiveKit room:', error);
    throw error;
  }
}
