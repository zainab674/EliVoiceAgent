import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assistantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant',
        required: true
    },
    clientName: String,
    clientEmail: String,
    clientPhone: String,
    startTime: {
        type: Date,
        required: true
    },
    endTime: Date,
    duration: {
        type: Number, // in minutes
        default: 30
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed'],
        default: 'scheduled'
    },
    calEventId: String, // Cal.com event ID
    calBookingUid: String, // Cal.com booking UID
    notes: String,
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Appointment', appointmentSchema);
