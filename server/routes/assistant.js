import express from 'express';
import Assistant from '../models/Assistant.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all assistants for logged in user
// @route   GET /api/v1/assistants
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {
            $or: [
                { userId: req.user._id },
                { assignedUserEmail: req.user.email }
            ]
        };

        // If admin, show all assistants
        if (req.user.role === 'admin' || req.user.role === 'super-admin') {
            query = {};
        }

        const assistants = await Assistant.find(query);
        res.json(assistants);
    } catch (error) {
        console.error('Error fetching assistants:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get single assistant
// @route   GET /api/v1/assistants/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const assistant = await Assistant.findById(req.params.id);

        if (assistant) {
            // Check if user owns this assistant, is assigned via email, or is admin
            const isOwner = assistant.userId.toString() === req.user._id.toString();
            const isAssigned = assistant.assignedUserEmail === req.user.email;
            const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';

            if (!isOwner && !isAssigned && !isAdmin) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            res.json(assistant);
        } else {
            res.status(404).json({ message: 'Assistant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new assistant
// @route   POST /api/v1/assistants
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            name,
            systemPrompt,
            firstMessage,
            modelSettings,
            voiceSettings,
            smsSettings,
            analysisSettings,
            advancedSettings,
            n8nSettings,
            dataCollectionSettings,
            assigned_documents,
            email_templates,
            emailReplyPrompt,
            assignedUserEmail,
            nodes,
            edges
        } = req.body;

        if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
            return res.status(403).json({ message: 'Not authorized to create assistants' });
        }

        let assistantUserId = req.user._id;

        // If assigning to an email
        if (assignedUserEmail) {
            const user = await User.findOne({ email: assignedUserEmail });
            if (user) {
                assistantUserId = user._id; // Transfer to user if they exist
            }
        }

        const assistant = new Assistant({
            userId: assistantUserId,
            assignedUserEmail,
            name,
            systemPrompt,
            firstMessage,
            modelSettings,
            voiceSettings,
            smsSettings,
            analysisSettings,
            advancedSettings,
            n8nSettings,
            dataCollectionSettings,
            assigned_documents,
            email_templates,
            emailReplyPrompt,
            nodes,
            edges
        });

        const createdAssistant = await assistant.save();
        res.status(201).json(createdAssistant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Update assistant
// @route   PUT /api/v1/assistants/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let {
            name,
            systemPrompt,
            firstMessage,
            modelSettings,
            voiceSettings,
            smsSettings,
            analysisSettings,
            advancedSettings,
            n8nSettings,
            dataCollectionSettings,
            assigned_documents,
            email_templates,
            emailReplyPrompt,
            assignedUserEmail,
            nodes,
            edges
        } = req.body;

        if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
            return res.status(403).json({ message: 'Not authorized to edit assistants' });
        }

        // Debug: Log the raw assigned_documents
        console.log('Raw assigned_documents type:', typeof assigned_documents);
        console.log('Raw assigned_documents value:', JSON.stringify(assigned_documents, null, 2));

        // Parse assigned_documents if it's a string (handle double-stringified JSON)
        if (assigned_documents && typeof assigned_documents === 'string') {
            try {
                // Try parsing once
                assigned_documents = JSON.parse(assigned_documents);
                console.log('After first parse:', typeof assigned_documents, assigned_documents);

                // If still a string, parse again (double-stringified)
                if (typeof assigned_documents === 'string') {
                    assigned_documents = JSON.parse(assigned_documents);
                    console.log('After second parse:', typeof assigned_documents, assigned_documents);
                }
            } catch (e) {
                console.error('Failed to parse assigned_documents:', e);
                assigned_documents = [];
            }
        }

        // Ensure assigned_documents is an array
        if (assigned_documents && !Array.isArray(assigned_documents)) {
            console.warn('assigned_documents is not an array, converting to array');
            // Handle object with numeric keys
            if (typeof assigned_documents === 'object') {
                const values = Object.values(assigned_documents);
                // Filter out nested objects with numeric keys
                assigned_documents = values.map(item => {
                    if (item && typeof item === 'object' && !Array.isArray(item)) {
                        // If item has numeric keys, extract the actual document
                        const keys = Object.keys(item);
                        if (keys.length === 1 && !isNaN(keys[0])) {
                            return item[keys[0]];
                        }
                    }
                    return item;
                }).filter(doc => doc && typeof doc === 'object' && doc.name);
            } else {
                assigned_documents = [];
            }
        }

        // Final validation: ensure each document has required fields
        if (Array.isArray(assigned_documents)) {
            assigned_documents = assigned_documents.filter(doc =>
                doc &&
                typeof doc === 'object' &&
                doc.name &&
                doc.path
            );
        }

        console.log('Final assigned_documents:', JSON.stringify(assigned_documents, null, 2));

        const assistant = await Assistant.findById(req.params.id);

        if (assistant) {
            // Check if user owns this assistant, is assigned via email, or is admin
            const isOwner = assistant.userId.toString() === req.user._id.toString();
            const isAssigned = assistant.assignedUserEmail === req.user.email;
            const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';

            if (!isOwner && !isAssigned && !isAdmin) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // Update all fields
            assistant.name = name || assistant.name;
            assistant.systemPrompt = systemPrompt !== undefined ? systemPrompt : assistant.systemPrompt;
            assistant.firstMessage = firstMessage !== undefined ? firstMessage : assistant.firstMessage;
            assistant.modelSettings = modelSettings || assistant.modelSettings;
            assistant.voiceSettings = voiceSettings || assistant.voiceSettings;
            assistant.smsSettings = smsSettings || assistant.smsSettings;
            assistant.analysisSettings = analysisSettings || assistant.analysisSettings;
            assistant.advancedSettings = advancedSettings || assistant.advancedSettings;
            assistant.n8nSettings = n8nSettings || assistant.n8nSettings;
            assistant.dataCollectionSettings = dataCollectionSettings || assistant.dataCollectionSettings;
            assistant.emailReplyPrompt = emailReplyPrompt !== undefined ? emailReplyPrompt : assistant.emailReplyPrompt;
            assistant.nodes = nodes || assistant.nodes;
            assistant.edges = edges || assistant.edges;

            // Only update assigned_documents if it's provided and valid
            if (assigned_documents !== undefined) {
                // Clear the existing array first to avoid any casting issues
                assistant.assigned_documents = [];
                assistant.markModified('assigned_documents');

                // Then set the new value
                assistant.assigned_documents = assigned_documents;
                assistant.markModified('assigned_documents');
            }

            if (email_templates) {
                console.log('Updating email_templates:', JSON.stringify(email_templates, null, 2));
                assistant.email_templates = email_templates;
            }

            // Handle Email Assignment Update
            if (assignedUserEmail !== undefined) {
                assistant.assignedUserEmail = assignedUserEmail;
                const user = await User.findOne({ email: assignedUserEmail });
                if (user) {
                    assistant.userId = user._id;
                }
            }

            assistant.updatedAt = Date.now();

            const updatedAssistant = await assistant.save();
            res.json(updatedAssistant);
        } else {
            res.status(404).json({ message: 'Assistant not found' });
        }
    } catch (error) {
        console.error('Error updating assistant:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Delete assistant
// @route   DELETE /api/v1/assistants/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
            return res.status(403).json({ message: 'Not authorized to delete assistants' });
        }
        const assistant = await Assistant.findById(req.params.id);

        if (assistant) {
            // Ensure user owns this assistant or is admin
            if (assistant.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'super-admin') {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await assistant.deleteOne();
            res.json({ message: 'Assistant removed' });
        } else {
            res.status(404).json({ message: 'Assistant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
