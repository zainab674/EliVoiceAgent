import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
    company_id: {
        type: String, // Or mongoose.Schema.Types.ObjectId if referencing User/Company model rigorously
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    // Pinecone Index Info
    pinecone_index_name: String,
    pinecone_index_host: String,
    pinecone_index_status: String,
    pinecone_index_dimension: Number,
    pinecone_index_metric: String,
    pinecone_created_at: Date,
    pinecone_updated_at: Date,

    // Pinecone Assistant Info
    pinecone_assistant_id: String,
    pinecone_assistant_name: String,
    pinecone_assistant_instructions: String,
    pinecone_assistant_region: String,
    pinecone_assistant_created_at: Date,
    pinecone_assistant_updated_at: Date,
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Create a compound index if needed, but company_id is the main filter
// knowledgeBaseSchema.index({ company_id: 1 });

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
