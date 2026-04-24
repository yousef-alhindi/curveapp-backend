const mongoose = require('mongoose');
const { Schema } = mongoose;
import { deliveryOption } from '../../constants/cart.constants';

const itemSchema = new Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
    },
    quantity: {
        type: Number,
        default: 1,
    },
    amount: {
        type: Number,
        default: 0,
    },
    instructions: {
        type: String,
        default: "",
    },
    isCustomize: {
        type: Boolean,
        default: false,
    },
    customize: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomiseItem',
    }],
});

const cartSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    restId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
    },
    items: [itemSchema],
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
    collection: "restaurentCarts",
    timestamps: true,
})

exports.Restaurant_Cart_Model = mongoose.model("restaurentCarts", cartSchema);

