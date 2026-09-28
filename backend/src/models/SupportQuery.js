const mongoose = require('mongoose');

const supportQuerySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Contact name is required'],
            trim: true,
        },
        contact: {
            type: String,
            required: [true, 'Contact number or email is required'],
            trim: true,
        },
        query: {
            type: String,
            required: [true, 'Query message is required'],
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'resolved', 'closed', 'PENDING', 'IN_PROGRESS', 'RESOLVED'],
            default: 'pending',
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id;
                return ret;
            },
        },
    }
);

module.exports = mongoose.model('SupportQuery', supportQuerySchema, 'support_queries');
