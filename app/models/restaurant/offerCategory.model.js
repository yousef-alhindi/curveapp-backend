const mongoose = require('mongoose')
const { Schema } = mongoose

const offerCategorySchema = new Schema({
    restId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    paymentType: {
        type: String,
        default: "card"
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
    isActive: {
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
    collection: "offerCategories",
    versionKey: false
})

exports.Offer_Category_Model = mongoose.model('offerCategories', offerCategorySchema)