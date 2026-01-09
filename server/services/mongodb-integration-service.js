import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import emailService from './email-service.js';
import Assistant from '../models/Assistant.js';
import Submission from '../models/Submission.js';

class MongoDBIntegrationService {
    /**
     * Categorize lead based on revenue and team size
     * @param {Object} data - include revenue and teamSize
     * @returns {string} - category
     */
    categorizeLead(data) {
        const { revenue, teamSize } = data;

        // Parse revenue string (e.g., "$500,000" -> 500000)
        let revenueNum = 0;
        if (revenue) {
            revenueNum = parseInt(revenue.replace(/[^0-9]/g, ''), 10) || 0;
        }

        // Categorization logic
        if (revenueNum > 10000000 || teamSize === '51-200' || teamSize === '200+') {
            return 'large';
        }
        if (revenueNum >= 1000000 || teamSize === '21-50') {
            return 'growing';
        }
        if (revenueNum >= 100000 && teamSize === '6-20') {
            return 'medium';
        }
        return 'small';
    }

    /**
     * Sync leads from an external MongoDB collection
     * @param {Object} user - User document
     * @param {Object} config - MongoDB configuration { connectionString, collectionName, assistantId }
     */
    async syncLeads(user, config) {
        if (!config.isActive) return;

        let client;
        try {
            client = new MongoClient(config.connectionString);
            await client.connect();
            const db = client.db();
            console.log(`[MongoDBIntegration] Connected to external DB. Database: ${db.databaseName}`);
            const collection = db.collection(config.collectionName);

            const totalCount = await collection.countDocuments();
            console.log(`[MongoDBIntegration] Total leads in collection "${config.collectionName}": ${totalCount}`);

            // Fetch leads where emailSent is false
            const leads = await collection.find({ emailSent: { $ne: true } }).toArray();
            console.log(`[MongoDBIntegration] Found ${leads.length} new leads in collection "${config.collectionName}"`);

            for (const lead of leads) {
                console.log(`[MongoDBIntegration] Processing lead: ${lead.email}`);
                try {
                    // 1. Categorize lead
                    const category = this.categorizeLead({
                        revenue: lead.revenue,
                        teamSize: lead.teamSize
                    });

                    // 2. Add to Eli VoiceAgent Contacts if not exists
                    let contact = await Contact.findOne({ email: lead.email, user_id: user._id });
                    if (!contact) {
                        contact = await Contact.create({
                            user_id: user._id,
                            first_name: lead.firstName || lead.name || 'Unknown',
                            email: lead.email,
                            phone: lead.phoneNumber || lead.phone || '',
                            category: category,
                            status: 'active'
                        });
                    } else {
                        contact.category = category;
                        await contact.save();
                    }

                    // 3. Save to Submissions record
                    await Submission.create({
                        userId: user._id,
                        contactId: contact._id,
                        assistantId: config.assistantId,
                        source: 'mongodb',
                        category: category,
                        data: {
                            firstName: lead.firstName,
                            email: lead.email,
                            phoneNumber: lead.phoneNumber,
                            teamSize: lead.teamSize,
                            revenue: lead.revenue,
                            accountingSystem: lead.accountingSystem,
                            bankName: lead.bankName,
                            country: lead.country,
                            industry: lead.industry,
                            importantThing: lead.importantThing
                        }
                    });

                    // 4. Mark as sent in external DB
                    await collection.updateOne(
                        { _id: lead._id },
                        { $set: { emailSent: true } }
                    );

                } catch (leadError) {
                    console.error(`[MongoDBIntegration] Error processing lead ${lead._id}:`, leadError);
                }
            }

            // Update last sync time
            await User.updateOne(
                { _id: user._id, 'mongodb_configurations._id': config._id },
                { $set: { 'mongodb_configurations.$.lastSync': new Date() } }
            );

        } catch (error) {
            console.error('[MongoDBIntegration] Sync Error:', error);
            throw error;
        } finally {
            if (client) await client.close();
        }
    }
}

export default new MongoDBIntegrationService();
