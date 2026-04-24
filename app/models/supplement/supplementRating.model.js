const mongoose = require('mongoose');
const { Schema } = mongoose;

const ItemRatingSchema = new Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplement',
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    review: {
        type: String,
        default: '',
    },
});

const SupplementOrderRatingSchema = new Schema(
    {
        supplementSellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SupplementSeller',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SupplementOrder',
        },
        sellerRating: {
            type: Number,
            default: 0,
        },
        sellerReview: {
            type: String,
            default: '',
        },
        deliveryRating: {
            type: Number,
            default: 0,
        },
        deliveryReview: {
            type: String,
            default: '',
        },
        itemRatings: [ItemRatingSchema],
        status: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Number,
            default: new Date().getTime(),
        },
        updatedAt: {
            type: Number,
            default: new Date().getTime(),
        },
    },
    {
        strict: true,
        collection: 'SupplementOrderRating',
        timestamps: true,
        versionKey: false,
    }
);

exports.SUPPLEMENT_ORDER_RATING_MODEL = mongoose.model('SupplementOrderRating', SupplementOrderRatingSchema);
