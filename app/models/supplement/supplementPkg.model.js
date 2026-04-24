const mongoose = require('mongoose');
const { Schema } = mongoose;

const supplementPkgSchema = new mongoose.Schema(
    {
        supplementSeller: {
            type: Schema.Types.ObjectId,
            ref: 'SupplementSeller'
        },
        name: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            default: 0
        },
        gender: {
            type: String,
            enum: ['unisex', 'men', 'women'],
        },
        type: {
            type: String,
            enum: ['Weight Gain', 'Weight Loss'],
        },
        products: [
            {
                _id: {
                    type: Schema.Types.ObjectId,
                    ref: 'Supplement'
                },
                stockId: {
                    type: Schema.Types.ObjectId,
                },
            }
        ],
        description: {
            type: String,
            default: '',
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Number,
            default: () => new Date().getTime(),
        },
        updatedAt: {
            type: Number,
            default: () => new Date().getTime(),
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        image: {
            type: String,
            default: '',
        },
        reviews: [
            {
                rating: { type: Number, min: 0, max: 5, default: 0 },
                review: { type: String, trim: true, default: "" },
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                createdAt: { type: Number, default: () => new Date().getTime() }
            }
        ],
        averageRating: {
            type: Number,
            default: 0
        }
    },
    {
        strict: true,
        collection: 'SupplementPkg',
        versionKey: false,
        timestamps: true,
    }
);

supplementPkgSchema.index({
    location: '2dsphere',
});

exports.SupplementPkgModel = mongoose.model('SupplementPkg', supplementPkgSchema);
