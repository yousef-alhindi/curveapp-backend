import mongoose from 'mongoose';
import { paymentMethod } from '../../constants/order.constants';
import crypto from "crypto";

const gymSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    gymCartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymCart',
        required: true,
    },
    gymId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true,
    },
    promoCodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "gymOfferOrders",
    },
    subscriptionId: {
        type: String,
        unique: true,
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    paymentMethod: {
        type: Number,
        enum: Object.values(paymentMethod),
        default: paymentMethod.APPLEPAY,
    },
    paymentId: {
        type: String,
        default: 's3rcn4b3ba465k6k6hh5n4',
    },
    startDate: {
        type: Number
    },
    endDate: {
        type: Number
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Number,
        default: () => new Date().getTime(),
    },
    updatedAt: {
        type: Number,
        default: () => new Date().getTime(),
    },
}, { collection: "GymSubscriptions" });

function generateUniqueString() {
    return crypto.randomBytes(4).toString('hex').slice(0, 7).toUpperCase();
}

gymSubscriptionSchema.pre('save', async function (next) {
    if (!this.subscriptionId) {
        let unique = false;
        let generatedId;
        while (!unique) {
            generatedId = generateUniqueString();
            const existingSubscription = await this.constructor.findOne({ subscriptionId: generatedId });
            if (!existingSubscription) unique = true;
        }
        this.subscriptionId = generatedId;
    }
    next();
});

const GymSubscriptions = mongoose.model('GymSubscriptions', gymSubscriptionSchema);
export default GymSubscriptions;
