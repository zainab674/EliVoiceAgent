// server/csv-management.js
import express from 'express';
import CsvFile from './models/CsvFile.js';
import CsvContact from './models/CsvContact.js';
import { authenticateToken } from './utils/auth.js';


export const csvManagementRouter = express.Router();

/**
 * Create a new CSV file reference
 * POST /api/v1/csv
 */
csvManagementRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, rowCount, fileSize } = req.body;
    const userId = req.user.id;

    const csvFile = new CsvFile({
      name,
      rowCount,
      fileSize,
      userId,
      originalName: name // Assuming same for now
    });

    const savedFile = await csvFile.save();

    res.status(201).json({
      success: true,
      csvFileId: savedFile._id,
      data: savedFile
    });
  } catch (error) {
    console.error('Error creating CSV file:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Add contacts to a CSV file
 * POST /api/v1/csv/:id/contacts
 */
csvManagementRouter.post('/:id/contacts', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { contacts } = req.body; // Array of contacts
    const userId = req.user.id;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({ success: false, message: 'Contacts must be an array' });
    }

    // Verify ownership
    const csvFile = await CsvFile.findOne({ _id: id, userId });
    if (!csvFile) {
      return res.status(404).json({ success: false, message: 'CSV file not found' });
    }

    const contactsToInsert = contacts.map(c => ({
      csvFileId: id,
      name: (c.first_name + ' ' + (c.last_name || '')).trim(),
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      email: c.email,
      status: c.status || 'active',
      data: c // Store raw or extra data if needed
    }));

    const result = await CsvContact.insertMany(contactsToInsert);

    res.json({
      success: true,
      savedCount: result.length
    });
  } catch (error) {
    console.error('Error saving CSV contacts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Get all CSV files for the current user
 * GET /api/v1/csv
 */
csvManagementRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const csvFiles = await CsvFile.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      csvFiles: csvFiles.map(file => ({
        id: file._id,
        name: file.name,
        originalName: file.originalName,
        rowCount: file.rowCount,
        createdAt: file.createdAt,
        user_id: file.userId // Maintain compatibility
      }))
    });
  } catch (error) {
    console.error('Error fetching CSV files:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Get contacts for a CSV file
 * GET /api/v1/csv/:id/contacts
 */
csvManagementRouter.get('/:id/contacts', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Verify ownership
    const csvFile = await CsvFile.findOne({ _id: id, userId });
    if (!csvFile) {
      return res.status(404).json({ success: false, message: 'CSV file not found' });
    }

    const contacts = await CsvContact.find({ csvFileId: id })
      .skip(skip)
      .limit(limit);

    const total = await CsvContact.countDocuments({ csvFileId: id });

    res.json({
      success: true,
      contacts: contacts.map(c => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        data: c.data
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching CSV contacts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Delete a CSV file
 * DELETE /api/v1/csv/:id
 */
csvManagementRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get CSV file details first to check if it exists and belongs to user
    const csvFile = await CsvFile.findOne({ _id: id, userId });

    if (!csvFile) {
      return res.status(404).json({
        success: false,
        message: 'CSV file not found'
      });
    }


    // Delete the CSV file and related contacts
    await CsvFile.deleteOne({ _id: id });
    await CsvContact.deleteMany({ csvFileId: id });

    res.json({
      success: true,
      message: 'CSV file deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting CSV file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete CSV file',
      error: error.message
    });
  }
});

/**
 * Get CSV file details
 * GET /api/v1/csv/:id
 */
csvManagementRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const csvFile = await CsvFile.findOne({ _id: id, userId });

    if (!csvFile) {
      return res.status(404).json({
        success: false,
        message: 'CSV file not found'
      });
    }

    const contactCount = await CsvContact.countDocuments({ csvFileId: id });

    res.json({
      success: true,
      csvFile: {
        id: csvFile._id,
        name: csvFile.name,
        originalName: csvFile.originalName,
        rowCount: csvFile.rowCount,
        createdAt: csvFile.createdAt,
        contact_count: contactCount
      }
    });

  } catch (error) {
    console.error('Error fetching CSV file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CSV file'
    });
  }
});
