const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
    restId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    bannerId: {
        type: Schema.Types.ObjectId,
        ref: 'Banners'
    },
    offerId: {
        type: Schema.Types.ObjectId,
        ref: 'Offers'
    },
    paymentType: {
        type: String,
        default: ""
    },
    amount: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: "INR"
    },
    orderId: {
        type: String,
        default: ""
    },
    transactionId: {
        type: String,
        default: ""
    },
    packageExpired: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    discountUpto: {
        type: Number,
        default: 0
    },
    isPurchasedBysubscription: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
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
    }
}, {
    timestamps: true,
    strict: true,
    collection: "offerOrders",
    versionKey: false
})

exports.Offer_Order_Model = mongoose.model('offerOrders', orderSchema);
