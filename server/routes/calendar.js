import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Helper to map mongoose subdoc to frontend interface
const mapCredential = (subdoc, userId) => ({
    id: subdoc._id,
    user_id: userId,
    provider: subdoc.provider,
    api_key: subdoc.api_key,
    event_type_id: subdoc.event_type_id,
    event_type_slug: subdoc.event_type_slug,
    timezone: subdoc.timezone,
    label: subdoc.label,
    is_active: subdoc.is_active,
    created_at: subdoc.createdAt || new Date(),
    updated_at: subdoc.updatedAt || new Date()
});

// @desc    Get connected calendars (Legacy/Simple)
// @route   GET /api/v1/calendar
// @access  Private
router.get('/', protect, async (req, res) => {
    res.json(req.user.calendar_integrations || []);
});

// @desc    Connect a calendar (Legacy/Simple)
// @route   POST /api/v1/calendar/connect
// @access  Private
router.post('/connect', protect, async (req, res) => {
    try {
        const { provider, accessToken, email } = req.body;

        const user = await User.findById(req.user._id);

        // Remove existing of same provider if any
        user.calendar_integrations = user.calendar_integrations.filter(c => c.provider !== provider);

        user.calendar_integrations.push({
            provider,
            accessToken,
            email,
            expiresAt: new Date(Date.now() + 3600 * 1000 * 24 * 30)
        });

        await user.save();

        res.json(user.calendar_integrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ----------------------------------------------------
// New Detailed Credential Management Routes
// ----------------------------------------------------

// @desc    Get all calendar credentials
// @route   GET /api/v1/calendar/credentials
router.get('/credentials', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const creds = (user.calendar_integrations || []).map(c => mapCredential(c, user._id));
        res.json({ data: creds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get active calendar credentials
// @route   GET /api/v1/calendar/credentials/active
router.get('/credentials/active', protect, async (req, res) => {
    try {
        const { provider } = req.query;
        const user = await User.findById(req.user._id);

        let active;
        if (provider) {
            active = user.calendar_integrations.find(c => c.is_active && c.provider === provider);
        } else {
            // Find first active one
            active = user.calendar_integrations.find(c => c.is_active);
        }

        if (!active) {
            return res.status(404).json({ message: 'No active credentials found' });
        }

        res.json({ data: mapCredential(active, user._id) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Save new calendar credentials
// @route   POST /api/v1/calendar/credentials
router.post('/credentials', protect, async (req, res) => {
    try {
        const { provider, apiKey, eventTypeId, eventTypeSlug, timezone, label } = req.body;

        const user = await User.findById(req.user._id);

        // Ensure only one active credential? For now we set new one as active and deactivate others.
        if (user.calendar_integrations) {
            user.calendar_integrations.forEach(c => c.is_active = false);
        } else {
            user.calendar_integrations = [];
        }

        const newCred = {
            provider,
            api_key: apiKey,
            event_type_id: eventTypeId,
            event_type_slug: eventTypeSlug,
            timezone,
            label,
            is_active: true
        };

        user.calendar_integrations.push(newCred);
        await user.save();

        const created = user.calendar_integrations[user.calendar_integrations.length - 1];
        res.json({ data: mapCredential(created, user._id) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update calendar credentials
// @route   PUT /api/v1/calendar/credentials/:id
router.put('/credentials/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const user = await User.findById(req.user._id);
        const cred = user.calendar_integrations.id(id);

        if (!cred) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        if (updates.apiKey !== undefined) cred.api_key = updates.apiKey;
        if (updates.eventTypeId !== undefined) cred.event_type_id = updates.eventTypeId;
        if (updates.eventTypeSlug !== undefined) cred.event_type_slug = updates.eventTypeSlug;
        if (updates.timezone !== undefined) cred.timezone = updates.timezone;
        if (updates.label !== undefined) cred.label = updates.label;
        if (updates.is_active !== undefined) cred.is_active = updates.is_active;

        // If setting to active, deactivate others
        if (updates.is_active) {
            user.calendar_integrations.forEach(c => {
                if (c._id.toString() !== id) c.is_active = false;
            });
        }

        await user.save();
        res.json({ data: mapCredential(cred, user._id) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete calendar credentials
// @route   DELETE /api/v1/calendar/credentials/:id
router.delete('/credentials/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);

        user.calendar_integrations.pull(id);
        await user.save();

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Activate calendar credentials
// @route   POST /api/v1/calendar/credentials/:id/activate
router.post('/credentials/:id/activate', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);

        const cred = user.calendar_integrations.id(id);
        if (!cred) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Deactivate all others
        user.calendar_integrations.forEach(c => c.is_active = false);

        // Activate target
        cred.is_active = true;

        await user.save();
        res.json({ data: mapCredential(cred, user._id) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Fetch external event types from provider (e.g. Cal.com)
// @route   GET /api/v1/calendar/credentials/:id/fetch-external-events
router.get('/credentials/:id/fetch-external-events', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);

        const cred = user.calendar_integrations.id(id);
        if (!cred) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        if (cred.provider === 'calcom') {
            if (!cred.api_key) {
                return res.status(400).json({ message: 'API Key missing for this credential' });
            }

            console.log(`Fetching Cal.com event types using v1 API for credential ${id}`);
            const fetchUrl = `https://api.cal.com/v1/event-types?apiKey=${cred.api_key}`;
            console.log(`Fetch URL: ${fetchUrl.substring(0, 50)}... [key truncated]`);

            try {
                const response = await fetch(fetchUrl, {
                    method: 'GET'
                });

                console.log(`Cal.com v1 response status: ${response.status}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Cal.com v1 error:", errorText);
                    return res.status(response.status).json({ message: 'Failed to fetch from Cal.com', error: errorText });
                }

                const data = await response.json();
                console.log("Cal.com v1 response body keys:", Object.keys(data));

                // Extraction logic for v1 format
                let eventTypes = [];
                if (data.event_types && Array.isArray(data.event_types)) {
                    eventTypes = data.event_types;
                } else if (Array.isArray(data)) {
                    eventTypes = data;
                }

                console.log(`✓ Found ${eventTypes.length} event types from Cal.com v1`);
                return res.json({ data: eventTypes });
            } catch (error) {
                console.error("Cal.com fetch error:", error);
                return res.status(500).json({ message: 'Error connecting to Cal.com' });
            }
        }

        // Implement other providers as needed

        return res.json({ data: [] });
    } catch (error) {
        console.error("Error fetching external events:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
