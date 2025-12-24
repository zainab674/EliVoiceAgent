import PhoneNumber from '../models/PhoneNumber.js';
import Assistant from '../models/Assistant.js';
import SMSMessage from '../models/SMSMessage.js';
import TwilioCredential from '../models/TwilioCredential.js';

class SMSDatabaseService {
  constructor() {
  }

  /**
   * Get assistant configuration by phone number
   */
  async getAssistantByPhoneNumber(phoneNumber) {
    try {
      console.log(`Querying database for phone number: ${phoneNumber}`);
      const phoneData = await PhoneNumber.findOne({
        number: phoneNumber,
        status: 'active'
      }).populate('inboundAssistantId');

      if (!phoneData || !phoneData.inboundAssistantId) {
        console.log('No active phone number or assistant found');
        return null;
      }

      console.log('Database query result:', phoneData);

      // Mongoose populate puts it in 'inboundAssistantId'.
      const assistant = phoneData.inboundAssistantId;

      return {
        id: assistant._id,
        name: assistant.name,
        // Map fields to match what the caller expects
        first_sms: assistant.firstSms || "Hello! How can I help you regarding your legal inquiry?",
        sms_prompt: assistant.systemPrompt,
        llm_provider_setting: assistant.llmProvider || 'openai',
        llm_model_setting: assistant.llmModel || 'gpt-4o',
        character_limit: assistant.characterLimit || 160,
        response_style: assistant.responseStyle || 'professional',
        // Add other fields if needed by downstream logic
        userId: assistant.userId
      };

    } catch (error) {
      console.error('Exception in getAssistantByPhoneNumber:', error);
      return null;
    }
  }

  /**
   * Check if this is a new conversation or ongoing
   * Returns true if assistant hasn't sent any messages in the last 3 hours
   */
  async isNewConversation(userPhoneNumber, assistantId) {
    try {
      const ASSISTANT_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

      console.log(`Checking if assistant has sent messages recently for user phone: ${userPhoneNumber}, assistant: ${assistantId}`);

      // Get the assistant's phone number
      const phoneData = await PhoneNumber.findOne({
        inboundAssistantId: assistantId,
        status: 'active'
      });

      if (!phoneData) {
        console.log('Could not find assistant phone number - treating as new conversation');
        return true;
      }

      const assistantPhoneNumber = phoneData.number;
      console.log(`Assistant phone number: ${assistantPhoneNumber}`);

      // Check for recent messages
      const lastMessage = await SMSMessage.findOne({
        fromNumber: assistantPhoneNumber,
        toNumber: userPhoneNumber,
        direction: 'outbound',
        createdAt: { $gte: new Date(Date.now() - ASSISTANT_TIMEOUT) }
      }).sort({ createdAt: -1 });

      if (!lastMessage) {
        console.log('No assistant messages found in last 3 hours - new conversation');
        return true;
      }

      console.log('Assistant has sent messages recently - ongoing conversation');
      return false;
    } catch (error) {
      console.error('Exception in isNewConversation:', error);
      return true;
    }
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(userPhoneNumber, assistantId, limit = 10) {
    try {
      console.log(`Getting conversation history for user phone: ${userPhoneNumber}, assistant: ${assistantId}`);

      const phoneData = await PhoneNumber.findOne({
        inboundAssistantId: assistantId,
        status: 'active'
      });

      if (!phoneData) {
        return [];
      }

      const assistantPhoneNumber = phoneData.number;

      // Get messages
      const messages = await SMSMessage.find({
        $or: [
          { toNumber: userPhoneNumber, fromNumber: assistantPhoneNumber },
          { toNumber: assistantPhoneNumber, fromNumber: userPhoneNumber }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages || [];
    } catch (error) {
      console.error('Exception in getConversationHistory:', error);
      return [];
    }
  }

  /**
   * Save incoming SMS message
   */
  async saveIncomingSMS(smsData) {
    try {
      console.log('💾 SMS DATABASE SERVICE: Saving incoming SMS');

      const message = await SMSMessage.create({
        messageSid: smsData.messageSid,
        toNumber: smsData.toNumber,
        fromNumber: smsData.fromNumber,
        body: smsData.messageBody,
        direction: 'inbound',
        status: 'received',
        userId: smsData.userId,
        dateCreated: new Date(),
        dateUpdated: new Date()
      });

      console.log('✅ SMS saved successfully');
      return message;
    } catch (error) {
      console.error('Exception in saveIncomingSMS:', error);
      return null;
    }
  }

  /**
   * Save outgoing SMS message
   */
  async saveOutgoingSMS(smsData) {
    try {
      const message = await SMSMessage.create({
        messageSid: smsData.messageSid,
        toNumber: smsData.toNumber,
        fromNumber: smsData.fromNumber,
        body: smsData.messageBody,
        direction: 'outbound',
        status: smsData.status || 'sent',
        userId: smsData.userId,
        dateCreated: new Date(),
        dateUpdated: new Date()
      });

      return message;
    } catch (error) {
      console.error('Exception in saveOutgoingSMS:', error);
      return null;
    }
  }

  /**
   * Get Twilio credentials for a user
   */
  async getTwilioCredentials(userId) {
    try {
      const credentials = await TwilioCredential.findOne({
        userId: userId,
        isActive: true
      });
      return credentials;
    } catch (error) {
      console.error('Exception in getTwilioCredentials:', error);
      return null;
    }
  }

  /**
   * Get user ID from assistant ID
   */
  async getUserIdFromAssistant(assistantId) {
    try {
      const assistant = await Assistant.findById(assistantId);
      return assistant ? assistant.userId : null;
    } catch (error) {
      console.error('Exception in getUserIdFromAssistant:', error);
      return null;
    }
  }
}

export { SMSDatabaseService };
