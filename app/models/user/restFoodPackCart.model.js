const mongoose = require('mongoose');
const { Schema } = mongoose;
const {duration } = require('../../constants/foodPackage.constants');

const cartSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    restId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
    },
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'restaurantPackage',
    },
    duration:{
        type: Number,
        enum: duration, // WEEKLY: 1, MONTHLY: 2
    },
    amount: {
        type: Number,
        default: 0,
    },
    status: {
        type: Number,
        default: 1  // active : 1 / inactive :0
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
    collection: "foodPackCart",
    timestamps: true,
})

exports.Food_Pack_Cart_Model = mongoose.model("foodPackCart", cartSchema);

