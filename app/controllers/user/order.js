import AddressModel from '../../models/user/address.model';
import { Offer_Order_Model } from '../../models/restaurant/offerOrder.model';
import UserModel from '../../models/user/user.model';
import OrderModel from '../../models/user/order.model';
import { getKmRange } from '../../utils/helper';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { DeliveryFare_Model } from '../../models/admin/deliveryFare.model';
import { ServiceType } from '../../constants/service.constants';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';
import { RATING_MODEL } from '../../models/user/rating.model';
import { orderType, status } from '../../constants/order.constants';
import orderDeliveryModel from '../../models/delivery/orderDelivery.model'
import { Food_Pack_Cart_Model } from '../../models/user/restFoodPackCart.model';
import PackageOrderModel from '../../models/user/packageOrder.model';
import cron from 'node-cron'
import { RestaurantPackageModel } from '../../models/restaurant/restaurantPackage';
import { REST_PACK_RATING_MODEL } from '../../models/user/restPackageRating.model';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import * as commonService from '../../services/common/common.service';
import { success, error } from '../../responses/messages';
import HttpStatus from 'http-status-codes';
import { AdminFoodPackCartModel } from '../../models/user/adminFoodPackCart.model';
import AdminPackageOrderModel from '../../models/user/adminPackageOrder.model';
import OrderDeliveryModel from '../../models/delivery/orderDelivery.model';
const mongoose = require('mongoose'); // mongoose database
const crypto = require('crypto');

export const getOrdersByUserId = async (req, res) => {
   try {
      const { userId, filterBy } = req.params;
      const { accesstoken } = req.headers;   
      let user = null;
      if (accesstoken) {
         user = await UserModel.findOne({ accessToken: accesstoken });

         if (!user || user._id.toString() !== userId) {
            return res.status(404).json({ message: 'Invalid User ID or expired access Token' });
         }
      }

      // const { accesstoken } = req.headers;

      // let user = await UserModel.findOne({ accessToken: accesstoken });

      // if (user === null || user._id.toString() !== userId) {
      //    return res.status(404).json({ message: 'Invalid User ID or expired access Token' });
      // }

      // const validFilters = ["scheduled", "ongoing", "past","all",""];

      // if (!validFilters.includes(filterBy)) {
      //    return res.status(400).json({ message: 'filterBy is required' });
      // }

      const baseMatch = { userId: new mongoose.Types.ObjectId(userId), isDeleted: false };

      // Adjust $match based on the filter
      switch (filterBy) {
         case "scheduled":
            baseMatch.orderType = orderType.SCHEDULED;
            baseMatch.$or = [{ scheduledDate: { $gte: new Date() } }];
            break;
         case "ongoing":
            baseMatch.status = { $nin: [status.PENDING, status.DELIVERED, status.CANCEL] };
            break;
         case "past":
            baseMatch.status = { $in: [status.DELIVERED, status.CANCEL] };
            break;
      }

      // Build the aggregation pipeline
      const pipeline = [
         { $match: baseMatch },
         {
            $lookup: {
               from: 'restaurentCarts',
               localField: 'restaurentCartId',
               foreignField: '_id',
               as: 'restaurentCartId',
            },
         },
         { $unwind: '$restaurentCartId' },
         {
            $lookup: {
               from: 'addresses',
               localField: 'addressId',
               foreignField: '_id',
               as: 'addressId',
            },
         },
         { $unwind: '$addressId' },
         {
            $lookup: {
               from: 'Restaurant',
               localField: 'restaurentCartId.restId',
               foreignField: '_id',
               as: 'restaurant',
            },
         },
         { $unwind: '$restaurant' },
         {
            $lookup: {
               from: 'Cuisine', // resCategory
               localField: 'restaurant.resCategory',
               foreignField: '_id',
               as: 'restaurant.resCategory',
            },
         },
         {
            $lookup: {
               from: 'Rating',
               localField: '_id',
               foreignField: 'orderId',
               as: 'rating',
            },
         },
         {
            $unwind: {
               path: '$rating',
               preserveNullAndEmptyArrays: true, // This will keep documents without a matching rating
            },
         },
         //     {
         //       $unwind: {
         //           path: '$rating.items',
         //           preserveNullAndEmptyArrays: true, // Preserve if items are empty
         //       },
         //   },
         {
            $lookup: {
               from: 'MenuItem',
               localField: 'rating.items._id',
               foreignField: '_id',
               as: 'itemDetails',
            },
         },
         {
            $unwind: {
               path: '$itemDetails',
               preserveNullAndEmptyArrays: true, // Keep documents without matching items
            },
         },
         {
            $addFields: {
               'rating.items.name': '$itemDetails.name', // Add the item name to the rating.items
            },
         },
         //{ $unwind: '$rating.items' },
         {
            $group: {
               _id: '$_id', // Group by the main document ID
               userId: { $first: '$userId' },
               restaurentCartId: { $first: '$restaurentCartId' },
               addressId: { $first: '$addressId' },
               orderId: { $first: '$orderId' },
               orderType: { $first: '$orderType' },
               scheduledDate: { $first: '$scheduledDate' },
               totalItemAmount: { $first: '$totalItemAmount' },
               deliveryAmount: { $first: '$deliveryAmount' },
               totalAmount: { $first: '$totalAmount' },
               discountedAmount: { $first: '$discountedAmount' },
               promoCodeId: { $first: '$promoCodeId' },
               paymentMethod: { $first: '$paymentMethod' },
               paymentId: { $first: '$paymentId' },
               anySuggestion: { $first: '$anySuggestion' },
               status: { $first: '$status' },
               deliveryOption: { $first: '$deliveryOption' },
               isDeleted: { $first: '$isDeleted' },
               cancellationReason: { $first: '$cancellationReason' },
               cancellationDate: { $first: '$cancellationDate' },
               createdAt: { $first: '$createdAt' },
               updatedAt: { $first: '$updatedAt' },
               restaurant: { $first: '$restaurant' },
               rating: { $first: '$rating' }, // Make sure to include the modified rating
            },
         },
         {
            $addFields: {
               'rating.items': {
                  $cond: {
                     if: { $isArray: '$rating.items' },
                     then: '$rating.items',
                     else: [],
                  },
               },
            },
         },
         { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      ];


      const orders = await OrderModel.aggregate(pipeline);

      if (orders.length === 0) {
         //return res.status(200).json({ status: true,  message: 'No orders found for this user',data:{} });
         return res.status(200).json({ status: true, message: 'No orders found for this user', data: [] });
      } else {
         return res.status(200).json({ status: true, message: "Orders Fetched succesfully", data: orders });
      }
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getOrderById = async (req, res) => {
   try {
      const { id } = req.params;
      let order = await OrderModel.findById(id)
         .populate('userId')
         .populate({
            path: 'restaurentCartId',
            populate: [
               {
                  path: 'restId',
                  populate: 'resCategory'
               },
               {
                  path: 'items.itemId', // Populate itemId in the items array
                  model: 'MenuItem',    // Specify the model for itemId
                  select: 'name'
               }
            ],
         })
         .populate('addressId');

      if (!order) {
         return res.status(404).json({ status: false, message: 'Order not found', data: {} });
      }

      let rating = await RATING_MODEL.findOne({ orderId: order._id })
         .populate({
            path: 'items._id',
            select: 'name'
         });

      let ratingOBJ;
      if (rating) {
         let data = []
         rating.items.map((item) => {
            data.push({ _id: item._id._id, name: item._id.name, rating: item.rating })
         })

         ratingOBJ = {
            "_id": rating._id,
            "restId": rating.restId,
            "userId": rating.userId,
            "star": rating.star,
            "orderId": rating.orderId,
            "items": data,
            "review": rating.review,
            "status": rating.status,
            "isDeleted": rating.isDeleted,
         }

      }

      let deliveryData = await orderDeliveryModel.findOne({ orderId: new mongoose.Types.ObjectId(id) })
         .populate({
            path: 'deliveryBoyId',
            select: 'name countryCode mobileNumber profileImage location rating'
         })

      let averageRating = 0

      if (deliveryData && deliveryData.deliveryBoyId) {
         let orders = await orderDeliveryModel.find({ deliveryBoyId: deliveryData.deliveryBoyId._id, deliveryBoyRating: { $ne: 0 } });

         if (orders.length > 0) {
            let totalRating = orders.reduce((sum, order) => sum + order.deliveryBoyRating ? order.deliveryBoyRating : 0, 0);
            averageRating = totalRating / orders.length;
         }

         deliveryData.deliveryBoyRating = averageRating;
      }

      const response = {
         ...order.toObject(), // Convert Mongoose document to plain object
         rating: rating ? ratingOBJ : null, // Add the rating object to the response
         deliveryData: deliveryData ? deliveryData : null
      };
      return res.status(200).json({ status: true, message: "Order Data", data: response });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const createOrder = async (req, res) => {
   try {
      let {
         userId,
         restaurentCartId,
         addressId,
         orderType,
         deliveryOption,
         scheduledDate,
         promoCodeId, //66da2f3abb6eabf3cfaf999b
         paymentMethod,
         paymentId,
         anySuggestion,
      } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }
      const cart = await Restaurant_Cart_Model.findById(restaurentCartId).populate('items.itemId');

      if (!cart || cart.items.length === 0) {
         return res.status(404).json({ message: 'Cart is empty or not found' });
      }

      const orderExisted = await OrderModel.find({ restaurentCartId: new mongoose.Types.ObjectId(restaurentCartId) });

      if (orderExisted.length > 0) {
         return res.status(409).json({ message: 'Order has already been created for this cart.' }); // conflict
      }

      const address = await AddressModel.findById(addressId);
      if (!address) {
         return res.status(404).json({ message: 'Address not found' });
      }
      const rest = await RestaurantModel.findById(cart.restId);
      if (!rest) {
         return res.status(404).json({ message: 'Restaurant not found' });
      }

      const offerOrders = await Offer_Order_Model.find({ restId: cart.restId }).populate('offerId');
      if (offerOrders.length === 0 && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'No offer orders found for this restaurant' });
      }

      const specificOfferOrders = offerOrders.find(
         (offerOrder) => offerOrder.offerId._id.toString() === promoCodeId //e.g.:  "66da2f3abb6eabf3cfaf999b"
      );
      if (!specificOfferOrders && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'Promo code is invalid or not applicable' });
      }

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER });
      // Calculate total Amount
      const deliveryAmount =
         Number(deliveryFareResp?.baseFare || 0) +
         getKmRange(
            address.location.coordinates[0],
            address.location.coordinates[1],
            rest.location.coordinates[0],
            rest.location.coordinates[1]
         ) *
         (deliveryFareResp.perKmFare || 1);

      let totalAmount = cart.amount;

      let discount;
      if (promoCodeId !== null && promoCodeId !== "") {
         const discountType = specificOfferOrders.offerId.discountType;
         if (discountType === 0) {
            // No Discount
            discount = 0;
         } else if (discountType === 1) {
            // Flat discount
            discount = specificOfferOrders.offerId.flatDiscountValue;
            totalAmount -= discount;
         } else if (discountType === 2) {
            // Percentage discount
            const percentDiscount = (totalAmount * specificOfferOrders.offerId.percentDiscountValue) / 100;
            discount = Math.min(percentDiscount, specificOfferOrders.offerId.discountUpto);
            totalAmount -= discount;
         }
      }

      totalAmount = Math.max(Math.round((totalAmount + deliveryAmount) * 100) / 100, 0); // Round to 2 decimal places

      function generateOrderId(length = 8) {
         return crypto.randomBytes(length)
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
            .substring(0, length);         // Ensure it's exactly 8 characters
      }

      // Function to check if the orderId exists in the database
      async function isOrderIdUnique(orderId) {
         const existingOrder = await OrderModel.findOne({ orderId });
         return !existingOrder;  // Returns true if orderId is unique
      }

      // Generate unique orderId by checking in the database
      async function generateUniqueOrderId() {
         let orderId;
         let isUnique = false;

         // Loop until we find a unique orderId
         while (!isUnique) {
            orderId = generateOrderId();
            isUnique = await isOrderIdUnique(orderId);
         }

         return orderId;
      }



      const orderData = {
         userId,
         restaurentCartId,
         addressId,
         orderType: orderType || (scheduledDate ? 1 : 2), // 1 for scheduled, 2 for takeaway
         scheduledDate: scheduledDate || null,
         deliveryAmount,
         discountedAmount: discount,
         totalAmount,
         promoCodeId,
         deliveryOption,
         paymentMethod: paymentMethod,
         paymentId: paymentId,
         anySuggestion: anySuggestion || '',
         status: 1,
         orderId: await generateUniqueOrderId()
      };

      const newOrder = new OrderModel(orderData);
      const orderCreated = await newOrder.save();


      if (orderCreated) {
         const updateCartData = await Restaurant_Cart_Model.findByIdAndUpdate(restaurentCartId,
            { $set: { status: 0 } },
            { new: true }
         )
         console.log(`Cart "${updateCartData._id}" removed from user side `)
      }

      await OrderDeliveryModel.create({ orderId: newOrder._id, restId: cart.restId })
      return res.status(201).json({ success: true, message: 'Order created successfully', data: orderData });
   } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
   }
};

export const cancelOrder = async (req, res) => {
   const { orderId } = req.params;
   const { cancellationReason } = req.body;

   try {
      if (!cancellationReason || cancellationReason.trim() === '') {
         return res.status(400).json({ message: 'Cancellation reason is required' });
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
         return res.status(404).json({ message: 'Order not found' });
      }

      // Check if the order is already canceled
      if (order.status === 5) {
         return res.status(400).json({ message: 'Order is already canceled' });
      }
      order.status = 5
      //order.isDeleted = true;
      order.cancellationReason = cancellationReason;
      order.cancellationDate = new Date();

      await order.save();

      res.status(200).json({ status: true, message: 'Order canceled successfully', data: {} });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

// get Filtered Orders
export const getFilteredOrders = async (req, res) => {
   const { filterBy, userId } = req.params;

   const validFilters = ["scheduled", "ongoing", "past"];

   if (!validFilters.includes(filterBy)) {
      return res.status(400).json({ message: 'filterBy is required' });
   }
   try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      let orders;

      if (filterBy === "scheduled") {
         orders = await OrderModel.find({
            userId: userObjectId,
            orderType: orderType.SCHEDULED,
            $or: [
               { scheduledDate: { $gte: new Date() } }, // Future scheduled orders
            ]
         }).sort({ createdAt: -1 });

      } else if (filterBy === "ongoing") {
         orders = await OrderModel.find({
            userId: userObjectId,
            status: { $nin: [status.PENDING, status.DELIVERED, status.CANCEL] }
         }).sort({ createdAt: -1 });

      } else if (filterBy === "past") { // Past orders
         orders = await OrderModel.find({
            userId: userObjectId,
            status: { $in: [status.DELIVERED, status.CANCEL] }
         }).sort({ createdAt: -1 });
      }

      let message;
      if (orders.length < 1) {
         message = "Orders not available"
      } else {
         message = "Orders filtered succesfully"
      }

      res.status(200).json({ status: true, message, data: orders });

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const deliveryDetailsByOrderId = async (req, res) => {
   try {
      const { orderId } = req.params;

      const deliveryDetails = await orderDeliveryModel.findOne({ orderId: new mongoose.Types.ObjectId(orderId) })
         .populate({
            path: 'deliveryBoyId',
            select: 'name countryCode mobileNumber profileImage location',
         })
      res.status(200).json({ status: true, message: "Delivery Data", data: deliveryDetails });
   } catch (error) {
      res.status(500).json({ status: false, message: error.message });
   }
}

export const createPackageOrder = async (req, res) => {
   try {
      let {
         userId,
         restaurentCartId,
         addressId,
         promoCodeId, //66da2f3abb6eabf3cfaf999b
         paymentMethod,
         paymentId,
         packageType,
         duration,
         startDate,
         time,
         anySuggestion
      } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }
      const cart = await Food_Pack_Cart_Model.findById(restaurentCartId).populate('packageId');

      if (!cart) {
         return res.status(404).json({ message: 'Cart is not found' });
      }

      cart.packageId.categories.forEach(category => {
         category.totalItems = category.totalItems[0]
      })

      let packageDetails = {
         categories: cart.packageId.categories
      }
      if (!startDate || startDate.toString().length < 10) {
         return res.status(409).json({ message: 'start Date required ' }); // conflict
      }
      if (!time || time.toString().length < 10) {
         return res.status(409).json({ message: 'time is required' }); // conflict
      }

      const orderExisted = await PackageOrderModel.find({ restaurentCartId: new mongoose.Types.ObjectId(restaurentCartId) });

      if (orderExisted.length > 0) {
         return res.status(409).json({ message: 'Order has already been created for this cart.' }); // conflict
      }

      const address = await AddressModel.findById(addressId);
      if (!address) {
         return res.status(404).json({ message: 'Address not found' });
      }
      const rest = await RestaurantModel.findById(cart.restId);
      if (!rest) {
         return res.status(404).json({ message: 'Restaurant not found' });
      }

      let dayNumber = new Date(startDate).getDay();

      // Map the day number to a day name (e.g., "Monday", "Tuesday")
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      let dayName = daysOfWeek[dayNumber];
      // Check if the day is in the workingDays array

      if (rest.documents.workingDays.includes(dayName)) {
         console.log(`${dayName} is a working day.`);
      } else {
         console.log(`${dayName} is not a working day.`);
         return res.status(409).json({
            message: `${rest.resName} is closed on this day ${new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} (${dayName}).`
         });

      }

      const offerOrders = await Offer_Order_Model.find({ restId: cart.restId }).populate('offerId');
      if (offerOrders.length === 0 && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'No offer orders found for this restaurant' });
      }

      const specificOfferOrders = offerOrders.find(
         (offerOrder) => offerOrder.offerId._id.toString() === promoCodeId //e.g.:  "66da2f3abb6eabf3cfaf999b"
      );
      if (!specificOfferOrders && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'Promo code is invalid or not applicable' });
      }

      // const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER });
      // // Calculate total Amount
      // let deliveryAmount =
      //    Number(deliveryFareResp?.baseFare || 0) +
      //    getKmRange(
      //       address.location.coordinates[0],
      //       address.location.coordinates[1],
      //       rest.location.coordinates[0],
      //       rest.location.coordinates[1]
      //    ) *
      //       (deliveryFareResp.perKmFare || 1);
      let dates = [];
      if (duration === 1) { // WEEKLY: 1, MONTHLY: 2
         //deliveryAmount = deliveryAmount * 7;
         // if (in seconds)Multiply by 1000 to convert seconds to milliseconds
         let startDate = new Date(req.body.startDate);
         let newDate = new Date(startDate); // Clone the startDate object for manipulation 
         dates.push({ date: newDate.getTime() })
         for (let i = 0; i < 6; i++) {
            newDate.setDate(newDate.getDate() + 1); // Increment the day by 1 for each iteration
            dates.push({ date: newDate.getTime() }); // Push the timestamp in milliseconds
         }
      } else if (duration === 2) {
         //deliveryAmount = deliveryAmount * 30;
         // if (in seconds)Multiply by 1000 to convert seconds to milliseconds
         let startDate = new Date(req.body.startDate);
         let newDate = new Date(startDate); // Clone the startDate object for manipulation      
         dates.push({ date: newDate.getTime() })
         for (let i = 0; i < 29; i++) {
            newDate.setDate(newDate.getDate() + 1); // Increment the day by 1 for each iteration
            dates.push({ date: newDate.getTime() }); // Push the timestamp in milliseconds
         }
      }

      let totalAmount = cart.amount;

      let discount;
      if (promoCodeId !== null && promoCodeId !== "") {
         const discountType = specificOfferOrders.offerId.discountType;
         if (discountType === 0) {
            // No Discount
            discount = 0;
         } else if (discountType === 1) {
            // Flat discount
            discount = specificOfferOrders.offerId.flatDiscountValue;
            totalAmount -= discount;
         } else if (discountType === 2) {
            // Percentage discount
            const percentDiscount = (totalAmount * specificOfferOrders.offerId.percentDiscountValue) / 100;
            discount = Math.min(percentDiscount, specificOfferOrders.offerId.discountUpto);
            totalAmount -= discount;
         }
      }

      //totalAmount = Math.max(Math.round((totalAmount + deliveryAmount) * 100) / 100, 0); // Round to 2 decimal places

      function generateOrderId(length = 8) {
         return crypto.randomBytes(length)
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
            .substring(0, length);         // Ensure it's exactly 8 characters
      }

      // Function to check if the orderId exists in the database
      async function isOrderIdUnique(orderId) {
         const existingOrder = await PackageOrderModel.findOne({ orderId });
         return !existingOrder;  // Returns true if orderId is unique
      }

      // Generate unique orderId by checking in the database
      async function generateUniqueOrderId() {
         let orderId;
         let isUnique = false;

         // Loop until we find a unique orderId
         while (!isUnique) {
            orderId = generateOrderId();
            isUnique = await isOrderIdUnique(orderId);
         }

         return orderId;
      }



      const orderData = {
         userId,
         restaurentCartId,
         addressId,
         packageType,
         //deliveryAmount,
         discountedAmount: discount,
         promoCodeId,
         totalAmount,
         packageDetails,
         paymentMethod: paymentMethod,
         paymentId: paymentId,
         status: 1,
         startDate,
         time,
         dates,
         orderId: await generateUniqueOrderId(),
         anySuggestion: anySuggestion || '',
      };

      const newOrder = new PackageOrderModel(orderData);
      const orderCreated = await newOrder.save();


      if (orderCreated) {
         const updateCartData = await Food_Pack_Cart_Model.findByIdAndUpdate(restaurentCartId,
            { $set: { status: 0 } },
            { new: true }
         )
         console.log(`Cart "${updateCartData._id}" removed from user side `)
      }

      return res.status(201).json({ success: true, message: 'Order created successfully', data: newOrder });
   } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
   }
};

export const getPackageOrderById = async (req, res) => {
   try {
      const { id } = req.params;
      let order = await PackageOrderModel.findById(id)
         //.populate('userId')
         .populate({
            path: 'restaurentCartId',
            populate: [
               {
                  path: 'restId',
                  select: 'profileImage resName ownerName location addressDetails'
               },
               {
                  path: 'packageId',
               }
            ],
         })
         .lean();
      // .populate('addressId');

      if (!order) {
         return res.status(404).json({ status: false, message: 'Order not found', data: {} });
      }

      let duration = order.restaurentCartId.packageId.durations
      if (duration.length > 0) {
         duration.map((data) => {
            if (order.restaurentCartId.duration === data.duration) {
               order.restaurentCartId.packageId.durations = data
            }
         })
      }


      order.totalCalories = 0, order.totalProtein = 0, order.totalcarbs = 0, order.totalfat = 0;
      order.packageDetails.categories.map((category) => {
         category.totalItems.length > 0 && category.totalItems.map((item) => {
            order.totalCalories += Number(item.calories);
            order.totalcarbs += Number(item.carbs);
            order.totalfat += Number(item.fat);
            order.totalProtein += Number(item.protein);
         })
      })

      let totalProgress = order.totalcarbs + order.totalfat + order.totalProtein;

      let carbsPercentage, fatPercentage, proteinPercentage;
      // Check if totalProgress is 0 to prevent division by 0
      if (totalProgress === 0) {
         carbsPercentage = 0;
         fatPercentage = 0;
         proteinPercentage = 0;
      } else {
         order.carbsPercentage = ((order.totalcarbs / totalProgress) * 100).toFixed(2);;
         order.fatPercentage = ((order.totalfat / totalProgress) * 100).toFixed(2);;
         order.proteinPercentage = ((order.totalProtein / totalProgress) * 100).toFixed(2);;
      }


      // let rating = await REST_PACK_RATING_MODEL.findOne({orderId:order._id})

      // let ratingOBJ;
      // if(rating){
      //    ratingOBJ= {
      //          "_id": rating._id,
      //          "restId": rating.restId,
      //          "userId": rating.userId,
      //          "star": rating.star,
      //          "orderId": rating.orderId,
      //          "review": rating.review,
      //          "status": rating.status,
      //          "isDeleted": rating.isDeleted,
      //      }

      // }

      // let deliveryData = await orderDeliveryModel.findOne({orderId:new mongoose.Types.ObjectId(id)})
      // .populate({
      //    path:'deliveryBoyId',
      //    select :'name countryCode mobileNumber profileImage location rating'
      // })

      // let averageRating = 0

      // if(deliveryData && deliveryData.deliveryBoyId){
      //    let orders = await orderDeliveryModel.find({ deliveryBoyId:deliveryData.deliveryBoyId._id ,deliveryBoyRating: { $ne: 0 } });

      //    if (orders.length > 0) {
      //       let totalRating = orders.reduce((sum, order) => sum + order.deliveryBoyRating?order.deliveryBoyRating:0, 0);
      //       averageRating = totalRating / orders.length;
      //    }

      //    deliveryData.deliveryBoyRating = averageRating;
      // }

      const response = {
         ...order, // Convert Mongoose document to plain object
         //rating: rating ? ratingOBJ : null, // Add the rating object to the response
         // deliveryData : deliveryData ? deliveryData: null
      };
      return res.status(200).json({ status: true, message: "Order Data", data: response });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

// export const getOrderDetail = async (req,res) =>{
//    try{
//       const { orderId ,restId} = req.params;
//       let restPackOrderDetails = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId) })
//       .populate({
//          path: 'restaurentCartId',
//          populate: [
//                {
//                   path: 'restId',
//                   select:'profileImage resName ownerName location addressDetails'
//                },
//                {
//                   path: 'packageId',
//                }
//          ],
//       })
//       .lean();

//       let response ={}
//       if (restPackOrderDetails) {
//          let duration = restPackOrderDetails.restaurentCartId.packageId.durations
//          if(duration.length>0){
//             duration.map((data)=>{
//                if(restPackOrderDetails.restaurentCartId.duration ===data.duration){
//                   restPackOrderDetails.restaurentCartId.packageId.durations = data
//                }
//             })
//          }


//          restPackOrderDetails.totalCalories=0,restPackOrderDetails.totalProtein=0,restPackOrderDetails.totalcarbs=0,restPackOrderDetails.totalfat = 0;
//          restPackOrderDetails.packageDetails.categories.map((category)=>{
//             category.totalItems.length>0 && category.totalItems.map((item)=>{
//                restPackOrderDetails.totalCalories += Number(item.calories);
//                restPackOrderDetails.totalcarbs += Number(item.carbs);
//                restPackOrderDetails.totalfat +=Number(item.fat);
//                restPackOrderDetails.totalProtein +=  Number(item.protein);
//             })
//          })

//          let totalProgress = restPackOrderDetails.totalcarbs + restPackOrderDetails.totalfat + restPackOrderDetails.totalProtein;

//          let carbsPercentage,fatPercentage,proteinPercentage;
//          // Check if totalProgress is 0 to prevent division by 0
//          if (totalProgress === 0) {
//            carbsPercentage = 0;
//            fatPercentage = 0;
//            proteinPercentage = 0;
//          } else {
//             restPackOrderDetails.carbsPercentage = ((restPackOrderDetails.totalcarbs / totalProgress) * 100).toFixed(2);;
//             restPackOrderDetails.fatPercentage = ((restPackOrderDetails.totalfat / totalProgress) * 100).toFixed(2);;
//             restPackOrderDetails.proteinPercentage = ((restPackOrderDetails.totalProtein / totalProgress) * 100).toFixed(2);;
//          }

//          response = {
//             ...restPackOrderDetails, 
//          };

//       }else{
//          let adminPackOrderDetails = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId),packagesExpired:false }).lean();

//          if (!adminPackOrderDetails) {
//             return res.status(409).json({ message: 'No Package Available on this package ID' });
//          }
//          adminPackOrderDetails.restaurants = adminPackOrderDetails.restaurants.filter((rest)=>restId===rest._id.toString())
//          let restData = await RestaurantModel.findOne({_id:new mongoose.Types.ObjectId(adminPackOrderDetails.restaurants[0]._id)},{_id:0,resName:1,ownerName:1,profileImage:1,location:1,addressDetails:1}).lean();
//          adminPackOrderDetails.restaurants[0].restData = restData

//          //data formating (same as resturant order details)

//          adminPackOrderDetails.restaurantCartId = adminPackOrderDetails.cartId;
//          adminPackOrderDetails.startDate = adminPackOrderDetails.restaurants[0].startDate;
//          adminPackOrderDetails.time = adminPackOrderDetails.restaurants[0].time;
//          adminPackOrderDetails.expired = adminPackOrderDetails.restaurants[0].expired;
//          adminPackOrderDetails.dates = adminPackOrderDetails.restaurants[0].dates;
//          adminPackOrderDetails.packageDetails = adminPackOrderDetails.restaurants[0].packageDetails;

//          //deleting keys
//          delete adminPackOrderDetails.cartId; 
//          delete adminPackOrderDetails.packagesExpired; 
//          delete adminPackOrderDetails.restaurants; 

//          if (adminPackOrderDetails.restaurantCartId) {
//             const populatedData = await AdminFoodPackCartModel.findById(adminPackOrderDetails.restaurantCartId).lean();
//             // Add the populated data to your adminPackOrderDetails object
//             adminPackOrderDetails.restaurantCartId = populatedData;
//         }

//          response = {
//             ...adminPackOrderDetails, 
//          };

//       }

//       return res.status(200).json({status:true,message:"Order Data", data:response });
//    }catch(error){

//    }
// }

export const getOrderDetail = async (req, res) => {
   try {
      let { orderId, restId } = req.params;

      const { accesstoken } = req.headers;

      let user = await UserModel.findOne({ accessToken: accesstoken });

      let restPackOrderDetails = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId) },
         { restaurentCartId: 1, orderId: 1, startDate: 1, time: 1, dates: 1, packageDetails: 1, migrateBy: 1, isMigrate: 1, suspended: 1, suspendReason: 1 })
         .populate({
            path: 'restaurentCartId',
            populate: [
               {
                  path: 'restId',
                  select: 'resName location addressDetails'
               },
            ],
            select: 'restId duration'
         })
         .lean();
      let response = {}
      if (restPackOrderDetails) {

         restPackOrderDetails.totalCalories = 0, restPackOrderDetails.totalProtein = 0, restPackOrderDetails.totalcarbs = 0, restPackOrderDetails.totalfat = 0;
         restPackOrderDetails.packageDetails.categories.map((category) => {
            category.totalItems.length > 0 && category.totalItems.map((item) => {
               restPackOrderDetails.totalCalories += Number(item.calories);
               restPackOrderDetails.totalcarbs += Number(item.carbs);
               restPackOrderDetails.totalfat += Number(item.fat);
               restPackOrderDetails.totalProtein += Number(item.protein);
            })
         })

         let totalProgress = restPackOrderDetails.totalcarbs + restPackOrderDetails.totalfat + restPackOrderDetails.totalProtein;

         let carbsPercentage, fatPercentage, proteinPercentage;
         // Check if totalProgress is 0 to prevent division by 0
         if (totalProgress === 0) {
            carbsPercentage = 0;
            fatPercentage = 0;
            proteinPercentage = 0;
         } else {
            restPackOrderDetails.carbsPercentage = ((restPackOrderDetails.totalcarbs / totalProgress) * 100).toFixed(2);;
            restPackOrderDetails.fatPercentage = ((restPackOrderDetails.totalfat / totalProgress) * 100).toFixed(2);;
            restPackOrderDetails.proteinPercentage = ((restPackOrderDetails.totalProtein / totalProgress) * 100).toFixed(2);;
         }

         response = {
            orderId: restPackOrderDetails.orderId,
            _id: restPackOrderDetails._id,
            restId: restPackOrderDetails.restaurentCartId.restId._id,
            restImage: restPackOrderDetails.restaurentCartId.restId.addressDetails.resLogo,
            restName: restPackOrderDetails.restaurentCartId.restId.resName,
            restAddress: restPackOrderDetails.restaurentCartId.restId.addressDetails,
            packageDates: restPackOrderDetails.dates,
            totalCalories: restPackOrderDetails.totalCalories,
            totalProtein: restPackOrderDetails.totalProtein,
            totalcarbs: restPackOrderDetails.totalcarbs,
            totalfat: restPackOrderDetails.totalfat,
            carbsPercentage: restPackOrderDetails.carbsPercentage,
            fatPercentage: restPackOrderDetails.fatPercentage,
            proteinPercentage: restPackOrderDetails.proteinPercentage,
            totalKm: 2,
            ratingStar: 4,
            ratingByUsers: 105,
            isMigrate: restPackOrderDetails.migrateBy && restPackOrderDetails.migrateBy.toString() === user._id.toString(),
            suspended: restPackOrderDetails?.suspended || false,
            suspendReason: restPackOrderDetails?.suspendReason || ""
         };
      } else {
         let adminPackOrderDetails = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId), packagesExpired: false }).lean();

         if (!adminPackOrderDetails) {
            return res.status(409).json({ message: 'No Order Available on this Order ID' });
         }
         adminPackOrderDetails.restaurants = adminPackOrderDetails.restaurants.filter((rest) => restId === rest._id.toString())
         let restData = await RestaurantModel.findOne({ _id: new mongoose.Types.ObjectId(adminPackOrderDetails.restaurants[0]._id) }, { _id: 1, resName: 1, location: 1, addressDetails: 1 }).lean();
         adminPackOrderDetails.restaurants[0].restData = restData

         adminPackOrderDetails.totalCalories = 0, adminPackOrderDetails.totalProtein = 0, adminPackOrderDetails.totalcarbs = 0, adminPackOrderDetails.totalfat = 0;
         adminPackOrderDetails.restaurants[0].packageDetails.categories.map((category) => {
            if (category.totalItems) {
               category.totalItems.length > 0 && category.totalItems.map((item) => {
                  adminPackOrderDetails.totalCalories += item.calories ? Number(item.calories) : 0;
                  adminPackOrderDetails.totalcarbs += item.carbs ? Number(item.carbs) : 0;
                  adminPackOrderDetails.totalfat += item.fat ? Number(item.fat) : 0;
                  adminPackOrderDetails.totalProtein += item.protein ? Number(item.protein) : 0;
               })
            }
         })
         let totalProgress = adminPackOrderDetails.totalcarbs + adminPackOrderDetails.totalfat + adminPackOrderDetails.totalProtein;

         let carbsPercentage, fatPercentage, proteinPercentage;
         // Check if totalProgress is 0 to prevent division by 0
         if (totalProgress === 0) {
            carbsPercentage = 0;
            fatPercentage = 0;
            proteinPercentage = 0;
         } else {
            adminPackOrderDetails.carbsPercentage = ((adminPackOrderDetails.totalcarbs / totalProgress) * 100).toFixed(2);;
            adminPackOrderDetails.fatPercentage = ((adminPackOrderDetails.totalfat / totalProgress) * 100).toFixed(2);;
            adminPackOrderDetails.proteinPercentage = ((adminPackOrderDetails.totalProtein / totalProgress) * 100).toFixed(2);;
         }
         response = {
            orderId: adminPackOrderDetails.orderId,
            _id: adminPackOrderDetails._id,
            restId: restData._id,
            restImage: restData.addressDetails.resLogo,
            restName: restData.resName,
            restAddress: restData.addressDetails,
            packageDates: adminPackOrderDetails.restaurants[0].dates,
            totalCalories: adminPackOrderDetails.totalCalories,
            totalProtein: adminPackOrderDetails.totalProtein,
            totalcarbs: adminPackOrderDetails.totalcarbs,
            totalfat: adminPackOrderDetails.totalfat,
            carbsPercentage: adminPackOrderDetails.carbsPercentage,
            fatPercentage: adminPackOrderDetails.fatPercentage,
            proteinPercentage: adminPackOrderDetails.proteinPercentage,
            totalKm: 2,
            ratingStar: 4,
            ratingByUsers: 105,
            // isMigrate : adminPackOrderDetails.adminPackOrderDetails.migrateBy && adminPackOrderDetails.adminPackOrderDetails.migrateBy.toString() === user._id.toString()
            isMigrate: false,
            suspended: adminPackOrderDetails.restaurants[0]?.suspended || false,
            suspendReason: adminPackOrderDetails.restaurants[0]?.suspendReason || ""
         };
      }

      return res.status(200).json({ status: true, message: "Order Data", data: response });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

export const migratePackage = async (req, res) => {
   try {
      const { accesstoken } = req.headers;

      let { orderId, restId, countryCode, mobileNumber, firstName, lastName, lat, long, address, houseNo, buildingName, landmarkName, addressLabel, remark } = req.body;

      let user = await UserModel.findOne({ accessToken: accesstoken });

      let findUser = await UserModel.findOne({ countryCode: countryCode, mobileNumber: mobileNumber });
      if (!findUser) {
         return res.status(409).json({ message: 'Sorry, no user found with this mobile number' });
      }

      if (user._id.equals(findUser._id)) {
         return res.status(409).json({ message: "Sorry, You can't migrate yourself" });
      }

      const newAddress = new AddressModel({
         userId: findUser._id,
         location: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
         },
         address,
         houseNo,
         buildingName,
         landmarkName,
         addressLabel,
         remark,
      });
      await newAddress.save();

      let restPackOrderDetails = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId) }, { packageDetails: 1, userId: 1 });

      if (restPackOrderDetails) {
         const updateMigratedPackage = await PackageOrderModel.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(orderId) }, { userId: findUser._id, addressId: newAddress._id, migrateBy: user._id, isMigrate: true });
         if (updateMigratedPackage) {
            return res.status(200).json({ status: true, message: "Order migrated successfully", data: {} });
         } else {
            return res.status(409).json({ message: 'Sorry!!, Order can not be migrated.' });
         }
      } else {
         let adminPackOrderDetails = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId), packagesExpired: false, "restaurants._id": restId }).lean();
         if (adminPackOrderDetails) {
            const updateMigratedPackage = await AdminPackageOrderModel.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(orderId), "restaurants._id": restId }, {
               $set: {
                  "restaurants.$.migrateBy": user._id,
                  "restaurants.$.isMigrate": true,
                  userId: findUser._id,
                  addressId: newAddress._id,
               }
            });
            console.log("updateMigratedPackage ----------------> ", updateMigratedPackage)
            if (updateMigratedPackage) {
               return res.status(200).json({ status: true, message: "Order migrated successfully", data: {} });
            } else {
               return res.status(409).json({ message: 'Sorry!!, Order can not be migrated.' });
            }
         }
      }
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

export const menuDetails = async (req, res) => {
   try {
      let { orderId, restId } = req.params;
      let restPackOrderDetails = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId) },
         { packageDetails: 1 })
      let response = {}
      if (restPackOrderDetails) {
         response = {
            packageDetails: restPackOrderDetails.packageDetails
         }
      } else {
         let adminPackOrderDetails = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId), packagesExpired: false }).lean();

         if (!adminPackOrderDetails) {
            return res.status(409).json({ message: 'No Package Available on this package ID' });
         }
         adminPackOrderDetails.restaurants = adminPackOrderDetails.restaurants.filter((rest) => restId === rest._id.toString())
         adminPackOrderDetails.packageDetails = adminPackOrderDetails.restaurants[0].packageDetails;
         response = {
            packageDetails: adminPackOrderDetails.packageDetails
         }
      }

      return res.status(200).json({ status: true, message: "Menu Details", data: response });

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

export const shuffleMenu = async (req, res) => {
   try {
      let { orderId, restId, categoryId } = req.params;

      let restPackOrderDetails = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId) }, { packageDetails: 1, restaurentCartId: 1 })
         .populate({
            path: 'restaurentCartId',
            populate: [
               {
                  path: 'packageId',
                  select: 'categories'
               }
            ],
            select: 'packageId'
         }).lean();

      let response = {};
      if (restPackOrderDetails) {
         let details;

         // Find the specific category to shuffle based on categoryId from the request params
         const categoryToShuffle = restPackOrderDetails.restaurentCartId.packageId.categories.find(category => category._id.toString() === categoryId);
         const categoryToSet = restPackOrderDetails.packageDetails.categories.find(category => category._id.toString() === categoryId);

         if (categoryToShuffle) {
            // Shuffle the items in the selected category's totalItems
            categoryToShuffle.totalItems.sort(() => Math.random() - 0.5);

            // Ensure the selected item is not already in the totalItems of packageDetails
            let selectedItem;
            if (categoryToShuffle.totalItems.length > 1) {
               selectedItem = categoryToShuffle.totalItems.find(item => categoryToSet.totalItems[0]._id.toString() !== item._id.toString());
            } else {
               selectedItem = categoryToShuffle.totalItems[0]
            }

            categoryToSet.totalItems = [selectedItem];
            response = {
               packageDetails: restPackOrderDetails.packageDetails,
            };

            let updateRestPackDetails = await PackageOrderModel.findByIdAndUpdate(
               restPackOrderDetails._id,
               { $set: { packageDetails: restPackOrderDetails.packageDetails } },
               { new: true }
            )
            return res.status(200).json({ status: true, message: "Menu Details", data: response });
         } else {
            // Handle case where categoryId does not match any category
            console.log("Category not found");
            return res.status(400).json({ status: false, message: "Category not found" });
         }
      }
      else {

         let data = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId), packagesExpired: false }).lean();
         let adminPackOrderDetails = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId), packagesExpired: false })
            .populate({
               path: 'cartId',
               populate: [
                  {
                     path: 'packageId',
                     select: 'restaurants'
                  }
               ],
               select: 'packageId'
            }).lean()

         if (!adminPackOrderDetails) {
            return res.status(409).json({ message: 'No Package Available on this package ID' });
         }

         adminPackOrderDetails.restaurants = adminPackOrderDetails.restaurants.filter((rest) => restId === rest._id.toString())
         adminPackOrderDetails.cartId.packageId.restaurants = adminPackOrderDetails.cartId.packageId.restaurants.filter((rest) => restId === rest._id.toString())
         adminPackOrderDetails.packageDetails = adminPackOrderDetails.restaurants[0].packageDetails;
         adminPackOrderDetails.mainPackageDetails = adminPackOrderDetails.cartId.packageId.restaurants[0].categories

         const categoryToShuffle = adminPackOrderDetails.mainPackageDetails.find(category => category._id.toString() === categoryId);
         const categoryToSet = adminPackOrderDetails.packageDetails.categories.find(category => category._id.toString() === categoryId);

         adminPackOrderDetails.mainPackageDetails.forEach(category => {
            category.totalItems.sort(() => Math.random() - 0.5);
         });

         if (categoryToShuffle) {
            // Shuffle the items in the selected category's totalItems
            categoryToShuffle.totalItems.sort(() => Math.random() - 0.5);

            // Ensure the selected item is not already in the totalItems of packageDetails
            let selectedItem;
            if (categoryToShuffle.totalItems.length > 1) {
               selectedItem = categoryToShuffle.totalItems.find(item => categoryToSet.totalItems[0]._id.toString() !== item._id.toString());
            } else {
               selectedItem = categoryToShuffle.totalItems[0]
            }

            categoryToSet.totalItems = [selectedItem];
            response = {
               packageDetails: adminPackOrderDetails.packageDetails,
            };

            data.restaurants.forEach((rest, index1) => {
               if (restId === rest._id.toString()) {
                  rest.packageDetails.categories.forEach((cat, index2) => {
                     if (cat._id.toString() === categoryId) {
                        // Create a shallow copy of the category to avoid reference issues
                        data.restaurants[index1].packageDetails.categories[index2].totalItems = adminPackOrderDetails.packageDetails.categories[0].totalItems;
                     }
                  });
               }
            });

            let updateRestPackDetails = await AdminPackageOrderModel.findByIdAndUpdate(
               orderId,
               { $set: data },
               { new: true }
            )
            return res.status(200).json({ status: true, message: "Menu Details updated", data: response });
         } else {
            // Handle case where categoryId does not match any category
            console.log("Category not found");
            return res.status(400).json({ status: false, message: "Category not found" });
         }
      }

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

export const createAdminPackageOrder = async (req, res) => {
   try {
      let {
         userId,
         cartId,
         addressId,
         paymentMethod,
         paymentId,
         packageType,
         duration,
         restaurants,  // array which includes restaurant id and its (start date and end time)
      } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }
      const cart = await AdminFoodPackCartModel.findById(cartId).populate('packageId');

      if (!cart) {
         return res.status(404).json({ message: 'Cart is not found' });
      }
      const orderExisted = await AdminPackageOrderModel.findOne({ cartId: new mongoose.Types.ObjectId(cartId) });

      if (orderExisted) {
         return res.status(409).json({ message: 'Order has already been created for this cart.', data: orderExisted }); // conflict
      }

      const address = await AddressModel.findById(addressId);
      if (!address) {
         return res.status(404).json({ message: 'Address not found' });
      }
      // const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER,status:true });
      // let deliveryAmount = 0;

      await Promise.all(restaurants.map(async (restaurant, index) => {
         if (!restaurant.startDate || restaurant.startDate.toString().length < 10) {
            return res.status(409).json({ message: `start Date required of ${restaurant._id}` }); // conflict
         }
         if (!restaurant.time || restaurant.time.toString().length < 10) {
            return res.status(409).json({ message: `Time is required of ${restaurant._id}` }); // conflict
         }

         const rest = await RestaurantModel.findById(restaurant._id);
         if (!rest) {
            return res.status(404).json({ message: 'Restaurant not found' });
         }

         let filteredRestCategory = cart.packageId.restaurants.find(rest => rest._id.toString() === restaurant._id)

         if (!filteredRestCategory) {
            return res.status(409).json({ message: `invalid restaurant id ${restaurant._id}` }); // conflict
         }

         filteredRestCategory.categories.forEach(category => {
            category.totalItems = category.totalItems[0]
         })
         restaurants[index].packageDetails = {
            categories: filteredRestCategory.categories
         }

         // Calculate total Amount
         // deliveryAmount = deliveryAmount +
         //    (Number(deliveryFareResp?.baseFare || 0) +
         //    getKmRange(
         //       address.location.coordinates[0],
         //       address.location.coordinates[1],
         //       rest.location.coordinates[0],
         //       rest.location.coordinates[1]
         //    ) *
         //    (deliveryFareResp.perKmFare || 1));

         let dates = [];
         if (duration === 1) { // WEEKLY: 1, MONTHLY: 2
            // deliveryAmount = deliveryAmount * 7
            // if (in seconds)Multiply by 1000 to convert seconds to milliseconds
            let startDate = new Date(restaurant.startDate);
            let newDate = new Date(startDate); // Clone the startDate object for manipulation 
            dates.push({ date: newDate.getTime() })
            for (let i = 0; i < 6; i++) {
               newDate.setDate(newDate.getDate() + 1); // Increment the day by 1 for each iteration
               dates.push({ date: newDate.getTime() }); // Push the timestamp in milliseconds
            }
         } else if (duration === 2) {
            //deliveryAmount = deliveryAmount * 30;
            // if (in seconds)Multiply by 1000 to convert seconds to milliseconds
            let startDate = new Date(restaurant.startDate);
            let newDate = new Date(startDate); // Clone the startDate object for manipulation      
            dates.push({ date: newDate.getTime() })
            for (let i = 0; i < 29; i++) {
               newDate.setDate(newDate.getDate() + 1); // Increment the day by 1 for each iteration
               dates.push({ date: newDate.getTime() }); // Push the timestamp in milliseconds
            }
         }
         restaurants[index].dates = dates
      }))

      let totalAmount = cart.totalAmount;
      //totalAmount = Math.max(Math.round((totalAmount + deliveryAmount) * 100) / 100, 0); // Round to 2 decimal places
      function generateOrderId(length = 8) {
         return crypto.randomBytes(length)
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
            .substring(0, length);         // Ensure it's exactly 8 characters
      }

      // Function to check if the orderId exists in the database
      async function isOrderIdUnique(orderId) {
         const existingOrder = await PackageOrderModel.findOne({ orderId });
         return !existingOrder;  // Returns true if orderId is unique
      }

      // Generate unique orderId by checking in the database
      async function generateUniqueOrderId() {
         let orderId;
         let isUnique = false;

         // Loop until we find a unique orderId
         while (!isUnique) {
            orderId = generateOrderId();
            isUnique = await isOrderIdUnique(orderId);
         }

         return orderId;
      }

      const orderData = {
         userId,
         cartId,
         addressId,
         packageType,
         //deliveryAmount,
         totalAmount,
         paymentMethod: paymentMethod,
         paymentId: paymentId,
         status: 1,
         restaurants,
         orderId: await generateUniqueOrderId()
      };

      const newOrder = new AdminPackageOrderModel(orderData);

      const orderCreated = await newOrder.save();

      if (orderCreated) {
         const updateCartData = await AdminFoodPackCartModel.findByIdAndUpdate(
            cartId,
            { $set: { status: 0 } },
            { new: true }
         )
         console.log(`Cart "${updateCartData._id}" removed from user side `)
      }

      return res.status(201).json({ success: true, message: 'Order created successfully', data: newOrder });
   } catch (error) {
      console.log("error...", error)
      res.status(500).json({ message: 'Internal server error' });
   }
};

export const adminPackageOrderRestaurants = async (req, res) => {
   try {
      const { id } = req.params;
      const { accesstoken } = req.headers;

      let user = await UserModel.findOne({ accessToken: accesstoken });

      const order = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(id) }, { restaurants: 1, userId: 1 }).lean();

      await Promise.all(order.restaurants.length > 0 && order.restaurants.map(async (rest, index) => {
         let restData = await RestaurantModel.findOne({ _id: new mongoose.Types.ObjectId(rest._id) }, { _id: 0, resName: 1, ownerName: 1 })
         order.restaurants[index].restData = restData
         if (order.userId.equals(user._id)) {
            order.restaurants[index]['isMigrate'] = false;
         } else {
            order.restaurants[index]['isMigrate'] = true;
         }
      }))

      const response = {
         ...order,
      };
      return res.status(200).json({ status: true, message: "Order Data", data: response });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getAdminPackOrderDetailsByRest = async (req, res) => {
   try {
      const { id, restId } = req.params;

      const order = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(id) }).lean();

      order.restaurants = order.restaurants.filter((rest) => restId === rest._id.toString())
      let restData = await RestaurantModel.findOne({ _id: new mongoose.Types.ObjectId(order.restaurants[0]._id) }, { _id: 0, resName: 1, ownerName: 1, profileImage: 1, location: 1, addressDetails: 1 })
      order.restaurants[0].restData = restData

      order.totalCalories = 0, order.totalProtein = 0, order.totalcarbs = 0, order.totalfat = 0;
      order.restaurants[0].packageDetails.categories.map((category) => {
         category.totalItems.length > 0 && category.totalItems.map((item) => {
            order.totalCalories += item.calories ? Number(item.calories) : 0;
            order.totalcarbs += item.carbs ? Number(item.carbs) : 0;
            order.totalfat += item.fat ? Number(item.fat) : 0;
            order.totalProtein += item.protein ? Number(item.protein) : 0;
         })
      })
      let totalProgress = order.totalcarbs + order.totalfat + order.totalProtein;

      let carbsPercentage, fatPercentage, proteinPercentage;
      // Check if totalProgress is 0 to prevent division by 0
      if (totalProgress === 0) {
         carbsPercentage = 0;
         fatPercentage = 0;
         proteinPercentage = 0;
      } else {
         order.carbsPercentage = ((order.totalcarbs / totalProgress) * 100).toFixed(2);;
         order.fatPercentage = ((order.totalfat / totalProgress) * 100).toFixed(2);;
         order.proteinPercentage = ((order.totalProtein / totalProgress) * 100).toFixed(2);;
      }

      return res.status(200).json({ status: true, message: "Order Data", data: order });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}


export const getActivePackageOrdersByUserId = async (req, res) => {
   try {
      const { userId } = req.params;

      const { accesstoken } = req.headers;

      let user = await UserModel.findOne({ accessToken: accesstoken });

      if (user === null || user._id.toString() !== userId) {
         return res.status(404).json({ message: 'Invalid User ID or expired access Token' });
      }

      // const restPackOrders = await PackageOrderModel.find({userId: new mongoose.Types.ObjectId(userId) ,isDeleted:false, expired : false},
      let restPackOrders = await PackageOrderModel.find({
         $or: [
            { userId: new mongoose.Types.ObjectId(userId) },
            { migrateBy: new mongoose.Types.ObjectId(userId) }
         ], isDeleted: false, expired: false
      },
         { restaurentCartId: 1, orderId: 1, packageType: 1, totalAmount: 1, startDate: 1, time: 1, dates: 1, migrateBy: 1, isMigrate: 1, suspended: 1, suspendReason: 1 })
         .populate({
            path: 'restaurentCartId',
            select: 'restId packageId duration',
            populate: [
               {
                  path: 'restId',
                  select: 'profileImage resName ownerName addressDetails'
               },
               {
                  path: 'packageId',
                  select: 'name'
               }
            ],
         }).lean()

      // restPackOrders.length>0 && restPackOrders.map((ord,index)=>{
      //    restPackOrders[index].category = "restaurantPackage",
      //    restPackOrders[index].daysLeft = 5
      //    restPackOrders[index].isMigrate = true
      // })

      if (restPackOrders.length > 0) {
         restPackOrders.map((ord, index) => {
            ord.category = "restaurantPackage";
            ord.daysLeft = 5;
            ord.isMigrate = ord.migrateBy && ord.migrateBy.toString() === user._id.toString();              // Check if user._id matches ord.migrateBy
         });
      }

      // const adminPackOrders = await AdminPackageOrderModel.find({userId: new mongoose.Types.ObjectId(userId) ,isDeleted:false, packagesExpired : false, migrateBy :1, isMigrate : 1},
      let adminPackOrders = await AdminPackageOrderModel.find({
         $or: [
            { userId: new mongoose.Types.ObjectId(userId) },
            {
               restaurants: {
                  $elemMatch: {
                     migrateBy: new mongoose.Types.ObjectId(userId)
                  }
               }
            }
         ],
         isDeleted: false, packagesExpired: false,
      },
         { cartId: 1, orderId: 1, packageType: 1, totalAmount: 1, restaurants: 1 })
         .populate({
            path: 'cartId',
            select: 'packageId',
            populate: [
               {
                  path: 'packageId',
                  select: 'name duration'
               }
            ],
         }).lean()

      // adminPackOrders.length>0 && adminPackOrders.map((ord,index)=>{
      //    adminPackOrders[index].category = "adminPackage",
      //    adminPackOrders[index].daysLeft = 5,
      //    ord.isMigrate = ord.restaurants.migrateBy && ord.restaurants.migrateBy.toString() === user._id.toString();              // Check if user._id matches ord.migrateBy


      // })

      if (adminPackOrders.length > 0) {
         adminPackOrders = adminPackOrders.map((ord, index) => {
            ord.category = "adminPackage";
            ord.daysLeft = 5;
            // ord.isMigrate = ord.restaurants.some(restaurant => 
            //      restaurant.migrateBy && restaurant.migrateBy.toString() === user._id.toString()
            //  );
            return ord;
         });
      }

      let data = [
         ...restPackOrders,
         ...adminPackOrders
      ]
      return res.status(200).json({ status: true, message: "Orders Fetched succesfully", data });
      // if (orders.length === 0) {
      //    // orders.map((order,index)=>{
      //    //    let todayDate = new Date();
      //    //    let startDate = new Date(order.startDate);
      //    //    let lastDate = new Date(order.dates.pop());
      //    //    if(todayDate>lastDate){
      //    //       orders[index].daysLeft = 0
      //    //    }else{
      //    //       if(todayDate<startDate){
      //    //          if(todayDate.getTime()<time){
      //    //             if(order.restaurentCartId.duration===2){
      //    //                orders[index].daysLeft = 30
      //    //             }else{
      //    //                orders[index].daysLeft = 7
      //    //             }
      //    //          }else{
      //    //             if(order.restaurentCartId.duration===2){
      //    //                orders[index].daysLeft = 29
      //    //             }else{
      //    //                orders[index].daysLeft = 6
      //    //             }
      //    //          }
      //    //       }else if(todayDate>startDate){
      //    //          if(todayDate.getTime()<time){
      //    //             if(order.restaurentCartId.duration===2){
      //    //                let last = Date.today().add(+30).days();
      //    //                orders[index].daysLeft = last - todayDate
      //    //             }else{
      //    //                orders[index].daysLeft = 7
      //    //             }
      //    //          }else{
      //    //             if(order.restaurentCartId.duration===2){
      //    //                orders[index].daysLeft = 29
      //    //             }else{
      //    //                orders[index].daysLeft = 6
      //    //             }
      //    //          }
      //    //       }
      //    //    }
      //    // })
      //    return res.status(404).json({ status: true,  message: 'No orders found for this user',data:{} });
      // }else{
      //    return res.status(200).json({ status: true,  message : "Orders Fetched succesfully" ,data:orders });
      // }
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getPastPackageOrdersByUserId = async (req, res) => {
   try {
      const { userId } = req.params;
      const { accesstoken } = req.headers;

      let user = await UserModel.findOne({ accessToken: accesstoken });

      if (user === null || user._id.toString() !== userId) {
         return res.status(404).json({ message: 'Invalid User ID or expired access Token' });
      }

      const restPackOrders = await PackageOrderModel.find(
         {
            $or: [
               { userId: new mongoose.Types.ObjectId(userId) },
               { migrateBy: new mongoose.Types.ObjectId(userId) }
            ],
            isDeleted: false, expired: true
         },
         { restaurentCartId: 1, orderId: 1, packageType: 1, totalAmount: 1, startDate: 1, time: 1, migrateBy: 1, isMigrate: 1 }
      )
         .populate({
            path: 'restaurentCartId',
            select: 'restId packageId duration',
            populate: [
               {
                  path: 'restId',
                  select: 'profileImage resName ownerName addressDetails',
               },
               {
                  path: 'packageId',
                  select: 'name',
               },
            ],
         }).lean();

      restPackOrders.forEach(order => (
         order.category = 'restaurantPackage',
         order.isMigrate = order.migrateBy && order.migrateBy.toString() === user._id.toString()           // Check if user._id matches ord.migrateBy
      ));

      const adminPackOrders = await AdminPackageOrderModel.find(
         {
            //    $or: [
            //    { userId: new mongoose.Types.ObjectId(userId) },
            //    { migrateBy: new mongoose.Types.ObjectId(userId) }
            //  ],

            $or: [
               { userId: new mongoose.Types.ObjectId(userId) },
               {
                  restaurants: {
                     $elemMatch: {
                        migrateBy: new mongoose.Types.ObjectId(userId)
                     }
                  }
               }
            ],
            isDeleted: false, packagesExpired: true
         },
         { cartId: 1, orderId: 1, packageType: 1, totalAmount: 1, restaurants: 1 }
      )
         .populate({
            path: 'cartId',
            select: 'packageId',
            populate: [
               {
                  path: 'packageId',
                  select: 'name duration',
               },
            ],
         })
         .populate({
            path: 'restaurants._id',
            select: 'resName',
         }).lean();

      adminPackOrders.forEach(order => {
         order.category = 'adminPackage';
         order.restaurants.forEach(restaurant => {
            restaurant.resName = restaurant._id.resName;
            restaurant._id = restaurant._id._id;
         });
      });

      const data = [...restPackOrders, ...adminPackOrders];

      await Promise.all(
         data.map(async (order, index) => {
            const orderRatings = await REST_PACK_RATING_MODEL.find(
               { orderId: new mongoose.Types.ObjectId(order._id) },
               { restId: 1, star: 1, review: 1 }
            ).populate({ path: 'restId', select: 'resName' });

            data[index].rating = orderRatings.length > 0 ? orderRatings : null;
         })
      );

      return res.status(200).json({ status: true, message: 'Orders Fetched successfully', data });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const checkExpiredPackage = async () => {
   try {
      let foodPackageOrder = await PackageOrderModel.find({ isDeleted: false, expired: false });

      let todayDate = new Date();
      if (foodPackageOrder.length > 0) {
         foodPackageOrder.map(async (order) => {
            let date = order.dates[-1];
            let lastDate = new Date(date.date);
            if (todayDate > lastDate) {
               order.expired = true;
               let updateOrder = await PackageOrderModel.findByIdAndUpdate(
                  order._id,
                  { $set: order },
                  { new: true }
               );
            }
         });
      }
   } catch (error) {
      console.log("Error.....checkExpiredPackage.....cron", error);
   }
};

// Scheduled the cron job to run at 11:59 PM every day
// cron.schedule('59 23 * * *', () => {
//    console.log('Running the cron job at 11:59 PM');
//    checkExpiredPackage();
// });

const calculateDate = async (duration, dates) => {
   let daysRequired = duration === 1 ? 7 : 30; // 7 days for week, 30 days for month

   // Filter dates with status 1 (status: 1 means active)
   let validDates = dates.filter(date => date.status === 1);

   let currentDateCount = validDates.length;
   let diff = daysRequired - currentDateCount;

   // Get the last valid date (the last status 1 date)
   let lastValidDate = validDates.length > 0 ? new Date(validDates[validDates.length - 1].date) : null;

   if (currentDateCount < daysRequired) {
      // If there are fewer dates with status 1, add the missing dates
      if (lastValidDate) {
         let datesAfterLastValid = dates.filter(date => new Date(date.date) > lastValidDate && date.status === 0);
         // Get the count of dates that are after the last valid date and have status 1
         let totalCountAfterLastValid = datesAfterLastValid.length;
         for (let i = 1; i <= diff; i++) {
            let newDate = new Date(lastValidDate);
            newDate.setDate(lastValidDate.getDate() + i + totalCountAfterLastValid); // incrementing by 1 day
            // Add the new date with status 1
            dates.push({ date: newDate.getTime(), status: 1 }); // Convert to timestamp
         }
      }
   } else if (currentDateCount > daysRequired) {
      // If there are extra dates with status 1, remove them
      // Calculate the slice count (this is the number of status 1 dates in validDates)
      let sliceCount = validDates.length - daysRequired;

      // Remove the last `sliceCount` dates from the `dates` array that match the valid dates
      dates = dates.filter((date, index) => {
         // Get the last `sliceCount` valid dates to compare against
         const validSlice = validDates.slice(validDates.length - sliceCount);

         // Keep dates that do not match any of the last `sliceCount` valid dates
         return !validSlice.some(validDate => validDate.date === date.date);
      });

      //dates = dates.slice(0, daysRequired);
   }
   return dates
}

export const playPausePackage = async (req, res) => {
   try {
      let { packageOrderId, restId, dates } = req.body;

      let restPackOrderDetails = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(packageOrderId) }, { restaurentCartId: 1 })
         .populate({ path: 'restaurentCartId', select: 'duration' });

      // duration = 1 (WEEK) || duration = 2 (MONTH)
      if (restPackOrderDetails) {
         let duration = restPackOrderDetails.restaurentCartId.duration;
         let updatedDates = await calculateDate(duration, dates)

         let updateOrder = await PackageOrderModel.findByIdAndUpdate(
            restPackOrderDetails._id,
            { $set: { dates: updatedDates } },
            { new: true }
         )
         if (updateOrder) {
            return res.status(200).json({ status: true, message: 'Updated Order dates', data: { packageOrderId, restId, dates: updatedDates } });
         } else {
            return res.status(409).json({ status: false, message: 'issue in updating order dates', data: {} });
         }

      } else {
         let adminPackOrderDetails = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(packageOrderId) })
            .populate({
               path: 'cartId',
               select: 'packageId',
               populate: { path: 'packageId', select: 'duration' }
            });

         if (!adminPackOrderDetails) {
            return res.status(409).json({ message: 'No Package Available on this package ID' });
         }

         // Step 2: Extract the duration from the admin package order
         let duration = adminPackOrderDetails.cartId.packageId.duration;

         // Step 3: Update the dates array using the calculateDate function
         let updatedDates = await calculateDate(duration, dates);

         // Step 4: Directly update the restaurant's dates if matching restaurantId is found
         let restaurant = adminPackOrderDetails.restaurants.find(rest => rest._id.toString() === restId);

         if (restaurant) {
            restaurant.dates = updatedDates;
         } else {
            return res.status(404).json({ message: 'Restaurant not found' });
         }

         // Step 5: Save the updated order
         let updateOrder = await adminPackOrderDetails.save();

         if (updateOrder) {
            return res.status(200).json({ status: true, message: 'Updated Order dates', data: { packageOrderId, restId, dates: updatedDates } });
         } else {
            return res.status(409).json({ status: false, message: 'Issue in updating order dates', data: {} });
         }
      }
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

export const calenderView = async (req, res) => {
   try {
      let { packageOrderId, restId } = req.params;

      let restPackOrderDetails = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(packageOrderId) }, { dates: 1, startDate: 1, time: 1 }).lean();

      // duration = 1 (WEEK) || duration = 2 (MONTH)
      if (restPackOrderDetails) {
         let endDate = restPackOrderDetails.dates[restPackOrderDetails.dates.length - 1].date
         restPackOrderDetails.endDate = endDate;
         return res.status(200).json({ status: true, message: 'Calender View Data', data: restPackOrderDetails });

      } else {
         let adminPackOrderDetails = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(packageOrderId) }, { restaurants: 1 }).lean();

         if (!adminPackOrderDetails) {
            return res.status(409).json({ message: 'No Order Available on this package order ID' });
         }

         // filter the restaurant if matching restaurantId is found
         adminPackOrderDetails.restaurants = adminPackOrderDetails.restaurants.filter(rest => rest._id.toString() === restId);

         let endDate = adminPackOrderDetails.restaurants[0].dates[adminPackOrderDetails.restaurants[0].dates.length - 1].date
         let response = {
            _id: adminPackOrderDetails._id,
            startDate: adminPackOrderDetails.restaurants[0].startDate,
            time: adminPackOrderDetails.restaurants[0].time,
            dates: adminPackOrderDetails.restaurants[0].dates,
            endDate: endDate,
            daysLeft: 5
         }
         return res.status(200).json({ status: true, message: 'Calender View Data', data: response });
      }
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

export const selectSubstituteItem = async (req, res) => {
   try {
      let { packageOrderId, categoryId, mainItemId, substituteItemId, restId } = req.body;

      let restPackOrder = await PackageOrderModel.findById(packageOrderId);

      if (restPackOrder) {
         restPackOrder.packageDetails.categories.map((category, index) => {
            if (category._id.toString() === categoryId) {
               let totalItems = category.totalItems;
               let substituteItems = category.substituteItems;

               let mainItemIndex = totalItems.findIndex(item => item._id.toString() === mainItemId);
               let substituteItemIndex = substituteItems.findIndex(item => item._id.toString() === substituteItemId);

               if (mainItemIndex !== -1 && substituteItemIndex !== -1) {
                  let mainItem = totalItems.splice(mainItemIndex, 1)[0];
                  let substituteItem = substituteItems.splice(substituteItemIndex, 1)[0];

                  totalItems.splice(mainItemIndex, 0, substituteItem); // Insert substitute item at the same index

                  substituteItems.splice(substituteItemIndex, 0, mainItem); // Insert main item at the same index
                  restPackOrder.packageDetails.categories[index].totalItems = totalItems;
                  restPackOrder.packageDetails.categories[index].substituteItems = substituteItems;
               }
            }
         });
         let updateRestPackOrder = await PackageOrderModel.findByIdAndUpdate(
            restPackOrder._id,
            { $set: restPackOrder },
            { new: true }
         )
         //await restPackOrder.save();
         return res.status(200).json({ status: true, message: 'subtitute item selected', data: updateRestPackOrder });
      } else {
         let adminPackOrder = await AdminPackageOrderModel.findById(packageOrderId);

         if (!adminPackOrder) {
            return res.status(409).json({ message: 'No Order Available on this package order ID' });
         }

         await Promise.all(adminPackOrder.restaurants.map(async (rest, index1) => {
            if (rest._id.toString() === restId) {
               rest.packageDetails.categories.map((category, index2) => {
                  if (category._id.toString() === categoryId) {
                     let totalItems = category.totalItems;
                     let substituteItems = category.substituteItems;

                     let mainItemIndex = totalItems.findIndex(item => item._id.toString() === mainItemId);
                     let substituteItemIndex = substituteItems.findIndex(item => item._id.toString() === substituteItemId);

                     if (mainItemIndex !== -1 && substituteItemIndex !== -1) {
                        let mainItem = totalItems.splice(mainItemIndex, 1)[0];
                        let substituteItem = substituteItems.splice(substituteItemIndex, 1)[0];

                        totalItems.splice(mainItemIndex, 0, substituteItem); // Insert substitute item at the same index

                        substituteItems.splice(substituteItemIndex, 0, mainItem); // Insert main item at the same index

                        adminPackOrder.restaurants[index1].packageDetails.categories[index2].totalItems = totalItems;
                        adminPackOrder.restaurants[index1].packageDetails.categories[index2].substituteItems = substituteItems;
                     }
                  }
               });

               let updateadminPackOrder = await AdminPackageOrderModel.findByIdAndUpdate(
                  adminPackOrder._id,
                  { $set: adminPackOrder },
                  { new: true }
               )
               //await adminPackOrder.save();
               return res.status(200).json({ status: true, message: 'subtitute item selected', data: updateadminPackOrder });
            }
         }))

      }
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

export const renewOrder = async (req, res) => {
   try {
      let { orderId } = req.body

      if (!req?.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      let restPackOrder = await PackageOrderModel.findById(orderId).populate('restaurentCartId');

      if (restPackOrder) {
         //.........createCart............
         let cart = await Food_Pack_Cart_Model.findOne({ userId: req.userData._id, restId: restPackOrder.restaurentCartId.restId, status: 1 });
         if (!cart) {
            const createdResp = await commonService.create(Food_Pack_Cart_Model, {
               userId: req.userData._id,
               restId: restPackOrder.restaurentCartId.restId,
               packageId: restPackOrder.restaurentCartId.packageId,
               duration: restPackOrder.restaurentCartId.duration,
               amount: restPackOrder.restaurentCartId.packagePrice,
               createdAt: new Date().getTime(),
               updatedAt: new Date().getTime()
            });
            return sendSuccessResponse(res, createdResp, success.SUCCESS, 200);
         } else {
            return sendSuccessResponse(res, cart, "Already Added in cart", 200);
         }
      } else {
         let adminPackOrder = await AdminPackageOrderModel.findById(orderId).populate('cartId');

         if (!adminPackOrder) {
            return res.status(409).json({ message: 'No order Available on this package order ID' });
         }

         let cart = await AdminFoodPackCartModel.findOne({ userId: req.userData._id, packageId: adminPackOrder.cartId.packageId, status: 1 });

         if (!cart) {
            const createdResp = await commonService.create(AdminFoodPackCartModel, {
               userId: req.userData._id,
               restaurants: adminPackOrder.cartId.restaurants,
               packageId: adminPackOrder.cartId.packageId,
               totalAmount: adminPackOrder.cartId.totalAmount,
               createdAt: new Date().getTime(),
               updatedAt: new Date().getTime()
            });

            const populatedResp = await AdminFoodPackCartModel.populate(createdResp, {
               path: 'packageId',
               select: 'duration'
            });

            const duration = populatedResp.packageId.duration;
            return sendSuccessResponse(res, { ...createdResp._doc, duration }, success.SUCCESS, 200);

            //   return sendSuccessResponse(res, createdResp, success.SUCCESS, 200);
         } else {
            return sendSuccessResponse(res, cart, "Already Added in cart", 200);
         }

      }

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

// Add the rating of restaurant and items PACKAGES
export const rateOrder = async (req, res) => {
   try {
      let { orderId, userId, ratings, deliveryBoyRating = 0 } = req.body;
      // console.log("req.body...",req.body)
      let data
      await Promise.all(ratings.length > 0 && ratings.map(async (rating) => {
         let findRating = await commonService.findOne(REST_PACK_RATING_MODEL, {
            restId: new mongoose.Types.ObjectId(rating.restId),
            orderId: new mongoose.Types.ObjectId(orderId),
            userId: new mongoose.Types.ObjectId(userId),
         });

         if (findRating) {
            findRating.star = rating.star
            findRating.review = rating.review
            data = await commonService.findOneAndUpdate(REST_PACK_RATING_MODEL, findRating._id, findRating);
            // return sendSuccessResponse(res, data, success.SUCCESS, 200);
         } else {
            let detail = {
               restId: new mongoose.Types.ObjectId(rating.restId),
               orderId: new mongoose.Types.ObjectId(orderId),
               userId: new mongoose.Types.ObjectId(userId),
               star: rating.star,
               review: rating.review
            };
            data = await commonService.create(REST_PACK_RATING_MODEL, detail);
            // return sendSuccessResponse(res, data, success.SUCCESS, 200);
         }
      }))
      return sendSuccessResponse(res, {}, success.SUCCESS, 200);

   } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
   }
};

export const getOrderRating = async (req, res) => {
   try {
      let { orderId } = req.params;

      let orderRatings = await REST_PACK_RATING_MODEL.find({ orderId: new mongoose.Types.ObjectId(orderId) }, { restId: 1, star: 1, review: 1 })
         .populate({ path: 'restId', select: 'resName' })

      return sendSuccessResponse(res, orderRatings, success.SUCCESS, 200);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}

// export const migratePackage = async(req,res) =>{
//    try{
//       let {firstName, lastName , countryCode, mobileNumber, orderId, addressId} = req.body
//       const condition = {
//          countryCode: countryCode,
//          mobileNumber: mobileNumber
//       };
//       const userData = await commonService.findOne(UserModel, condition);

//       if (userData) {
//          if (userData.isBlocked) {
//             return sendErrorResponse(res, 'This profile has been blocked', HttpStatus.NOT_FOUND);
//          }
//          userData.otp = 123456;
//          userData.type = 'login';
//          let accessToken = generateJwtToken(
//             {
//                countryCode: countryCode,
//                mobileNumber: mobileNumber,
//                otp: 123456,
//                deviceToken: deviceToken,
//                type: 'login',
//                _id: userData._id,
//             },
//             '1h'
//          ).token;
//          sendSuccessResponse(
//             res,
//             { accessToken: accessToken, countryCode: countryCode, mobileNumber: mobileNumber },
//             success.OTP_SENT,
//             200
//          );
//       } else {
//          req.body.otp = 123456;
//          req.body.type = 'register';
//          let accessToken = generateJwtToken(req.body, '1h').token;
//          sendSuccessResponse(
//             res,
//             { accessToken: accessToken, countryCode: countryCode, mobileNumber: mobileNumber },
//             success.OTP_SENT,
//             200
//          );
//       }
//    }catch(error){

//    }
// }
