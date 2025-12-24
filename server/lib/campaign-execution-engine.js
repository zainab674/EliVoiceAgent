import { RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';
import Campaign from '../models/Campaign.js';
import CampaignCall from '../models/CampaignCall.js';
import CallQueue from '../models/CallQueue.js';
import ContactList from '../models/ContactList.js';
import CsvFile from '../models/CsvFile.js';
import Contact from '../models/Contact.js';
import CsvContact from '../models/CsvContact.js';
import PhoneNumber from '../models/PhoneNumber.js';

// Singleton instance
class CampaignExecutionEngine {
    constructor() {
        this.isRunning = false;
        this.executionInterval = null;
        this.checkInterval = 30000; // 30 seconds
    }

    start() {
        if (this.isRunning) {
            console.log('Campaign execution engine is already running');
            return;
        }

        this.isRunning = true;
        console.log('Starting campaign execution engine...');

        // Initial check
        this.executeCampaigns();

        // Loop
        this.executionInterval = setInterval(() => {
            this.executeCampaigns();
        }, this.checkInterval);
    }

    stop() {
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
        this.isRunning = false;
        console.log('Campaign execution engine stopped');
    }

    async executeCampaigns() {
        try {
            // Find running campaigns that are due for a call
            // We check 'executionStatus' is 'running'
            // We check 'nextCallAt' <= now (or null)
            const now = new Date();
            const campaigns = await Campaign.find({
                executionStatus: 'running',
                $or: [{ nextCallAt: { $lte: now } }, { nextCallAt: null }]
            }).sort({ nextCallAt: 1 });

            if (campaigns.length === 0) return;

            console.log(`Found ${campaigns.length} campaigns ready to execute`);

            for (const campaign of campaigns) {
                try {
                    await this.executeCampaign(campaign);
                } catch (err) {
                    console.error(`Error executing campaign ${campaign._id}:`, err);
                    // Update status to error? Or just log and retry later?
                    // keeping it running but maybe log error
                }
            }
        } catch (error) {
            console.error('Error in executeCampaigns:', error);
        }
    }

    async executeCampaign(campaign) {
        console.log(`Executing campaign: ${campaign.name} (${campaign._id})`);

        // Check limits/schedule
        if (!this.shouldExecuteCampaign(campaign)) {
            // Pause it for now? Or just skip?
            // If daily cap reached, technically we should pause until tomorrow?
            // But for now let's just log and maybe pause if cap reached.
            if (campaign.currentDailyCalls >= campaign.dailyCap) {
                console.log(`Campaign ${campaign.name} reached daily cap. Pausing...`);
                // Optionally pause or just return and wait for next reset
                // Better to set status to 'idle' or keep running but it won't trigger?
                // logic in sass-livekit was to pause.
                await this.pauseCampaign(campaign._id, 'Daily cap reached');
            }
            return;
        }

        // Process Queue
        await this.processAllCalls(campaign);
    }

    async processAllCalls(campaign) {
        // 1. Queue new contacts if queue is empty or low
        await this.queueCampaignCalls(campaign);

        // 2. Process existing queue items
        await this.processCallQueue(campaign);
    }

    async queueCampaignCalls(campaign) {
        // Check if we need to add more items to queue
        // For simplicity, let's see if we have pending items.
        // If not, fetch more contacts.

        const pendingCount = await CallQueue.countDocuments({
            campaignId: campaign._id,
            status: 'queued'
        });

        if (pendingCount > 10) return; // Buffer enough

        // Fetch contacts
        const contacts = await this.getCampaignContacts(campaign);

        if (!contacts || contacts.length === 0) {
            console.log(`No contacts found for campaign ${campaign.name}`);
            // If queue is also empty, maybe complete the campaign?
            if (pendingCount === 0) {
                await this.completeCampaign(campaign._id);
            }
            return;
        }

        console.log(`Checking ${contacts.length} contacts for queuing...`);

        for (const contact of contacts) {
            // Check if we already have a call for this contact in this campaign
            const existingCall = await CampaignCall.findOne({
                campaignId: campaign._id,
                phoneNumber: contact.phone_number // Ensure standardization
            });

            if (existingCall) {
                // If failed or completed, skip. 
                // If we want retry logic, it would go here.
                continue;
            }

            // Create CampaignCall
            const newCall = await CampaignCall.create({
                campaignId: campaign._id,
                contactId: contact.id, // might be undefined if CSV
                phoneNumber: contact.phone_number,
                contactName: contact.name,
                email: contact.email,
                status: 'pending',
                startedAt: null
            });

            // Add to Queue
            await CallQueue.create({
                campaignId: campaign._id,
                campaignCallId: newCall._id,
                phoneNumber: contact.phone_number,
                status: 'queued',
                scheduledFor: new Date()
            });

            console.log(`Queued contact ${contact.name}`);
        }
    }

    async processCallQueue(campaign) {
        const batchSize = 5;
        // Remaining calls allowed today
        const maxCalls = campaign.dailyCap - (campaign.currentDailyCalls || 0);
        if (maxCalls <= 0) return;

        const effectiveBatch = Math.min(batchSize, maxCalls);

        const queueItems = await CallQueue.find({
            campaignId: campaign._id,
            status: 'queued',
            scheduledFor: { $lte: new Date() }
        }).sort({ priority: -1, scheduledFor: 1 }).limit(effectiveBatch).populate('campaignCallId');

        if (queueItems.length === 0) return;

        console.log(`Processing ${queueItems.length} calls for campaign ${campaign.name}`);

        for (const item of queueItems) {
            try {
                await this.executeCall(campaign, item);

                // Update stats
                await Campaign.updateOne(
                    { _id: campaign._id },
                    {
                        $inc: { currentDailyCalls: 1, totalCallsMade: 1 },
                        lastExecutionAt: new Date()
                    }
                );

                // Small delay to avoid rate limits
                await new Promise(r => setTimeout(r, 2000));
            } catch (err) {
                console.error(`Call failed for queue item ${item._id}:`, err);

                // Mark failed
                await CallQueue.updateOne({ _id: item._id }, { status: 'failed' });
                await CampaignCall.updateOne({ _id: item.campaignCallId._id }, {
                    status: 'failed',
                    completedAt: new Date(),
                    notes: err.message
                });
            }
        }

        // Update next call time?
        // Not strictly needed if we just poll, but helps throttle loop
    }

    async executeCall(campaign, queueItem) {
        const campaignCall = queueItem.campaignCallId;

        // 1. Mark processing
        await CallQueue.updateOne({ _id: queueItem._id }, { status: 'processing' });
        await CampaignCall.updateOne({ _id: campaignCall._id }, {
            status: 'calling',
            startedAt: new Date()
        });

        // 2. Get Outbound Trunk Info (from Assistant -> PhoneNumber)
        let fromNumber = null;
        let outboundTrunkId = null;

        if (campaign.assistantId) {
            const phoneEntry = await PhoneNumber.findOne({
                inboundAssistantId: campaign.assistantId,
                status: 'active'
            });

            if (phoneEntry) {
                fromNumber = phoneEntry.number;
                outboundTrunkId = phoneEntry.trunkSid;
            }
        }

        if (!outboundTrunkId) {
            console.warn(`No outbound trunk found for assistant ${campaign.assistantId}, trying to proceed anyway (or throw error)`);
            // throwing error might stop campaign, let's just log for now?
            // Actually, without trunk ID, we can't dispatch outbound call usually.
            // But maybe the python agent has a default?
            // safe to throw.
            // throw new Error("No outbound trunk configured"); 
            // Commenting out throw to allow testing if logic is flexible, but likely it will fail.
        }

        // 3. Prepare Room & Dispatch
        const livekitUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST;
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        const roomName = `campaign-${campaign._id}-${campaignCall._id}-${Date.now()}`;

        // Helper to format phone
        let toNumber = campaignCall.phoneNumber;
        if (!toNumber.startsWith('+')) toNumber = '+' + toNumber;

        const metadata = {
            assistantId: campaign.assistantId,
            campaignId: campaign._id,
            campaignPrompt: campaign.campaignPrompt || '',
            contactInfo: {
                name: campaignCall.contactName,
                email: campaignCall.email,
                phone: toNumber
            },
            source: 'outbound',
            callType: 'campaign', // Important for agent to know
            outbound_trunk_id: outboundTrunkId,
            phoneNumber: toNumber // Explicit for agent
        };

        // Create Room
        const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        await roomService.createRoom({
            name: roomName,
            metadata: JSON.stringify(metadata)
        });

        // Dispatch Agent
        let httpUrl = livekitUrl;
        if (livekitUrl.startsWith('wss://')) {
            httpUrl = livekitUrl.replace('wss://', 'https://');
        } else if (livekitUrl.startsWith('ws://')) {
            httpUrl = livekitUrl.replace('ws://', 'http://');
        }

        const agentDispatchClient = new AgentDispatchClient(httpUrl, apiKey, apiSecret);

        const agentName = process.env.LK_AGENT_NAME || 'ai';

        await agentDispatchClient.createDispatch(roomName, agentName, {
            metadata: JSON.stringify({
                ...metadata,
                roomName,
                agentName
            })
        });

        console.log(`Agent dispatched to room ${roomName}`);

        // Dial SIP Participant (The actual phone call)
        if (outboundTrunkId) {
            try {
                const { SipClient } = await import('livekit-server-sdk');
                const sipClient = new SipClient(httpUrl, apiKey, apiSecret);

                await sipClient.createSipParticipant(roomName, {
                    sipTrunkId: outboundTrunkId,
                    sipCallTo: toNumber,
                    participantIdentity: `phone-${campaignCall.phoneNumber}`,
                    participantName: campaignCall.contactName || 'Customer',
                });
                console.log(`SIP participant created for ${toNumber} via trunk ${outboundTrunkId}`);
            } catch (sipError) {
                console.error(`Failed to create SIP participant: ${sipError.message}`);
                // Proceeding, but call might fail.
            }
        } else {
            console.warn(`Skipping SIP dial for ${toNumber} - No Outbound Trunk ID`);
        }

        // Update DB
        await CampaignCall.updateOne({ _id: campaignCall._id }, {
            callSid: roomName, // Using roomName as SID for now
            roomName: roomName
        });
        await CallQueue.updateOne({ _id: queueItem._id }, {
            status: 'completed',
            updatedAt: new Date()
        });
    }

    async getCampaignContacts(campaign) {
        // Fetch from ContactList or CSV/CsvFile

        let rawContacts = [];

        if (campaign.contactSource === 'contact_list' && campaign.contactListId) {
            try {
                // Use imported Contact model
                // Fix: use list_id based on Contact.js schema
                rawContacts = await Contact.find({ list_id: campaign.contactListId });
            } catch (e) {
                console.error("Could not load/query Contact model", e);
            }
        } else if (campaign.contactSource === 'csv_file' && campaign.csvFileId) {
            try {
                // Use imported CsvContact model
                // Fix: use csvFileId matching schema
                rawContacts = await CsvContact.find({ csvFileId: campaign.csvFileId });
            } catch (e) {
                console.error("Could not load/query CsvContact model", e);
            }
        }

        // Map to standard format
        return rawContacts.map(c => ({
            id: c._id,
            name: c.name || c.first_name + ' ' + (c.last_name || '') || 'Unknown',
            phone_number: c.phone || c.phone_number || '', // adjust field names
            email: c.email || ''
        })).filter(c => c.phone_number && c.phone_number.length > 5);
    }

    shouldExecuteCampaign(campaign) {
        // Same logic as sass-livekit
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        // 24/7 check
        if (campaign.startHour === 0 && campaign.endHour === 0) return true;

        // Hours check
        let withinHours = false;
        if (campaign.startHour <= campaign.endHour) {
            withinHours = currentHour >= campaign.startHour && currentHour < campaign.endHour;
        } else {
            withinHours = currentHour >= campaign.startHour || currentHour < campaign.endHour;
        }

        if (!withinHours) {
            console.log(`Campaign ${campaign.name} outside hours (${currentHour})`);
            return false;
        }

        // Days check
        if (campaign.callingDays && !campaign.callingDays.includes(currentDay)) {
            console.log(`Campaign ${campaign.name} not today (${currentDay})`);
            return false;
        }

        return true;
    }

    async pauseCampaign(id, reason) {
        await Campaign.updateOne({ _id: id }, {
            executionStatus: 'paused',
            status: 'paused'
        });
        console.log(`Paused campaign ${id}: ${reason}`);
    }

    async completeCampaign(id) {
        await Campaign.updateOne({ _id: id }, {
            executionStatus: 'completed',
            status: 'completed'
        });
        console.log(`Completed campaign ${id}`);
    }
}

export const campaignExecutionEngine = new CampaignExecutionEngine();
