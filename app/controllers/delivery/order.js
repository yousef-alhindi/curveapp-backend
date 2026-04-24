import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { Delivery_Model } from '../../models/delivery/delivery.model';
import orderDeliveryModel from '../../models/delivery/orderDelivery.model';
import OrderModel from '../../models/user/order.model';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import UserModel from '../../models/user/user.model';
import { PaymentByAdminModel } from '../../models/admin/paymentByAdmin.model';
import { Commission_Model } from '../../models/admin/commision.model';
import { RATING_MODEL } from '../../models/user/rating.model';
import PackageOrderModel from '../../models/user/packageOrder.model';
import AdminPackageOrderModel from '../../models/user/adminPackageOrder.model';
import SupplementOrderDeliveryModel from '../../models/delivery/supplementDeliveryModel';
import SupplementOrderModel from '../../models/supplement/supplementOrder.model';
import { SUPPLEMENT_ORDER_RATING_MODEL } from '../../models/supplement/supplementRating.model';
const mongoose = require('mongoose'); // mongoose database

const moment = require('moment-timezone');

/****************************************
 *************** SPRINT 4 ****************
 *****************************************/

export const orderDeliveryRequest = async (orderId) => {
   try {
      const order = await OrderModel.findById(orderId).populate({
         path: 'restaurentCartId',
         select: 'restId',
      });

      let restId = order.restaurentCartId.restId;
      const newDelivery = new orderDeliveryModel({
         restId,
         orderId: new mongoose.Types.ObjectId(orderId),
      });

      await newDelivery.save();

      return 'Delivery request created';
   } catch (error) {
      return 'Delivery request not created : ', error;
   }
};

// export const getPendingOrders = async (req, res) => {
//     try {
//       const { deliverBoyId } = req.params;

//       if (!deliverBoyId ) {
//         return sendErrorResponse(res, 'Deliver Boy Id required', HttpStatus.BAD_REQUEST);
//       }

//      const deliverBoyDetails = await Delivery_Model.findOne({_id:new mongoose.Types.ObjectId(deliverBoyId), isBlocked: false}, { location: 1 });

//      if (!deliverBoyDetails ) {
//         return sendErrorResponse(res, 'Please enter correct delivery boy id', HttpStatus.BAD_REQUEST);
//       }

//       let pendingOrders = await orderDeliveryModel.find({
//         $or:[
//           {accepted: true,deliveryBoyId:new mongoose.Types.ObjectId(deliverBoyId),isDelivered:false},
//           {accepted: false,'rejectedBy.deliveryBoyId':{$ne : new mongoose.Types.ObjectId(deliverBoyId)}}
//         ]
//       })
//       .populate({
//           path: 'restId',
//           select: 'location resName addressDetails',
//           match: {
//               location: {
//                   $near: {
//                       $geometry: {
//                           type: 'Point',
//                           coordinates: deliverBoyDetails.location.coordinates, // Delivery boy's location (latitude, longitude)
//                       },
//                       $maxDistance: 10000 // 10 km radius
//                   }
//               }
//           }
//       })
//       .sort({createdAt:-1})

//       pendingOrders = pendingOrders.filter(i => i.restId !== null)

//       // Find the index of the first order with accepted: true
//       const acceptedOrderIndex = pendingOrders.findIndex(i => i.accepted === true);

//       if (acceptedOrderIndex > -1) {
//         // Remove the accepted order from its current position
//         const [acceptedOrder] = pendingOrders.splice(acceptedOrderIndex, 1);

//         // Add the accepted order at the 0th index
//         pendingOrders.unshift(acceptedOrder);
//       }

//       // ----------->> LOGIC FOR PACAGES <<-----------------

//       // Get the current date in milliseconds, starting at 00:00:00 of today
//       const currentDateTime = new Date();
//       const currentDate = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate()).getTime(); // Current date in milliseconds
//       const oneHourLater = currentDate + 60 * 60 * 1000;

//       // Query the PackageOrderModel for package orders where:
//       // 1. The dates array contains the current date with status "active" (1)
//       // 2. The orderStatus is 2 (PREPARING)
//       const resPackageOrdersData = await PackageOrderModel.find({
//         // Check if any of the dates have the current date and orderStatus 2 (PREPARING)
//         dates: {
//           $elemMatch: {
//             date: { $gte: currentDate, $lt: oneHourLater },
//             orderStatus: 2,
//             status: 1
//           }
//         }
//       });

//       console.log("resPackageOrdersData", resPackageOrdersData)

//       res.status(200).json({status:true, message:"Pending Orders list",data:[...pendingOrders, ...resPackageOrdersData]});
//     } catch (error) {
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//     }
//   };

// export const getPendingOrders = async (req, res) => {
//   try {
//     const { deliverBoyId } = req.params;

//     if (!deliverBoyId) {
//       return sendErrorResponse(res, 'Deliver Boy Id required', HttpStatus.BAD_REQUEST);
//     }

//     const deliverBoyDetails = await Delivery_Model.findOne(
//       { _id: new mongoose.Types.ObjectId(deliverBoyId), isBlocked: false },
//       { location: 1 }
//     );

//     if (!deliverBoyDetails) {
//       return sendErrorResponse(res, 'Please enter correct delivery boy id', HttpStatus.BAD_REQUEST);
//     }

//     let pendingOrders = await orderDeliveryModel.find({
//       $or: [
//         { accepted: true, deliveryBoyId: new mongoose.Types.ObjectId(deliverBoyId), isDelivered: false },
//         { accepted: false, 'rejectedBy.deliveryBoyId': { $ne: new mongoose.Types.ObjectId(deliverBoyId) } },
//       ],
//     })
//       .populate({
//         path: 'restId',
//         select: 'location resName addressDetails',
//         match: {
//           location: {
//             $near: {
//               $geometry: {
//                 type: 'Point',
//                 coordinates: deliverBoyDetails.location.coordinates, // Delivery boy's location (latitude, longitude)
//               },
//               $maxDistance: 10000, // 10 km radius
//             },
//           },
//         },
//       })
//       .sort({ createdAt: -1 });

//     pendingOrders = pendingOrders.filter(i => i.restId !== null);

//     // Find the index of the first order with accepted: true
//     const acceptedOrderIndex = pendingOrders.findIndex(i => i.accepted === true);

//     if (acceptedOrderIndex > -1) {
//       // Remove the accepted order from its current position
//       const [acceptedOrder] = pendingOrders.splice(acceptedOrderIndex, 1);

//       // Add the accepted order at the 0th index
//       pendingOrders.unshift(acceptedOrder);
//     }

//     // ----------->> LOGIC FOR PACAGES <<-----------------

//     // Get the current date in milliseconds, starting at 00:00:00 of today
//     const currentDateTime = new Date();
//     const currentDate = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate()).getTime(); // Current date in milliseconds
//     const oneHourLater = currentDate + 60 * 60 * 1000;

//     // Query the PackageOrderModel for package orders where:
//     // 1. The dates array contains the current date with status "active" (1)
//     // 2. The orderStatus is 2 (PREPARING)
//     const resPackageOrdersData = await PackageOrderModel.find({
//       dates: {
//         $elemMatch: {
//           date: { $gte: currentDate, $lt: oneHourLater },
//           orderStatus: 2,
//           status: 1,
//         },
//       },
//     });

//     // Format resPackageOrdersData to match the structure of pendingOrders
//     const formattedPackageOrders = resPackageOrdersData.map((order) => {
//       const restaurantDetails = order.restId || {};
//       return {
//         _id: order._id,
//         orderId: order.orderId,
//         restId: {
//           location: restaurantDetails.location || { type: 'Point', coordinates: [] },
//           addressDetails: restaurantDetails.addressDetails || {},
//           _id: restaurantDetails._id,
//           resName: restaurantDetails.resName || '',
//         },
//         isPickUp: false,
//         isDelivered: false,
//         accepted: false,
//         isDeleted: order.isDeleted || false,
//         deliveryBoyRating: 0,
//         driverReview: '',
//         rejectedBy: order.rejectedBy || [],
//         createdAt: order.createdAt,
//         updatedAt: order.updatedAt,
//       };
//     });

//     // Combine both pendingOrders and formattedPackageOrders
//     const combinedOrders = [...pendingOrders, ...formattedPackageOrders];

//     // Send response
//     res.status(200).json({
//       status: true,
//       message: 'Pending Orders list',
//       data: combinedOrders, // Return the combined list of orders
//     });
//   } catch (error) {
//     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//   }
// };

export const getPendingOrders = async (req, res) => {
   try {
      const { deliverBoyId } = req.params;

      if (!deliverBoyId) {
         return sendErrorResponse(res, 'Deliver Boy Id required', HttpStatus.BAD_REQUEST);
      }

      const deliverBoyDetails = await Delivery_Model.findOne(
         { _id: new mongoose.Types.ObjectId(deliverBoyId), isBlocked: false },
         { location: 1 }
      );

      if (!deliverBoyDetails) {
         return sendErrorResponse(
            res,
            'Please enter correct delivery boy id',
            HttpStatus.BAD_REQUEST
         );
      }

      let pendingOrders = await orderDeliveryModel
         .find({
            $or: [
               {
                  accepted: true,
                  deliveryBoyId: new mongoose.Types.ObjectId(deliverBoyId),
                  isDelivered: false,
                  isDeleted: false
               },
               {
                  accepted: false,
                  'rejectedBy.deliveryBoyId': { $ne: new mongoose.Types.ObjectId(deliverBoyId) },
                  isDeleted: false
               },
            ],
         })
         .populate({
            path: 'restId',
            select: 'location resName addressDetails',
            match: {
               location: {
                  $near: {
                     $geometry: {
                        type: 'Point',
                        coordinates: deliverBoyDetails.location.coordinates, // Delivery boy's location (latitude, longitude)
                     },
                     $maxDistance: 10000, // 10 km radius
                  },
               },
            },
         })
         .sort({ createdAt: -1 });

      pendingOrders = pendingOrders.filter((i) => i.restId !== null);

      // Find the index of the first order with accepted: true
      const acceptedOrderIndex = pendingOrders.findIndex((i) => i.accepted === true);

      if (acceptedOrderIndex > -1) {
         // Remove the accepted order from its current position
         const [acceptedOrder] = pendingOrders.splice(acceptedOrderIndex, 1);

         // Add the accepted order at the 0th index
         pendingOrders.unshift(acceptedOrder);
      }

      pendingOrders = pendingOrders.map((o) => {
         return {
            ...o._doc,
            orderType: 1
         }
      })

      let pendingSupplementOrders = await SupplementOrderDeliveryModel
         .find({
            $or: [
               {
                  accepted: true,
                  deliveryBoyId: new mongoose.Types.ObjectId(deliverBoyId),
                  isDelivered: false,
                  isDeleted: false
               },
               {
                  accepted: false,
                  'rejectedBy.deliveryBoyId': { $ne: new mongoose.Types.ObjectId(deliverBoyId) },
                  isDeleted: false
               },
            ],
         })
         .populate({
            path: 'restId',
            select: 'location resName addressDetails name',
            match: {
               location: {
                  $near: {
                     $geometry: {
                        type: 'Point',
                        coordinates: deliverBoyDetails.location.coordinates, // Delivery boy's location (latitude, longitude)
                     },
                     $maxDistance: 10000, // 10 km radius
                  },
               },
            },
         })
         .sort({ createdAt: -1 });

      pendingSupplementOrders = pendingSupplementOrders.filter((i) => i.restId !== null);

      // Find the index of the first order with accepted: true
      const acceptedSupplementOrderIndex = pendingSupplementOrders.findIndex((i) => i.accepted === true);

      if (acceptedSupplementOrderIndex > -1) {
         // Remove the accepted order from its current position
         const [acceptedOrder] = pendingSupplementOrders.splice(acceptedSupplementOrderIndex, 1);

         // Add the accepted order at the 0th index
         pendingSupplementOrders.unshift(acceptedOrder);
      }

      pendingSupplementOrders = pendingSupplementOrders.map((o) => {
         return {
            ...o._doc,
            orderType: 3
         }
      })

      // ----------->> LOGIC FOR RESTAURANTS PACAGES <<-----------------

      const timeZone = 'Asia/Kolkata';

      const currentDateTime = moment().tz(timeZone);
      const currentDate = currentDateTime.startOf('day').valueOf(); // Get the start of the current day (00:00:00) in milliseconds

      const oneHourLater = currentDate + 60 * 60 * 1000; // 1 hour in milliseconds

      // Query the PackageOrderModel for package orders where:
      // 1. The dates array contains the current date with status "active" (1)
      // 2. The orderStatus is 2 (PREPARING)
      const resPackageOrdersData = await PackageOrderModel.find({
         dates: {
            $elemMatch: {
               date: { $gte: currentDate, $lt: oneHourLater },
               orderStatus: 2,
               status: 1,
               isDelivered: false,
               rejectedBy: { $not: { $elemMatch: { deliveryBoyId: deliverBoyId } } },
            },
         },
      }).populate({
         path: 'restaurentCartId',
         populate: {
            path: 'restId',
            select: 'name location resName addressDetails',
         },
         select: 'restId resName',
      });

      // Format resPackageOrdersData
      const formattedPackageOrders = resPackageOrdersData.map((order) => {
         const restaurantDetails =
            order.restId || (order.restaurentCartId ? order.restaurentCartId.restId : {});

         const matchedDate = order.dates?.find((entry) => entry.date == currentDate) || {};

         return {
            _id: order._id,
            orderId: order._id,
            restId: {
               location: restaurantDetails.location || { type: 'Point', coordinates: [] },
               addressDetails: restaurantDetails.addressDetails || {},
               _id: restaurantDetails._id,
               resName: restaurantDetails.resName || '',
            },
            isPickUp: matchedDate.isPickUp || false,
            isDelivered: matchedDate.isDelivered || false,
            accepted: matchedDate.accepted || false,
            isDeleted: order.isDeleted || false,
            isDeleted: order.isDeleted || false,
            deliveryBoyRating: 0,
            driverReview: '',
            rejectedBy: order.rejectedBy || [],
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            orderType: 2
         };
      });
      
      // ----------->> LOGIC FOR ADMIN PACAGES <<-----------------
      const adminPackageOrdersData = await AdminPackageOrderModel.find({
         'restaurants.dates': {
            $elemMatch: {
               date: { $gte: currentDate, $lt: oneHourLater },
               orderStatus: 2,
               status: 1,
               isDelivered: false,
               rejectedBy: { $not: { $elemMatch: { deliveryBoyId: deliverBoyId } } },
            },
         },
      }).populate({
         path: 'restaurants._id',
         select: 'name location resName addressDetails',
      });
      
      const formattedAdminPackages = adminPackageOrdersData.map((order) => {
         const restaurantDetails = order.restaurants.map((restaurant) => {
            const matchedDate =
            restaurant.dates?.find((entry) => entry.date == currentDate) || {};
            
            return {
               _id: order._id,
               orderId: order._id,
               restId: {
                  location: restaurant._id?.location || { type: 'Point', coordinates: [] },
                  addressDetails: restaurant._id?.addressDetails || {},
                  _id: restaurant._id?._id,
                  resName: restaurant._id?.resName || '',
               },
               isPickUp: matchedDate.isPickUp || false,
               isDelivered: matchedDate.isDelivered || false,
               accepted: matchedDate.accepted || false,
               isDeleted: order.isDeleted || false,
               deliveryBoyRating: 0,
               driverReview: '',
               rejectedBy: matchedDate.rejectedBy || [],
               createdAt: order.createdAt,
               updatedAt: order.updatedAt,
               orderType: 2
            };
         });

         return restaurantDetails;
      });

      const combinedOrders = [...pendingOrders, ...pendingSupplementOrders, ...formattedPackageOrders, ...formattedAdminPackages.flat()];

      const sortedData = combinedOrders.sort((a, b) => b.accepted - a.accepted);

      res.status(200).json({
         status: true,
         message: 'Pending Orders list',
         data: sortedData,
      });
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// export const acceptOrder = async(req,res)=>{

//   try{
//     const { deliveryId } = req.params;
//     const { deliveryBoyId } = req.body;
//     let updatedOrder
//     if (!deliveryBoyId ) {
//       return sendErrorResponse(res, 'Deliver Boy Id required', HttpStatus.BAD_REQUEST);
//   }

//     updatedOrder = await orderDeliveryModel.findByIdAndUpdate(
//       deliveryId,
//         {$set:{deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId), accepted:true}},
//         { new: true }
//     );

//     if (!updatedOrder ) {
//       // updatedOrder = await PackageOrderModel.findByIdAndUpdate({_id : deliveryId},  {$set:{deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId), accepted:true}},
//       // { new: true })

//       const timeZone = 'Asia/Kolkata';

//       const currentDateTime = moment().tz(timeZone);
//       const currentDate = currentDateTime.startOf('day').valueOf();

//       const oneHourLater = currentDate + 60 * 60 * 1000;

//       updatedOrder = await PackageOrderModel.find({
//         _id : deliveryId,
//         dates: {
//           $elemMatch: {
//             date: { $gte: currentDate, $lt: oneHourLater },
//             orderStatus: 2,
//             status: 1,
//           },
//         },
//       }, {$set:{deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId), accepted:true}}, {new : true})
//       if(!updatedOrder){
//         return sendErrorResponse(res, 'Sorry! can not accept order', HttpStatus.BAD_REQUEST);
//       }else {
//           res.status(200).json({status: true , message:"Order Accepted", data:updatedOrder});
//       }
//     }

//     res.status(200).json({status: true , message:"Order Accepted", data:updatedOrder});
//   }catch(error){
//     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//   }
// }

export const acceptOrder = async (req, res) => {
   try {
      const { deliveryId } = req.params;
      const { deliveryBoyId } = req.body;

      if (!deliveryBoyId) {
         return sendErrorResponse(res, 'Delivery Boy ID required', HttpStatus.BAD_REQUEST);
      }

      let updatedOrder = await orderDeliveryModel.findByIdAndUpdate(
         deliveryId,
         { $set: { deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId), accepted: true } },
         { new: true }
      );

      if (!updatedOrder) {
         updatedOrder = await SupplementOrderDeliveryModel.findByIdAndUpdate(
            deliveryId,
            { $set: { deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId), accepted: true } },
            { new: true }
         );
      }

      if (!updatedOrder) {
         const timeZone = 'Asia/Kolkata';
         const currentDateTime = moment().tz(timeZone);
         const currentDate = currentDateTime.startOf('day').valueOf();
         const oneHourLater = currentDate + 60 * 60 * 1000;

         updatedOrder = await PackageOrderModel.findOneAndUpdate(
            {
               _id: deliveryId,
               dates: {
                  $elemMatch: {
                     date: { $gte: currentDate, $lt: oneHourLater },
                     orderStatus: 2,
                     status: 1,
                  },
               },
            },
            {
               $set: {
                  'dates.$.driverId': new mongoose.Types.ObjectId(deliveryBoyId),
                  'dates.$.accepted': true,
               },
            },
            { new: true }
         );
         if (!updatedOrder) {
            updatedOrder = await AdminPackageOrderModel.findOneAndUpdate(
               {
                  _id: deliveryId,
                  restaurants: {
                     $elemMatch: {
                        dates: {
                           $elemMatch: {
                              date: { $gte: currentDate, $lt: oneHourLater },
                              orderStatus: 2,
                              status: 1,
                           },
                        },
                     },
                  },
               },
               {
                  $set: {
                     'restaurants.$[restaurant].dates.$[date].driverId': new mongoose.Types.ObjectId(deliveryBoyId),
                     'restaurants.$[restaurant].dates.$[date].accepted': true,
                  },
               },
               {
                  new: true,
                  arrayFilters: [
                     { 'restaurant.dates': { $exists: true } },
                     { 'date.date': { $gte: currentDate, $lt: oneHourLater } },
                  ],
               }
            );

            if (!updatedOrder) {
               return sendErrorResponse(res, 'Sorry! Cannot accept order', HttpStatus.BAD_REQUEST);
            }
         }
      }
      res.status(200).json({
         status: true,
         message: 'Order Accepted',
         data: updatedOrder,
      });
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// export const rejectOrder = async(req,res)=>{
//   try{
//     const { deliveryId } = req.params;
//     const { deliveryBoyId ,rejectReason} = req.body;

//     if (!deliveryBoyId ) {
//       return sendErrorResponse(res, 'Deliver Boy Id required', HttpStatus.BAD_REQUEST);
//     }

//     let orderDelivery = await orderDeliveryModel.findById(deliveryId);

//     if(!orderDelivery){
//       return sendErrorResponse(res, 'Wrong deliveryId', HttpStatus.BAD_REQUEST);
//     }else{
//       orderDelivery.accepted=false
//       orderDelivery.rejectedBy.push(
//         {
//           deliveryBoyId : new mongoose.Types.ObjectId(deliveryBoyId),
//           rejectReason : rejectReason
//         }
//       )
//     }

//     await orderDelivery.save();

//     res.status(200).json({status: true , message:`Order Rejected by ${deliveryBoyId}`, data:orderDelivery});

//   }catch(error){
//     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//   }
// }

export const rejectOrder = async (req, res) => {
   try {
      const { deliveryId } = req.params;
      const { deliveryBoyId, rejectReason } = req.body;

      if (!deliveryBoyId) {
         return sendErrorResponse(res, 'Delivery Boy ID required', HttpStatus.BAD_REQUEST);
      }

      let orderDelivery = await orderDeliveryModel.findById(deliveryId);

      if (!orderDelivery) {
         orderDelivery = await SupplementOrderDeliveryModel.findById(deliveryId);
      }

      if (orderDelivery) {
         orderDelivery.accepted = false;
         orderDelivery.rejectedBy.push({
            deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId),
            rejectReason: rejectReason || '',
         });
         await orderDelivery.save();
      } else {
         const timeZone = 'Asia/Kolkata';
         const currentDateTime = moment().tz(timeZone);
         const currentDate = currentDateTime.startOf('day').valueOf();
         const oneHourLater = currentDate + 60 * 60 * 1000;

         let updatedOrder = await PackageOrderModel.findOneAndUpdate(
            {
               _id: deliveryId,
               dates: {
                  $elemMatch: {
                     date: { $gte: currentDate, $lt: oneHourLater },
                     orderStatus: 2,
                     status: 1,
                  },
               },
            },
            {
               $push: {
                  'dates.$.rejectedBy': {
                     deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId),
                     rejectReason: rejectReason || '',
                  },
               },
               $set: {
                  'dates.$.accepted': false,
               },
            },
            { new: true }
         );

         if (!updatedOrder) {
            // Update in Admin Package Order Model
            updatedOrder = await AdminPackageOrderModel.findOneAndUpdate(
               {
                  _id: deliveryId,
                  restaurants: {
                     $elemMatch: {
                        dates: {
                           $elemMatch: {
                              date: { $gte: currentDate, $lt: oneHourLater },
                              orderStatus: 2,
                              status: 1,
                           },
                        },
                     },
                  },
               },
               {
                  $push: {
                     'restaurants.$[restaurant].dates.$[date].rejectedBy': {
                        deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId),
                        rejectReason: rejectReason || '',
                     },
                  },
                  $set: {
                     'restaurants.$[restaurant].dates.$[date].accepted': false,
                  },
               },
               {
                  new: true,
                  arrayFilters: [
                     { 'restaurant.dates': { $exists: true } },
                     { 'date.date': { $gte: currentDate, $lt: oneHourLater } },
                  ],
               }
            );

            if (!updatedOrder) {
               return sendErrorResponse(res, 'Sorry! Cannot reject order', HttpStatus.BAD_REQUEST);
            }

            return res.status(200).json({
               status: true,
               message: `Order rejected by ${deliveryBoyId}`,
               data: updatedOrder,
            });
         }

         return res.status(200).json({
            status: true,
            message: `Order rejected by ${deliveryBoyId}`,
            data: updatedOrder,
         });
      }

      res.status(200).json({
         status: true,
         message: `Order rejected by ${deliveryBoyId}`,
         data: orderDelivery,
      });
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};


// export const orderPickup = async(req,res)=>{
//   try{
//     const { deliveryId , deliveryBoyId} = req.params;

//     const deliveryDetails = await orderDeliveryModel.findById(deliveryId);

//     if(!deliveryDetails){
//       return sendErrorResponse(res, 'Wrong Deliver Id', HttpStatus.BAD_REQUEST);
//     }else{

//       if(deliveryDetails.accepted===false){
//         return sendErrorResponse(res, 'Accept the order first', HttpStatus.BAD_REQUEST);
//       }

//       if(deliveryDetails.deliveryBoyId.toString()!==deliveryBoyId){
//         return sendErrorResponse(res, 'Wrong Deliver Boy Id', HttpStatus.BAD_REQUEST);
//       }

//       deliveryDetails.isPickUp = true;
//       deliveryDetails.pickupTime = new Date().getTime();
//       await deliveryDetails.save();

//       const updateOrderStatus = await OrderModel.findByIdAndUpdate(
//         deliveryDetails.orderId,
//         {$set:{status:3}},
//         {new:true}
//       )

//       console.log("updateOrderStatus", updateOrderStatus)
//       if(updateOrderStatus){
//         res.status(200).json({status: true , message:`PickUp by ${deliveryBoyId}`, data:deliveryDetails});
//       }else{
//         return sendErrorResponse(res, 'Order Status not updated to pickup', HttpStatus.BAD_REQUEST);
//       }
//     }

//   }catch(error){
//     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//   }
// }

export const orderPickup = async (req, res) => {
   try {
      const { deliveryId, deliveryBoyId } = req.params;

      const deliveryDetails = await orderDeliveryModel.findById(deliveryId);
      const supplementDeliveryDetails = await SupplementOrderDeliveryModel.findById(deliveryId);

      if (deliveryDetails) {
         if (!deliveryDetails.accepted) {
            return sendErrorResponse(res, 'Accept the order first', HttpStatus.BAD_REQUEST);
         }

         if (deliveryDetails.deliveryBoyId.toString() !== deliveryBoyId) {
            return sendErrorResponse(res, 'Wrong Delivery Boy ID', HttpStatus.BAD_REQUEST);
         }

         deliveryDetails.isPickUp = true;
         deliveryDetails.pickupTime = new Date().getTime();
         await deliveryDetails.save();

         const updateOrderStatus = await OrderModel.findByIdAndUpdate(
            deliveryDetails.orderId,
            { $set: { status: 3 } }, // Picked up
            { new: true }
         );

         if (updateOrderStatus) {
            return res.status(200).json({
               status: true,
               message: `Picked up by ${deliveryBoyId}`,
               data: deliveryDetails,
            });
         } else {
            return sendErrorResponse(
               res,
               'Order status not updated to pickup',
               HttpStatus.BAD_REQUEST
            );
         }
      } else if (supplementDeliveryDetails) {
         if (!supplementDeliveryDetails.accepted) {
            return sendErrorResponse(res, 'Accept the order first', HttpStatus.BAD_REQUEST);
         }

         if (supplementDeliveryDetails.deliveryBoyId.toString() !== deliveryBoyId) {
            return sendErrorResponse(res, 'Wrong Delivery Boy ID', HttpStatus.BAD_REQUEST);
         }

         supplementDeliveryDetails.isPickUp = true;
         supplementDeliveryDetails.pickupTime = new Date().getTime();
         await supplementDeliveryDetails.save();

         const updateOrderStatus = await SupplementOrderModel.findByIdAndUpdate(
            supplementDeliveryDetails.orderId,
            { $set: { status: 3 } }, // Picked up
            { new: true }
         );

         if (updateOrderStatus) {
            return res.status(200).json({
               status: true,
               message: `Picked up by ${deliveryBoyId}`,
               data: supplementDeliveryDetails,
            });
         } else {
            return sendErrorResponse(
               res,
               'Order status not updated to pickup',
               HttpStatus.BAD_REQUEST
            );
         }
      } else {
         const timeZone = 'Asia/Kolkata';
         const currentDateTime = moment().tz(timeZone);
         const currentDate = currentDateTime.startOf('day').valueOf();
         const oneHourLater = currentDate + 60 * 60 * 1000;

         const packageOrder = await PackageOrderModel.findOneAndUpdate(
            {
               _id: deliveryId,
               dates: {
                  $elemMatch: {
                     date: { $gte: currentDate, $lt: oneHourLater },
                     driverId: new mongoose.Types.ObjectId(deliveryBoyId),
                     accepted: true,
                  },
               },
            },
            {
               $set: {
                  'dates.$.isPickUp': true,
                  'dates.$.orderStatus': 3,
                  'dates.$.pickupTime': new Date().getTime(),
               },
            },
            { new: true }
         );

         if (!packageOrder) {
            const adminPackageOrder = await AdminPackageOrderModel.findOneAndUpdate(
               {
                  _id: deliveryId,
                  restaurants: {
                     $elemMatch: {
                        dates: {
                           $elemMatch: {
                              date: { $gte: currentDate, $lt: oneHourLater },
                              driverId: new mongoose.Types.ObjectId(deliveryBoyId),
                              accepted: true,
                           },
                        },
                     },
                  },
               },
               {
                  $set: {
                     'restaurants.$[restaurant].dates.$[date].isPickUp': true,
                     'restaurants.$[restaurant].dates.$[date].orderStatus': 3,
                     'restaurants.$[restaurant].dates.$[date].deliveredTime': new Date().getTime(),
                  },
               },
               {
                  new: true,
                  arrayFilters: [
                     { 'restaurant.dates.date': { $gte: currentDate, $lt: oneHourLater } },
                     { 'date.driverId': new mongoose.Types.ObjectId(deliveryBoyId) },
                  ],
               }
            );

            if (adminPackageOrder) {
               return res.status(200).json({
                  status: true,
                  message: `Delivered by ${deliveryBoyId}`,
                  data: adminPackageOrder,
               });
            } else {
               return sendErrorResponse(
                  res,
                  'Order not found or not picked up by this delivery boy',
                  HttpStatus.BAD_REQUEST
               );
            }
         }
         return res.status(200).json({
            status: true,
            message: `Picked up by ${deliveryBoyId}`,
            data: packageOrder,
         });
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// export const orderDelivered = async(req,res)=>{
//   try{
//     const { deliveryId , deliveryBoyId} = req.params;

//     const deliveryDetails = await orderDeliveryModel.findById(deliveryId);

//     if(!deliveryDetails){
//       return sendErrorResponse(res, 'Wrong Deliver Id', HttpStatus.BAD_REQUEST);
//     }else{

//       if(deliveryDetails.isPickUp===false){
//         return sendErrorResponse(res, 'PickUp the order first', HttpStatus.BAD_REQUEST);
//       }

//       if(deliveryDetails.deliveryBoyId.toString()!==deliveryBoyId){
//         return sendErrorResponse(res, 'Wrong Deliver Boy Id', HttpStatus.BAD_REQUEST);
//       }

//       deliveryDetails.isDelivered = true;
//       deliveryDetails.deliveredTime = new Date().getTime();
//     }

//     await deliveryDetails.save();

//     const updateOrderStatus = await OrderModel.findByIdAndUpdate(
//       deliveryDetails.orderId,
//       {$set:{status:4}},
//       {new:true}
//     )

//     if(updateOrderStatus){
//       res.status(200).json({status: true , message:`Delivered by ${deliveryBoyId}`, data:deliveryDetails});
//     }else{
//       return sendErrorResponse(res, 'Order Status not updated to Delivered', HttpStatus.BAD_REQUEST);
//     }

//   }catch(error){
//     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//   }
// }

export const orderDelivered = async (req, res) => {
   try {
      const { deliveryId, deliveryBoyId } = req.params;

      const deliveryDetails = await orderDeliveryModel.findById(deliveryId);
      const supplementDeliveryDetails = await SupplementOrderDeliveryModel.findById(deliveryId);

      if (deliveryDetails) {
         if (!deliveryDetails.isPickUp) {
            return sendErrorResponse(res, 'Pick up the order first', HttpStatus.BAD_REQUEST);
         }

         if (deliveryDetails.deliveryBoyId.toString() !== deliveryBoyId) {
            return sendErrorResponse(res, 'Wrong Delivery Boy ID', HttpStatus.BAD_REQUEST);
         }

         deliveryDetails.isDelivered = true;
         deliveryDetails.deliveredTime = new Date().getTime();
         await deliveryDetails.save();

         const updateOrderStatus = await OrderModel.findByIdAndUpdate(
            deliveryDetails.orderId,
            { $set: { status: 4 } }, // Delivered
            { new: true }
         );

         if (updateOrderStatus) {
            return res.status(200).json({
               status: true,
               message: `Delivered by ${deliveryBoyId}`,
               data: deliveryDetails,
            });
         } else {
            return sendErrorResponse(
               res,
               'Order status not updated to Delivered',
               HttpStatus.BAD_REQUEST
            );
         }
      } else if (supplementDeliveryDetails) {
         if (!supplementDeliveryDetails.isPickUp) {
            return sendErrorResponse(res, 'Pick up the order first', HttpStatus.BAD_REQUEST);
         }

         if (supplementDeliveryDetails.deliveryBoyId.toString() !== deliveryBoyId) {
            return sendErrorResponse(res, 'Wrong Delivery Boy ID', HttpStatus.BAD_REQUEST);
         }

         supplementDeliveryDetails.isDelivered = true;
         supplementDeliveryDetails.deliveredTime = new Date().getTime();
         await supplementDeliveryDetails.save();

         const updateOrderStatus = await SupplementOrderModel.findByIdAndUpdate(
            supplementDeliveryDetails.orderId,
            { $set: { status: 4 } }, // Delivered
            { new: true }
         );

         if (updateOrderStatus) {
            return res.status(200).json({
               status: true,
               message: `Delivered by ${deliveryBoyId}`,
               data: supplementDeliveryDetails,
            });
         } else {
            return sendErrorResponse(
               res,
               'Order status not updated to Delivered',
               HttpStatus.BAD_REQUEST
            );
         }
      } else {
         const timeZone = 'Asia/Kolkata';
         const currentDateTime = moment().tz(timeZone);
         const currentDate = currentDateTime.startOf('day').valueOf();
         const oneHourLater = currentDate + 60 * 60 * 1000;

         const packageOrder = await PackageOrderModel.findOneAndUpdate(
            {
               _id: deliveryId,
               dates: {
                  $elemMatch: {
                     date: { $gte: currentDate, $lt: oneHourLater },
                     driverId: new mongoose.Types.ObjectId(deliveryBoyId),
                     isPickUp: true,
                  },
               },
            },
            {
               $set: {
                  'dates.$.isDelivered': true,
                  'dates.$.orderStatus': true,
                  'dates.$.deliveredTime': new Date().getTime(),
               },
            },
            { new: true }
         );

         if (!packageOrder) {
            const adminPackageOrder = await AdminPackageOrderModel.findOneAndUpdate(
               {
                  _id: deliveryId,
                  restaurants: {
                     $elemMatch: {
                        dates: {
                           $elemMatch: {
                              date: { $gte: currentDate, $lt: oneHourLater },
                              driverId: new mongoose.Types.ObjectId(deliveryBoyId),
                              isPickUp: true,
                           },
                        },
                     },
                  },
               },
               {
                  $set: {
                     'restaurants.$[restaurant].dates.$[date].isDelivered': true,
                     'restaurants.$[restaurant].dates.$[date].orderStatus': 4,
                     'restaurants.$[restaurant].dates.$[date].deliveredTime': new Date().getTime(),
                  },
               },
               {
                  new: true,
                  arrayFilters: [
                     { 'restaurant.dates.date': { $gte: currentDate, $lt: oneHourLater } },
                     { 'date.driverId': new mongoose.Types.ObjectId(deliveryBoyId) },
                  ],
               }
            );

            if (adminPackageOrder) {
               return res.status(200).json({
                  status: true,
                  message: `Delivered by ${deliveryBoyId}`,
                  data: adminPackageOrder,
               });
            } else {
               return sendErrorResponse(
                  res,
                  'Order not found or not picked up by this delivery boy',
                  HttpStatus.BAD_REQUEST
               );
            }
         }
         return res.status(200).json({
            status: true,
            message: `Delivered by ${deliveryBoyId}`,
            data: packageOrder,
         });
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// export const deliveryDetails = async(req,res)=>{
//   try{
//   const {deliveryId} = req.params;

//   const deliveryDetails = await orderDeliveryModel.findById(deliveryId)
//   .populate({
//     path: 'restId',
//     select: 'location resName addressDetails profileImage',
//   })
//   .populate({
//     path: 'orderId',
//     select: 'orderId userId addressId',
//     // populate :({
//     //   path : 'userId',
//     //   select: 'countryCode mobileNumber fullName profileImage',
//     // }),
//     populate :({
//       path : 'addressId',
//       select: 'location address houseNo buildingName landmarkName addressLabel',
//     })
//   })

//   if (!deliveryDetails) {
//     res.status(404).json({status:true, message: 'Delivery data not found' ,data:{}});
//   }else{
//     let userData = await UserModel.findOne({_id:deliveryDetails.orderId.userId});

//     let filteredUserData = {"countryCode":userData.countryCode ,"mobileNumber":userData.mobileNumber,
//       "fullName":userData.fullName ,profileImage:userData.profileImage}

//       let response ={
//         ...deliveryDetails._doc,
//         userData :filteredUserData

//       }

//       res.status(200).json({status: true , message:"Delivery Data", data:response});
//   }
//   }catch(error){
//     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//   }
// }

// export const deliveryDetails = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;

//     let deliveryDetails = await orderDeliveryModel
//       .findById(deliveryId)
//       .populate({
//         path: 'restId',
//         select: 'location resName addressDetails profileImage',
//       })
//       .populate({
//         path: 'orderId',
//         select: 'orderId userId addressId',
//         populate: {
//           path: 'addressId',
//           select: 'location address houseNo buildingName landmarkName addressLabel',
//         },
//       });

//     if (!deliveryDetails) {
//       deliveryDetails = await PackageOrderModel.findById(deliveryId)
//         .populate({
//           path: 'packageDetails.categories',
//           populate: {
//             path: 'totalItems substituteItems',
//           },
//         })
//         .populate({
//           path: 'restaurentCartId',
//           populate: {
//             path: 'restId',
//             select: 'location resName addressDetails profileImage',
//           },
//         })
//         .populate('addressId');

//       if (!deliveryDetails) {
//         return res.status(404).json({
//           status: false,
//           message: 'Delivery data not found',
//           data: {},
//         });
//       }

//       const { packageDetails, restaurentCartId, orderId, userId } = deliveryDetails;
//       const categories = packageDetails?.categories || [];
//       const restaurant = restaurentCartId?.restId || {};
//       const address = deliveryDetails?.addressId || {};

//       const userData = await UserModel.findById(userId);
//       if (!userData) {
//         return res.status(404).json({
//           status: false,
//           message: 'User data not found',
//           data: {},
//         });
//       }

//       const response = {
//         _id: deliveryDetails._id,
//         orderId: {
//           _id: deliveryDetails._id || null,
//           userId: userId || null,
//           addressId: {
//             location: address?.location || null,
//             _id: address?._id || null,
//             address: address?.address || null,
//             houseNo: address?.houseNo || '',
//             buildingName: address?.buildingName || '',
//             landmarkName: address?.landmarkName || '',
//             addressLabel: address?.addressLabel || null,
//           },
//           orderId: deliveryDetails?.orderId || null,
//         },
//         restId: {
//           location: restaurant?.location || null,
//           addressDetails: restaurant?.addressDetails || {},
//           _id: restaurant?._id || null,
//           profileImage: restaurant?.profileImage || '',
//           resName: restaurant?.resName || '',
//         },
//         isPickUp: deliveryDetails.isPickUp || false,
//         isDelivered: deliveryDetails.isDelivered || false,
//         accepted: deliveryDetails.accepted || false,
//         isDeleted: deliveryDetails.isDeleted || false,
//         deliveryBoyRating: deliveryDetails.deliveryBoyRating || 0,
//         driverReview: deliveryDetails.driverReview || '',
//         rejectedBy: deliveryDetails.rejectedBy || [],
//         createdAt: deliveryDetails.createdAt || null,
//         updatedAt: deliveryDetails.updatedAt || null,
//         deliveryBoyId: deliveryDetails.deliveryBoyId || null,
//         userData: {
//           countryCode: userData.countryCode,
//           mobileNumber: userData.mobileNumber,
//           fullName: userData.fullName,
//           profileImage: userData.profileImage,
//         },
//       };

//       return res.status(200).json({
//         status: true,
//         message: 'Delivery Data',
//         data: response,
//       });
//     }

//     return res.status(200).json({
//       status: true,
//       message: 'Delivery Data',
//       data: deliveryDetails,
//     });

//   } catch (error) {
//     console.error('Error in deliveryDetails:', error);
//     return res.status(500).json({
//       status: false,
//       message: 'Something went wrong',
//       error: error.message,
//     });
//   }
// };

export const deliveryDetails = async (req, res) => {
   try {
      const { deliveryId } = req.params;
      let deliveryDetails = await orderDeliveryModel
         .findById(deliveryId)
         .populate({
            path: 'restId',
            select: 'location resName addressDetails profileImage',
         })
         .populate({
            path: 'orderId',
            select: 'orderId userId addressId',
            populate: {
               path: 'addressId',
               select: 'location address houseNo buildingName landmarkName addressLabel',
            },
         });

      if (!deliveryDetails) {
         deliveryDetails = await SupplementOrderDeliveryModel
            .findById(deliveryId)
            .populate({
               path: 'restId',
               select: 'location name addressDetails profileImage',
            })
            .populate({
               path: 'orderId',
               select: 'orderId userId addressId',
               populate: {
                  path: 'addressId',
                  select: 'location address houseNo buildingName landmarkName addressLabel',
               },
            });
      }

      if (!deliveryDetails) {
         deliveryDetails = await PackageOrderModel.findById(deliveryId)
            .populate({
               path: 'packageDetails.categories',
               populate: {
                  path: 'totalItems substituteItems',
               },
            })
            .populate({
               path: 'restaurentCartId',
               populate: {
                  path: 'restId',
                  select: 'location resName addressDetails profileImage',
               },
            })
            .populate('addressId');

         if (!deliveryDetails) {
            deliveryDetails = await AdminPackageOrderModel.findById(deliveryId)
               .populate({
                  path: 'restaurants',
                  populate: {
                     path: 'restId',
                     select: 'location resName addressDetails profileImage',
                  },
               })
               .populate('addressId');

            if (!deliveryDetails) {
               return res.status(404).json({
                  status: false,
                  message: 'Delivery data not found',
                  data: {},
               });
            }
            const { restaurants, userId } = deliveryDetails;
            const restaurant = restaurants?.[0]?._id || {};
            const address = deliveryDetails?.addressId || {};

            const restData = await RestaurantModel.findOne({ _id: restaurant })
            const userData = await UserModel.findById(userId);
            if (!userData) {
               return res.status(404).json({
                  status: false,
                  message: 'User data not found',
                  data: {},
               });
            }

            const timeZone = 'Asia/Kolkata';
            const currentDateTime = moment().tz(timeZone);
            const currentDate = currentDateTime.startOf('day').valueOf();

            const matchedDate =
               restaurants?.[0]?.dates?.find((entry) => entry.date == currentDate) || {};

            const response = {
               _id: deliveryDetails._id,
               orderId: {
                  _id: deliveryDetails._id || null,
                  userId: userId || null,
                  addressId: {
                     location: address?.location || null,
                     _id: address?._id || null,
                     address: address?.address || null,
                     houseNo: address?.houseNo || '',
                     buildingName: address?.buildingName || '',
                     landmarkName: address?.landmarkName || '',
                     addressLabel: address?.addressLabel || null,
                  },
                  orderId: deliveryDetails?.orderId || null,
               },
               restId: {
                  location: restData?.location || null,
                  addressDetails: restData?.addressDetails || {},
                  _id: restData?._id || null,
                  profileImage: restData?.profileImage || '',
                  resName: restData?.resName || '',
               },
               isPickUp: matchedDate.isPickUp || false,
               isDelivered: matchedDate.isDelivered || false,
               deliveredTime: matchedDate.deliveredTime || new Date().getTime(),
               accepted: matchedDate.accepted || false,
               isDeleted: deliveryDetails.isDeleted || false,
               deliveryBoyRating: deliveryDetails.deliveryBoyRating || 0,
               driverReview: deliveryDetails.driverReview || '',
               rejectedBy: deliveryDetails.rejectedBy || [],
               createdAt: deliveryDetails.createdAt || null,
               updatedAt: deliveryDetails.updatedAt || null,
               deliveryBoyId: deliveryDetails.deliveryBoyId || null,
               userData: {
                  countryCode: userData.countryCode,
                  mobileNumber: userData.mobileNumber,
                  fullName: userData.fullName,
                  profileImage: userData.profileImage,
               },
               orderType: 3, // For Admin Package Orders
            };

            return res.status(200).json({
               status: true,
               message: 'Delivery Data',
               data: response,
            });
         }

         const { packageDetails, restaurentCartId, orderId, userId } = deliveryDetails;
         const categories = packageDetails?.categories || [];
         const restaurant = restaurentCartId?.restId || {};
         const address = deliveryDetails?.addressId || {};

         const userData = await UserModel.findById(userId);
         if (!userData) {
            return res.status(404).json({
               status: false,
               message: 'User data not found',
               data: {},
            });
         }

         const timeZone = 'Asia/Kolkata';
         const currentDateTime = moment().tz(timeZone);
         const currentDate = currentDateTime.startOf('day').valueOf();

         const matchedDate =
            deliveryDetails.dates?.find((entry) => entry.date == currentDate) || {};

         const response = {
            _id: deliveryDetails._id,
            orderId: {
               _id: deliveryDetails._id || null,
               userId: userId || null,
               addressId: {
                  location: address?.location || null,
                  _id: address?._id || null,
                  address: address?.address || null,
                  houseNo: address?.houseNo || '',
                  buildingName: address?.buildingName || '',
                  landmarkName: address?.landmarkName || '',
                  addressLabel: address?.addressLabel || null,
               },
               orderId: deliveryDetails?.orderId || null,
            },
            restId: {
               location: restaurant?.location || null,
               addressDetails: restaurant?.addressDetails || {},
               _id: restaurant?._id || null,
               profileImage: restaurant?.profileImage || '',
               resName: restaurant?.resName || '',
            },
            isPickUp: matchedDate.isPickUp || false,
            isDelivered: matchedDate.isDelivered || false,
            deliveredTime: matchedDate.deliveredTime || new Date().getTime(),
            accepted: matchedDate.accepted || false,
            isDeleted: deliveryDetails.isDeleted || false,
            deliveryBoyRating: deliveryDetails.deliveryBoyRating || 0,
            driverReview: deliveryDetails.driverReview || '',
            rejectedBy: deliveryDetails.rejectedBy || [],
            createdAt: deliveryDetails.createdAt || null,
            updatedAt: deliveryDetails.updatedAt || null,
            deliveryBoyId: deliveryDetails.deliveryBoyId || null,
            userData: {
               countryCode: userData.countryCode,
               mobileNumber: userData.mobileNumber,
               fullName: userData.fullName,
               profileImage: userData.profileImage,
            },
            orderType: 2, // For Package Orders
         };

         return res.status(200).json({
            status: true,
            message: 'Delivery Data',
            data: response,
         });
      }

      const userData = await UserModel.findById(deliveryDetails.orderId.userId);
      if (!userData) {
         return res.status(404).json({
            status: false,
            message: 'User data not found',
            data: {},
         });
      }

      const response = {
         ...deliveryDetails._doc,
         userData: {
            countryCode: userData.countryCode,
            mobileNumber: userData.mobileNumber,
            fullName: userData.fullName,
            profileImage: userData.profileImage,
         },
         orderType: 1, // For Food Orders
      };

      return res.status(200).json({
         status: true,
         message: 'Delivery Data',
         data: response,
      });
   } catch (error) {
      console.error('Error in deliveryDetails:', error);
      return res.status(500).json({
         status: false,
         message: 'Something went wrong',
         error: error.message,
      });
   }
};


export const dashboardData = async (req, res) => {
   try {
      const { deliveryBoyId } = req.query;
      let totalOrders = await orderDeliveryModel.countDocuments({
         deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId),
         isDelivered: true,
         isDeleted: false
      });

      let deliveryOrderDetails = await orderDeliveryModel.find({
         deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoyId),
         isDelivered: true,
      });

      let totalEarnAmount = 0;
      if (deliveryOrderDetails.length > 0) {
         const totalEarningPromises = deliveryOrderDetails.map(async (order) => {
            let query = {
               isDeleted: false,
               status: 4,
               _id: order.orderId,
            };
            const orderDetails = await OrderModel.find(query).lean(true);

            const totalEarning =
               orderDetails.length > 0
                  ? orderDetails.reduce((acc, order) => acc + order.totalAmount, 0)
                  : 0;
            return totalEarning;
         });

         // Resolve all earnings and calculate the total for the restaurant
         const totalEarningsArray = await Promise.all(totalEarningPromises);
         totalEarnAmount = totalEarningsArray.reduce((acc, earning) => acc + earning, 0);
         // paidByAdmin.map((item)=>{
         //   totalEarnings = totalEarnings + item.amount
         // })
      }

      let data = {
         totalOrders,
         totalEarnings: totalEarnAmount,
      };
      res.status(200).json({
         status: true,
         message: 'Delivery Boy Dashboard Data fetched successfully',
         data: data,
      });
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const myEarnings = async (req, res) => {
   try {
      const deliveryBoy = req.deliveryData;
      const { startDate, endDate } = req.body;

      let adminCommission = 0;
      let totalAmount = 0;
      let adminCommissionRate;

      const dateQuery = {
         deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoy._id),
         isDelivered: true,
         isDeleted: false,
      };

      if (startDate && endDate) {
         dateQuery.createdAt = {
            $gte: new Date(startDate).getTime(),
            $lte: new Date(endDate).getTime(),
         };
      }

      // Fetch data from both models
      const [
         totalOrdersFromOrders,
         orderTransactionHistory,
         totalOrdersFromSupplements,
         supplementOrderTransactionHistory,
      ] = await Promise.all([
         orderDeliveryModel.countDocuments({ ...dateQuery }),
         orderDeliveryModel
            .find({ ...dateQuery })
            .populate(
               'orderId',
               'orderId orderType deliveryOption totalItemAmount deliveryAmount totalAmount discountedAmount'
            ),
         SupplementOrderDeliveryModel.countDocuments({ ...dateQuery }),
         SupplementOrderDeliveryModel
            .find({ ...dateQuery })
            .populate(
               'orderId',
               'orderId orderType deliveryOption totalItemAmount deliveryAmount totalAmount discountedAmount'
            ),
      ]);

      // Combine total amounts from both models
      const totalAmountFromOrders = orderTransactionHistory.reduce((acc, order) => {
         if (order.orderId && order.orderId.totalAmount) {
            return acc + order.orderId.totalAmount;
         } else {
            return acc;
         }
      }, 0);

      const totalAmountFromSupplements = supplementOrderTransactionHistory.reduce((acc, order) => {
         if (order.orderId && order.orderId.totalAmount) {
            return acc + order.orderId.totalAmount;
         } else {
            return acc;
         }
      }, 0);

      totalAmount = totalAmountFromOrders + totalAmountFromSupplements;

      // Fetch admin commission rate
      adminCommissionRate = await Commission_Model.findOne({ service: 6 });
      adminCommission = (Number(totalAmount) * Number(adminCommissionRate.percentage)) / 100;

      const statesData = {
         totalEarned: totalAmount,
         totalOrders: totalOrdersFromOrders + totalOrdersFromSupplements,
         adminCommission,
         totalKMTravel: 0,
         pendingAmount: 0,
      };

      res.status(200).json({
         status: true,
         message: 'My Earning Data fetched successfully',
         data: { statesData, orderTransactionHistory: [...orderTransactionHistory, ...supplementOrderTransactionHistory] },
      });
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
   }
};

// export const getOrderRatings = async (req, res) => {
//   try {
//     const deliveryBoy = req.deliveryData;

//     const orderDeliveryData = await orderDeliveryModel.find({
//       // deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoy._id),
//       // isDelivered: true
//     });

//     const orderIds = orderDeliveryData.map(order => order.orderId);

//     const ratingsData = await RATING_MODEL.find({
//       orderId: { $in: orderIds }
//     }).populate('orderId', 'orderId orderType deliveryOption totalItemAmount deliveryAmount totalAmount discountedAmount');

//     res.status(200).json({
//       status: true,
//       message: "Ratings fetched successfully",
//       data: ratingsData
//     });

//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: error.message
//     });
//   }
// };

export const getOrderRatings = async (req, res) => {
   try {
      let { accesstoken } = req.headers;

      const deliveryBoy = await Delivery_Model.findOne({ accessToken: accesstoken });

      const orderDeliveryData = await orderDeliveryModel.find({
         deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoy._id),
         isDelivered: true,
         isDeleted: false
      });
      const supplementOrderDeliveryData = await SupplementOrderDeliveryModel.find({
         deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoy._id),
         isDelivered: true,
         isDeleted: false
      });

      const orderIds = orderDeliveryData.map((order) => order.orderId);
      const supplementOrderIds = supplementOrderDeliveryData.map((order) => order.orderId);

      const ratingsData = await RATING_MODEL.find({
         orderId: { $in: orderIds },
      }).populate(
         'orderId',
         'orderId orderType deliveryOption totalItemAmount deliveryAmount totalAmount discountedAmount'
      );

      const supplementRatingsData = await SUPPLEMENT_ORDER_RATING_MODEL.find({
         orderId: { $in: supplementOrderIds },
      }).populate(
         'orderId',
         'orderId orderType deliveryOption totalItemAmount deliveryAmount totalAmount discountedAmount'
      );

      const updatedRatingsData = ratingsData.map((rating) => {
         if (!rating.orderId) {
            return {
               ...rating.toObject(),
               deliveryBoyRating: null,
               driverReview: null,
            };
         }

         const orderDelivery = orderDeliveryData.find(
            (delivery) => delivery.orderId?.toString() === rating.orderId._id?.toString()
         );

         return {
            ...rating.toObject(),
            deliveryBoyRating: orderDelivery?.deliveryBoyRating || 0,
            driverReview: orderDelivery?.driverReview || '',
         };
      });

      const updatedSupplementRatingsData = supplementRatingsData.map((rating) => {
         if (!rating.orderId) {
            return {
               ...rating.toObject(),
               deliveryBoyRating: null,
               driverReview: null,
            };
         }

         return {
            ...rating.toObject(),
            deliveryBoyRating: rating?.deliveryRating || 0,
            driverReview: rating?.deliveryReview || '',
         };
      });

      // Send the response
      res.status(200).json({
         status: true,
         message: 'Ratings fetched successfully',
         data: [...updatedRatingsData, ...updatedSupplementRatingsData],
      });
   } catch (error) {
      // Handle errors
      return res.status(500).json({
         status: false,
         message: error.message,
      });
   }
};

export const getOrdersList = async (req, res) => {
   try {
      const deliveryBoy = req.deliveryData;

      const orderDeliveryData = await orderDeliveryModel
         .find({
            deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoy._id),
            isDelivered: true,
            isDeleted: false
         })
         .populate(
            'orderId restId',
            'orderId orderType deliveryOption totalItemAmount deliveryAmount totalAmount discountedAmount resName ownerName location addressDetails'
         );

      const supplementOrderDeliveryData = await SupplementOrderDeliveryModel
         .find({
            deliveryBoyId: new mongoose.Types.ObjectId(deliveryBoy._id),
            isDelivered: true,
            isDeleted: false
         })
         .populate(
            'orderId restId',
            'orderId orderType deliveryOption totalItemAmount deliveryAmount totalAmount discountedAmount name ownerName location addressDetails'
         );

      const formattedOrderDeliveryData = orderDeliveryData.map((order) => ({
         ...order._doc,
         orderType: 1, // for Normal Food Order
      }));
      const formattedSupplementOrderDeliveryData = supplementOrderDeliveryData.map((order) => ({
         ...order._doc,
         orderType: 3, // for Normal Food Order
      }));
      // Query the PackageOrderModel for package orders where:
      // 1. The dates array contains the current date with status "active" (1)
      // 2. The orderStatus is 2 (PREPARING)
      const resPackageOrdersData = await PackageOrderModel.find({
         dates: {
            $elemMatch: {
               isDelivered: true,
               driverId: new mongoose.Types.ObjectId(deliveryBoy._id),
            },
         },
      }).populate({
         path: 'restaurentCartId',
         populate: {
            path: 'restId',
            select: 'name location resName addressDetails',
         },
         select: 'restId resName',
      });

      const formattedPackageOrders = resPackageOrdersData.map((order) => {
         const restaurantDetails =
            order.restId || (order.restaurentCartId ? order.restaurentCartId.restId : {});

         const matchedDate =
            order.dates?.find(
               (entry) => (entry.driverId = new mongoose.Types.ObjectId(deliveryBoy._id))
            ) || {};

         return {
            _id: order._id,
            orderId: {
               _id: order._id,
               orderId: order.orderId,
               orderType: 1,
               totalItemAmount: 0,
               deliveryAmount: 0,
               totalAmount: 0,
               discountedAmount: 0,
               deliveryOption: 0,
            },
            restId: {
               location: restaurantDetails.location || { type: 'Point', coordinates: [] },
               addressDetails: restaurantDetails.addressDetails || {},
               _id: restaurantDetails._id,
               resName: restaurantDetails.resName || '',
            },
            isPickUp: matchedDate.isPickUp || false,
            isDelivered: matchedDate.isDelivered || false,
            accepted: matchedDate.accepted || false,
            deliveredTime: matchedDate.deliveredTime || new Date().getTime(),
            isDeleted: order.isDeleted || false,
            deliveryBoyRating: 0,
            driverReview: '',
            rejectedBy: order.rejectedBy || [],
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            orderType: 2 // For Package 
         };
      });

      const combinedOrders = [...formattedOrderDeliveryData, ...formattedSupplementOrderDeliveryData, ...formattedPackageOrders];
      res.status(200).json({
         status: true,
         message: 'Order list successfully',
         data: combinedOrders,
      });
   } catch (error) {
      return res.status(500).json({
         status: false,
         message: error.message,
      });
   }
};
