const mongoose = require('mongoose')
const { Schema } = mongoose

const supOfferCategorySchema = new Schema({
    supplementSeller: {
        type: Schema.Types.ObjectId,
        ref: 'SupplementSeller'
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
    collection: "supOfferCategories",
    versionKey: false
})

exports.Sup_Offer_Category_Model = mongoose.model('supOfferCategories', supOfferCategorySchema)