const mongoose = require('mongoose');
const { Schema } = mongoose;
const { duration } = require('../../constants/foodPackage.constants');

const cartSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    gymId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
    },
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymPkg',
    },
    duration: {
        type: Number,
        enum: [1, 3, 6, 12]
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
    collection: "GymCart",
    timestamps: true,
})

exports.GymCartModel = mongoose.model("GymCart", cartSchema);

