import express from 'express';
import Contact from '../models/Contact.js';
import ContactList from '../models/ContactList.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

/**
 * GET /api/v1/contacts
 * Get all contacts for the user
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const listId = req.query.listId;
        const query = { user_id: req.user.id };

        if (listId) {
            query.list_id = listId;
        }

        const contacts = await Contact.find(query)
            .populate('list_id', 'name')
            .sort({ created_at: -1 });

        const total = await Contact.countDocuments(query);

        res.json({
            success: true,
            data: {
                contacts,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/v1/contacts
 * Create a new contact
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { first_name, last_name, phone, email, list_id, status, do_not_call } = req.body;

        if (!first_name) {
            return res.status(400).json({ success: false, error: 'First name is required' });
        }

        const contact = new Contact({
            user_id: req.user.id,
            first_name,
            last_name,
            phone,
            email,
            list_id,
            status: status || 'active',
            do_not_call: do_not_call || false
        });

        await contact.save();

        res.status(201).json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/v1/contacts/lists
 * Create a new contact list
 */
router.post('/lists', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'List name is required' });
        }

        const list = new ContactList({
            user_id: req.user.id,
            name,
            description
        });

        await list.save();

        res.status(201).json({
            success: true,
            data: list
        });
    } catch (error) {
        console.error('Error creating contact list:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/v1/contacts/lists
 * Get all contact lists for the user
 */
router.get('/lists', authenticateToken, async (req, res) => {
    try {
        const lists = await ContactList.find({ user_id: req.user.id })
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: lists
        });
    } catch (error) {
        console.error('Error fetching contact lists:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * PATCH /api/v1/contacts/:id
 * Update a contact
 */
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating user_id
        delete updates.user_id;

        const contact = await Contact.findOneAndUpdate(
            { _id: id, user_id: req.user.id },
            { $set: updates },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ success: false, error: 'Contact not found' });
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * DELETE /api/v1/contacts/:id
 * Delete a contact
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findOneAndDelete({ _id: id, user_id: req.user.id });

        if (!contact) {
            return res.status(404).json({ success: false, error: 'Contact not found' });
        }

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
