const mongoose = require('mongoose');

const grocerySubCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GroceryCategory',
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
        collection: 'GrocerySubCategory',
        versionKey: false,
        timestamps: true,
    }
);

exports.GrocerySubCategoryModel = mongoose.model('GrocerySubCategory', grocerySubCategorySchema);
