import mongoose from 'mongoose';
import { NotificationSend, NotificationType } from '../../constants/notification.constants';

const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        id: {
            type: String,
            default: ""
        },
        user: [{
            type: mongoose.Types.ObjectId,
            ref: "User",
            default: null
        }],
        restaurant: [{
            type: mongoose.Types.ObjectId,
            ref: "Restaurant",
            default: null
        }],
        seller: [{
            type: mongoose.Types.ObjectId,
            ref: "Supplement",
            default: null
        }],
        gym: [{
            type: mongoose.Types.ObjectId,
            ref: "Gym",
            default: null
        }],
        delivery: [{
            type: mongoose.Types.ObjectId,
            ref: "Delivery",
            default: null
        }],
        type: {
            type: Number,
            default: NotificationType.ADMIN,
            enum: NotificationType
        },
        sendFrom: {
            type: Number,
            default: "",
            enum: Object.values(NotificationSend)
        },
        notification_type: {
            type: Number,
            default: 1, // 1-receive. 2-send
        },
        sendTo: {
            type: Number,
            default: "",
            enum: Object.values(NotificationSend)
        },
        userRead: [{
            type: mongoose.Types.ObjectId,
            ref: "User",
            default: null
        }],
        restaurantRead: [{
            type: mongoose.Types.ObjectId,
            ref: "Restaurant",
            default: null
        }],
        sellerRead: [{
            type: mongoose.Types.ObjectId,
            ref: "Supplement",
            default: null
        }],
        gymRead: [{
            type: mongoose.Types.ObjectId,
            ref: "Gym",
            default: null
        }],
        deliveryRead: [{
            type: mongoose.Types.ObjectId,
            ref: "Delivery",
            default: null
        }],
        createdAt: {
            type: Number,
            default: () => new Date().getTime(),
        },
        updatedAt: {
            type: Number,
            default: () => new Date().getTime(),
        },
    },
    {
        strict: true,
        collection: 'notification',
        versionKey: false,
        timestamps: false,
    }
);

exports.notificationModel = mongoose.model('notification', notificationSchema);
