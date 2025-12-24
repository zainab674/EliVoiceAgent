import mongoose from 'mongoose';

const csvFileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    originalName: String,
    rowCount: { type: Number, default: 0 },
    mappedColumns: { type: Map, of: String }, // e.g., { 'phone': 'Telephone', 'name': 'Full Name' }
    createdAt: { type: Date, default: Date.now }
});

const CsvFile = mongoose.model('CsvFile', csvFileSchema);

export default CsvFile;
