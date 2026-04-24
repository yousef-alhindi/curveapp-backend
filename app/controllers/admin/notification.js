import { notificationModel } from "../../models/admin/notification.model.js"
import { NotificationSend, NotificationType } from "../../constants/notification.constants.js";
import UserModel from "../../models/user/user.model.js";
import { RestaurantModel } from "../../models/restaurant/restaurant.model.js";
import { SupplementSellerModel } from '../../models/supplement/supplementSeller.model.js';
import { GymModel } from "../../models/gym/gym.model.js";
import { Delivery_Model } from "../../models/delivery/delivery.model.js"
import { sendErrorResponse, sendSuccessResponse } from "../../responses/response.js";
import { saveNotification } from "../../utils/notification.js";

// export const notificationSend = async (req, res) => {
//     try {
//         const {
//             userId = [],
//             restaurantId = [],
//             sellerId = [],
//             gymId = [],
//             deliveryId = [],
//             title = "",
//             description = "",
//             id = "",
//             type = NotificationType.ADMIN,
//         } = req.body;

//         if ( !userId.length && !restaurantId.length && !sellerId.length && !gymId.length && !deliveryId.length) {
//             return sendErrorResponse(res, "Please provide at least one recipient", 400);
//         }

//         const sendFrom = NotificationSend.ADMIN;

//         // let sendTo = [];
//         // if (userId.length) sendTo.push(NotificationSend.USER);
//         // if (restaurantId.length) sendTo.push(NotificationSend.RESTAURANT);
//         // if (sellerId.length) sendTo.push(NotificationSend.SUPPLEMENTSELLER);
//         // if (gymId.length) sendTo.push(NotificationSend.GYM);
//         // if (deliveryId.length) sendTo.push(NotificationSend.DELIVERYDRIVER);
        
//         // Send separately per recipient type
//         if (userId.length) {
//             await saveNotification(userId, [], [], [], [], title, description, sendFrom, NotificationSend.USER, id, type);
//         }
//         if (restaurantId.length) {
//             await saveNotification([], restaurantId, [], [], [], title, description, sendFrom, NotificationSend.RESTAURANT, id, type);
//         }
//         if (sellerId.length) {
//             await saveNotification([], [], sellerId, [], [], title, description, sendFrom, NotificationSend.SUPPLEMENTSELLER, id, type);
//         }
//         if (gymId.length) {
//             await saveNotification([], [], [], gymId, [], title, description, sendFrom, NotificationSend.GYM, id, type);
//         }
//         if (deliveryId.length) {
//             await saveNotification([], [], [], [], deliveryId, title, description, sendFrom, NotificationSend.DELIVERYDRIVER, id, type);
//         }


//         await saveNotification(userId, restaurantId, sellerId, gymId, deliveryId, title, description,
//             sendFrom, sendTo, id, type);
//         return sendSuccessResponse(res, "Notification sent successfully", 200);
//     } catch (err) {

//     }
// };
export const notificationSend = async (req, res) => {
  try {
    const {
      userId = [],
      restaurantId = [],
      sellerId = [],
      gymId = [],
      deliveryId = [],
      title = "",
      description = "",
      id = "",
      type = NotificationType.ADMIN,
    } = req.body;

    if (
      !userId.length &&
      !restaurantId.length &&
      !sellerId.length &&
      !gymId.length &&
      !deliveryId.length
    ) {
      return sendErrorResponse(res, "Please provide at least one recipient", 400);
    }

    const sendFrom = NotificationSend.ADMIN;

    if (userId.length) {
      await saveNotification(
        userId, [], [], [], [],
        title, description, sendFrom, NotificationSend.USER, id, type
      );
    }

    if (restaurantId.length) {
      await saveNotification(
        [], restaurantId, [], [], [],
        title, description, sendFrom, NotificationSend.RESTAURANT, id, type
      );
    }

    if (sellerId.length) {
      await saveNotification(
        [], [], sellerId, [], [],
        title, description, sendFrom, NotificationSend.SUPPLEMENTSELLER, id, type
      );
    }

    if (gymId.length) {
      await saveNotification(
        [], [], [], gymId, [],
        title, description, sendFrom, NotificationSend.GYM, id, type
      );
    }

    if (deliveryId.length) {
      await saveNotification(
        [], [], [], [], deliveryId,
        title, description, sendFrom, NotificationSend.DELIVERYDRIVER, id, type
      );
    }

    return sendSuccessResponse(res, {}, "Notification sent successfully", 200);

  } catch (err) {
    console.error("Error in notificationSend:", err);
    return sendErrorResponse(res, "Something went wrong while sending notification", 500);
  }
};

export const notificationList = async (req, res) => {
  try {
    const { notification_type } = req.query;

    const notificationType = notification_type ? parseInt(notification_type, 10) : null;

    if (isNaN(notificationType)) {
      return sendErrorResponse(res, "Invalid or missing notification type", 400);
    }

    const notifications = await notificationModel
      .find({ notification_type: notificationType })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccessResponse(res, notifications, "Success", 200);
  } catch (error) {
    console.error("Error in notificationList:", error);
    return sendErrorResponse(res, error.message, 500);
  }
};


export const getAllUser = async (req, res) => {
    try {
        const data = await UserModel.find({ isBlocked: false }).select('fullName countryCode mobileNumber').lean();

        if (!data) {
            return sendSuccessResponse(res, [], "No user found", 404)
        }
        return sendSuccessResponse(res, data, "All user fetched successfully", 200)
    } catch (error) {
        sendErrorResponse(res, error.message, 500);
    }
};

export const getAllRestaurant = async (req, res) => {
    try {
        const data = await RestaurantModel.find({ isBlocked: false }).select('resName countryCode mobileNumber').lean()
        if (!data) {
            return sendSuccessResponse(res, [], "No restaurant found", 404)
        }
        return sendSuccessResponse(res, data, "All restaurant fetched successfully", 200)
    } catch (error) {
        sendErrorResponse(res, error.message, 500);
    }
};

export const getAllSupplementSeller = async (req, res) => {
    try {
        const data = await SupplementSellerModel.find({ isBlocked: false }).select('name countryCode mobileNumber').lean()
        if (!data) {
            return sendSuccessResponse(res, [], "No Seller found", 404)
        }
        return sendSuccessResponse(res, data, "All supplement Seller fetched successfully", 200)
    } catch (error) {
        sendErrorResponse(res, error.message, 500);
    }
};

export const getAllGym = async (req, res) => {
    try {
        const data = await GymModel.find({ isBlocked: false }).select('name countryCode mobileNumber').lean()
        if (!data) {
            return sendSuccessResponse(res, [], "No gym found", 404)
        }
        return sendSuccessResponse(res, data, "All gym fetched successfully", 200)
    } catch (error) {
        sendErrorResponse(res, error.message, 500);
    }
};

export const getAllDelivery = async (req, res) => {
    try {
        const data = await Delivery_Model.find({ isBlocked: false }).select('name countryCode mobileNumber').lean()
        if (!data) {
            return sendSuccessResponse(res, [], "No delivery driver found", 404)
        }
        return sendSuccessResponse(res, data, "All delivery driver fetched successfully", 200)
    } catch (error) {
        sendErrorResponse(res, error.message, 500);
    }
};