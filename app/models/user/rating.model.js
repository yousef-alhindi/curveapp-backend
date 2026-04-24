const mongoose = require('mongoose')
const { Schema } = mongoose

const itemSchema = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
    },
    rating: {
        type: String, // "like", "unlike", or "neutral"
        enum: ["like", "unlike", "neutral"], // allows for a neutral state
        default: "neutral",
    }
});

const ratingSchema = new Schema({
    restId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    },
    gymId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gym"
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GymSubscriptions"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    star: {
        type: Number,
        default: 0,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    items: [itemSchema],
    review: {
        type: String,
        default: ''
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
    },
}, {
    strict: true,
    collection: "Rating",
    timestamps: true,
    versionKey: false
})

exports.RATING_MODEL = mongoose.model("Rating", ratingSchema);

