import express from 'express';
import Appointment from '../models/Appointment.js';
import Assistant from '../models/Assistant.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all bookings for current user
// @route   GET /api/v1/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get query parameters for filtering
        const { status, assistantId, startDate, endDate } = req.query;

        // Build query
        const query = { userId };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (assistantId && assistantId !== 'all') {
            query.assistantId = assistantId;
        }

        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(startDate);
            }
            if (endDate) {
                query.startTime.$lte = new Date(endDate);
            }
        }

        const bookings = await Appointment.find(query)
            .populate('assistantId', 'name')
            .sort({ startTime: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get specific booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Appointment.findById(req.params.id)
            .populate('assistantId', 'name')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify ownership
        if (booking.userId._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Create a booking (Public/Client facing or from LiveKit agent)
// @route   POST /api/v1/bookings
// @access  Public
router.post('/', async (req, res) => {
    try {
        const {
            assistantId,
            clientName,
            clientEmail,
            clientPhone,
            startTime,
            endTime,
            duration,
            timezone,
            calEventId,
            calBookingUid,
            notes,
            metadata
        } = req.body;

        if (!assistantId || !startTime || !clientName) {
            return res.status(400).json({ message: 'Missing required fields: assistantId, startTime, clientName' });
        }

        const assistant = await Assistant.findById(assistantId).populate('userId');
        if (!assistant) {
            return res.status(404).json({ message: 'Assistant not found' });
        }

        const appointment = await Appointment.create({
            userId: assistant.userId._id,
            assistantId,
            clientName,
            clientEmail,
            clientPhone,
            startTime,
            endTime,
            duration,
            timezone,
            calEventId,
            calBookingUid,
            notes,
            metadata
        });

        console.log(`[Booking Created] ${clientName} for ${assistant.name} at ${startTime}`);

        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Update booking status
// @route   PATCH /api/v1/bookings/:id
// @access  Private
router.patch('/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['scheduled', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const booking = await Appointment.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify ownership
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        booking.status = status;
        await booking.save();

        res.json(booking);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get bookings for an assistant (Protected - for Lawyer)
// @route   GET /api/v1/bookings/assistant/:assistantId
// @access  Private
router.get('/assistant/:assistantId', protect, async (req, res) => {
    try {
        const bookings = await Appointment.find({ assistantId: req.params.assistantId }).sort({ startTime: 1 });
        // Verify ownership
        const assistant = await Assistant.findById(req.params.assistantId);
        if (!assistant || assistant.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
