import 'dotenv/config';
import connectDB from './server/lib/mongodb.js';
import EmailLog from './server/models/EmailLog.js';
import User from './server/models/User.js';
import Assistant from './server/models/Assistant.js';
import emailService from './server/services/email-service.js';

async function retry() {
    await connectDB();
    const inbound = await EmailLog.findOne({ direction: 'inbound' }).sort({ createdAt: -1 });
    if (!inbound) {
        console.log("No inbound email found");
        process.exit();
    }
    console.log(`Processing inbound: ${inbound.subject} from ${inbound.from}`);

    const user = await User.findById(inbound.userId);
    const integration = user.email_integrations.find(i => i.smtpUser === 'sales@qbxpress.com');
    const assistant = await Assistant.findById(inbound.assistantId);

    if (!integration || !assistant) {
        console.log("Missing integration or assistant context");
        process.exit();
    }

    console.log(`Sending manual retry for Assistant: ${assistant.name}`);
    await emailService.generateAndSendReply(user, integration, assistant, inbound, {
        from: inbound.from,
        to: inbound.to,
        subject: inbound.subject,
        text: inbound.body,
        messageId: inbound.messageId,
        references: inbound.inReplyTo
    });

    console.log("Done");
    process.exit();
}

retry().catch(err => {
    console.error(err);
    process.exit(1);
});
