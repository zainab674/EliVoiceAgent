import mongoose from 'mongoose';

const csvContactSchema = new mongoose.Schema({
    csvFileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CsvFile',
        required: true,
        index: true
    },
    name: String,
    phone: String,
    email: String,
    data: { type: Map, of: String }, // Store other dynamic fields
    createdAt: { type: Date, default: Date.now }
});

const CsvContact = mongoose.model('CsvContact', csvContactSchema);

export default CsvContact;
