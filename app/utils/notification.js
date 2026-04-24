import firebase from 'firebase-admin';
import { notificationModel } from "../models/admin/notification.model.js"
import { NotificationSend, NotificationType } from '../constants/notification.constants.js';
import UserModel from "../models/user/user.model.js";
import { RestaurantModel } from "../models/restaurant/restaurant.model.js";
import { SupplementSellerModel } from '../models/supplement/supplementSeller.model.js';
import { GymModel } from "../models/gym/gym.model.js";
import { Delivery_Model } from "../models/delivery/delivery.model.js"
import service_account from "../config/curve-user-firebase-adminsdk-spczx-6bcc67371c.json" with { type: "json" };


firebase.initializeApp({
    credential: firebase.credential.cert(service_account)
});

export const sendMultipleNotification = async (registrationTokens, title, body, type, id) => {
    const messages = registrationTokens.map((token) => {
        const message = {
            token,
            notification: { title, body },
            data: { type: `${type}`, id: `${id}` },
        };

        return message;
    });

    try {
        const results = await Promise.all(
            messages.map((msg) => firebase.messaging().send(msg))
        );
        console.log("Firebase Responses:", results);
    } catch (err) {
        console.error("Error in sending notifications:", err);
    }
};

export const sendSingleNotification = async (registrationToken, title, body, type, id) => {
    const message = {
        token: registrationToken,
        notification: { title, body },
        data: { type: `${type}`, id: `${id}` },
    };

    try {
        console.log("message", message)
        const res = await firebase.messaging().send(message);
        console.log("Single notification sent success:", res);
    } catch (err) {
        console.error("Error sending single notification:", err);
    }
};

export const saveNotification = async (
    userId = [],
    restaurantId = [],
    sellerId = [],
    gymId = [],
    deliveryId = [],
    title = "",
    description = "",
    sendFrom,
    sendTo,
    id = "",
    type = NotificationType.ADMIN,
) => {
    try {
        const notification = new notificationModel({
            notification_type: 2,
            user: userId,
            restaurant: restaurantId,
            seller: sellerId,
            gym: gymId,
            delivery: deliveryId,
            title,
            description,
            sendFrom,
            sendTo,
            id,
            type
        });

        await notification.save();

        let deviceTokens = [];

        if (sendTo === NotificationSend.USER) {
            const users = await UserModel.find({ _id: { $in: userId } }, { deviceToken: 1 }).lean();
            deviceTokens.push(...users.filter(u => u.deviceToken).map(u => u.deviceToken));
        }

        if (sendTo === NotificationSend.RESTAURANT) {
            const restaurants = await RestaurantModel.find({ _id: { $in: restaurantId } }, { deviceToken: 1 }).lean();
            deviceTokens.push(...restaurants.filter(p => p.deviceToken).map(p => p.deviceToken));
        }

        if (sendTo === NotificationSend.SUPPLEMENTSELLER) {
            const sellers = await SupplementSellerModel.find({ _id: { $in: sellerId } }, { deviceToken: 1 }).lean();
            deviceTokens.push(...sellers.filter(p => p.deviceToken).map(p => p.deviceToken));
        }

        if (sendTo === NotificationSend.GYM) {
            const gyms = await GymModel.find({ _id: { $in: gymId } }, { deviceToken: 1 }).lean();
            deviceTokens.push(...gyms.filter(p => p.deviceToken).map(p => p.deviceToken));
        }

        if (sendTo === NotificationSend.DELIVERYDRIVER) {
            const delivery = await Delivery_Model.find({ _id: { $in: deliveryId } }, { deviceToken: 1 }).lean();
            deviceTokens.push(...delivery.filter(p => p.deviceToken).map(p => p.deviceToken));
        }

        deviceTokens = [...new Set(deviceTokens)].filter(Boolean);

        if (deviceTokens.length === 0) {
            console.warn("No valid device tokens found for notification");
            return true;
        }

        if (deviceTokens.length === 1) {
            await sendSingleNotification(deviceTokens[0], title, description, type, id);
        } else {
            await sendMultipleNotification(deviceTokens, title, description, type, id);
        }

        return true;

    } catch (error) {
        console.error("Error saving notification:", error);
        return { success: false, message: error.message };
    }
};
