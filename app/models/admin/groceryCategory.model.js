const mongoose = require('mongoose');

const groceryCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        icon: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdAt: {
            type: Number,
            default: () => new Date().getTime(),
        },
        updatedAt: {
            type: Number,
            default: () => new Date().getTime(),
        },
    },
    {
        strict: true,
        collection: 'GroceryCategory',
        versionKey: false,
        timestamps: true,
    }
);

exports.GroceryCategoryModel = mongoose.model('GroceryCategory', groceryCategorySchema);
