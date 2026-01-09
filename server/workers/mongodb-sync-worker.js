import schedule from 'node-cron';
import User from '../models/User.js';
import mongodbIntegrationService from '../services/mongodb-integration-service.js';

class MongoDBSyncWorker {
    start() {
        console.log('[MongoDBSyncWorker] Worker started');
        // Run every 15 minutes
        schedule.schedule('*/15 * * * *', this.syncAllUsers.bind(this));
    }

    async syncAllUsers() {
        console.log('[MongoDBSyncWorker] Starting sync for all users...');
        try {
            const users = await User.find({
                'mongodb_configurations.isActive': true
            });

            for (const user of users) {
                for (const config of user.mongodb_configurations) {
                    if (config.isActive) {
                        try {
                            console.log(`[MongoDBSyncWorker] Syncing config ${config._id} for user ${user._id}`);
                            await mongodbIntegrationService.syncLeads(user, config);
                        } catch (configError) {
                            console.error(`[MongoDBSyncWorker] Error syncing config ${config._id}:`, configError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[MongoDBSyncWorker] Error fetching users:', error);
        }
    }
}

export default new MongoDBSyncWorker();
