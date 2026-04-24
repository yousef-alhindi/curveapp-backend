const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    size: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true,
    },
    availableQuantity: {
        type: Number,
        default: 0,
    },
    mrp: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    skuLimit: {
        type: Number,
        default: 0,
    },
});

const groceryProductSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Grocery',
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GroceryCategory',
            required: true,
        },
        subCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GrocerySubCategory',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },
        countryOrigin: {
            type: String,
        },
        description: {
            type: String,
        },
        variants: [variantSchema],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        images: [{
            type: String
        }],
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
        collection: 'GroceryProduct',
        versionKey: false,
        timestamps: true,
    }
);

exports.GroceryProductModel = mongoose.model('GroceryProduct', groceryProductSchema);
