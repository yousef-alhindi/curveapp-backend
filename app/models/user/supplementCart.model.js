const mongoose = require('mongoose');
const { Schema } = mongoose;
import { deliveryOption } from '../../constants/cart.constants';

const itemSchema = new Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplement',
    },
    stockId :{
        type: mongoose.Schema.Types.ObjectId
    },
    quantity: {
        type: Number,
        default: 1,
    },
    amount: {
        type: Number,
        default: 0,
    }
});

const bundleSchema = new Schema({
    bundleId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplementPkg',
    },
    quantity: {
        type: Number,
        default: 1,
    },
    amount: {
        type: Number,
        default: 0,
    }
})

const cartSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    supplementSeller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplementSeller',
    },
    items: [itemSchema],
    bundles : [bundleSchema],
    status: {
        type: Number,
        default: 1  // active : 1 / inactive :0
    },
    amount: {
        type: Number,
        default: 0,
    },
    deliveryOption: {
        type: Number,
        default: 1,
        enum: Object.values(deliveryOption),
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
}, {
    collection: "supplementCarts",
    timestamps: true,
})

exports.SupplementCartModel = mongoose.model("supplementCarts", cartSchema);

