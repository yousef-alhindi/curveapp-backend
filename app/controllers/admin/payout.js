import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import HttpStatus from 'http-status-codes';
import OrderModel from '../../models/user/order.model';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';
import randomize from 'randomatic';
import { PaymentByAdminModel } from '../../models/admin/paymentByAdmin.model';
import mongoose from 'mongoose';
import { calculateAdminCommission } from '../../services/common/calculateCommission.service';
import { paymentFor } from '../../constants/wallet.constants';
import { customPaginate } from '../../services/common/customPagination.service';
import { Delivery_Model } from '../../models/delivery/delivery.model';
import OrderDeliveryModel from '../../models/delivery/orderDelivery.model';
import { SupplementCartModel } from '../../models/user/supplementCart.model';
import { SupplementSellerModel } from '../../models/supplement/supplementSeller.model';
import SupplementOrderModel from '../../models/supplement/supplementOrder.model';
import { GymModel } from '../../models/gym/gym.model';
import { GymCartModel } from '../../models/user/gymCart.model';
import GymSubscriptions from '../../models/gym/gymSubscriptions';

export const getAllRestuarantPayoutHistory = async (req, res) => {
   try {
      let { restuarantType, page, pageSize, search, fromDate, toDate } = req.query;
      let query = {
         isDeleted: false,
         restaurantStatus: 1,
         ...(restuarantType ? { profileType: Number(restuarantType) } : {}),
         ...(search ? { resName: { $regex: search, $options: 'i' } } : {})
      };

      // Fetch restaurant details
      const resturantResponse = await RestaurantModel.find(query)
         .select('resName profileType')
         .lean(true); // Use .lean() for better performance

      if (resturantResponse.length > 0) {
         // Use Promise.all to fetch restaurant carts and calculate earnings concurrently
         const updatedRestaurantResponse = await Promise.all(
            resturantResponse.map(async (resturant) => {
               // Fetch restaurant carts
               const resturantCart = await Restaurant_Cart_Model.find({
                  restId: resturant._id,
                  isDeleted: false,
               })
                  .select('restId')
                  .lean(true);

               if (resturantCart.length > 0) {
                  // Calculate total earnings from orders
                  const totalEarningPromises = resturantCart.map(async (cart) => {
                     let query = {
                        isDeleted: false,
                        status: 4,
                        restaurentCartId: cart._id,
                        // ...((fromDate && toDate) ? { createdAt: {$gte: parseInt(fromDate), $lte: parseInt(toDate)}} : {})
                     };

                     // Fetch order details
                     const orderDetails = await OrderModel.find(query).lean(true);

                     // Calculate total earnings for this cart
                     const totalEarning = orderDetails.reduce(
                        (acc, order) => acc + order.totalAmount,
                        0
                     );
                     return totalEarning;
                  });

                  // Resolve all earnings and calculate the total for the restaurant
                  const totalEarningsArray = await Promise.all(totalEarningPromises);
                  const totalEarnAmount = totalEarningsArray.reduce(
                     (acc, earning) => acc + earning,
                     0
                  );

                  // Fetch admin commission based on total earnings
                  const adminCommission = await calculateAdminCommission(1, totalEarnAmount);

                  // Fetch last payout data
                  const lastPayoutData = await PaymentByAdminModel.findOne({
                     restuarantId: resturant._id,
                     paymentFor: 1,
                  })
                     .sort({ createdAt: -1 })
                     .lean(true);
                  console.log(lastPayoutData, 'test', resturant._id);
                  // Fetch all payout data and calculate the total payout amount
                  const totalPayoutData = await PaymentByAdminModel.find({
                     restuarantId: resturant._id,
                     paymentFor: 1,
                     // ...((fromDate && toDate) ? { fromDate : {}} : {})
                  }).lean(true);

                  let totalPayoutAmount = 0;
                  if (totalPayoutData && totalPayoutData.length > 0) {
                     totalPayoutAmount = totalPayoutData.reduce(
                        (acc, payout) => acc + payout.amount,
                        0
                     );
                  }

                  // Build and return the restaurant object with all required fields
                  return {
                     _id: resturant._id,
                     resName: resturant.resName,
                     profileType: resturant.profileType,
                     totalEarning: totalEarnAmount,
                     totalPlatformCommission: adminCommission || 0,
                     lastPayoutDate: lastPayoutData?.createdAt || null,
                     lastPaidAmount: lastPayoutData?.amount || 0,
                     totalPayoutPending: (totalEarnAmount - adminCommission - totalPayoutAmount),
                  };
               } else {
                  // If no carts, set totalEarning and other fields to default
                  return {
                     _id: resturant._id,
                     resName: resturant.resName,
                     profileType: resturant.profileType,
                     totalEarning: 0,
                     totalPlatformCommission: 0,
                     lastPayoutDate: null,
                     lastPaidAmount: 0,
                     totalPayoutPending: 0,
                  };
               }
            })
         );

         const paginateData = customPaginate(updatedRestaurantResponse, page, pageSize);
         const result = {
            page,
            pageSize,
            totalCount: updatedRestaurantResponse.length,
            data: paginateData
         }

         // Send the updated response
         return sendSuccessResponse(
            res,
            result, // Return the updated array here
            'Fetched restaurant payout history successfully!',
            HttpStatus.OK
         );
      }

      // If no restaurants were found
      return sendSuccessResponse(res, [], 'No restaurants found', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const payoutToRestuarantByAdmin = async (req, res) => {
   try {
      req.body.paymentById = req.adminData._id;
      req.body.transactionId = '#' + randomize('0', 9);
      req.body.restuarantId = new mongoose.Types.ObjectId(req.body.restuarantId);

      console.log(req.adminData._id, req.body);

      const response = await PaymentByAdminModel.create(req.body);
      return sendSuccessResponse(res, response, 'Payment added to restuarant!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const payoutToRestuarantByAdminByRestuarantId = async (req, res) => {
   try {
      const restId = req.params.restId;
      let { search, fromDate, toDate, page, pageSize } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;
      let query = {
         restuarantId: new mongoose.Types.ObjectId(restId),
         paymentFor: 1,
         isDeleted: false,
         ...(search ? { transactionId: search } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      }
      const totalCounts = await PaymentByAdminModel.countDocuments(query);
      const response = await PaymentByAdminModel.find(query).skip(((page - 1) * pageSize)).limit(pageSize).lean(true);
      const restult = {
         page: page,
         pageSize: pageSize,
         totalCount: totalCounts,
         payoutHistory: response,
      }
      return sendSuccessResponse(res, restult, 'Fetch payout history successfully!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// start payout to drivers management
export const payoutToDriverByAdmin = async (req, res) => {
   try {
      req.body.paymentById = req.adminData._id;
      req.body.transactionId = '#' + randomize('0', 9);
      req.body.driverId = new mongoose.Types.ObjectId(req.body.driverId);
      req.body.paymentFor = 2;

      const response = await PaymentByAdminModel.create(req.body);
      return sendSuccessResponse(res, response, 'Payment added to driver!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getAllDriverPayoutHistory = async (req, res) => {
   try {
      let { page, pageSize, search, fromDate, toDate } = req.query;
      let query = {
         isDeleted: false,
         fullyVerify: 1,
         ...(search ? { name: { $regex: search, $options: 'i' } } : {})
      };

      // Fetch restaurant details
      const driverResponse = await Delivery_Model.find(query)
         .select('name')
         .lean(true); // Use .lean() for better performance

      if (driverResponse.length > 0) {
         const updatedriverResponse = await Promise.all(
            driverResponse.map(async (driver) => {
               const deliveryOrderDetails = await OrderDeliveryModel.find({ deliveryBoyId: driver._id, isDelivered: true });

               if (deliveryOrderDetails.length > 0) {
                  const totalEarningPromises = deliveryOrderDetails.map(async (order) => {
                     let query = {
                        isDeleted: false,
                        status: 4,
                        _id: order.orderId,
                     };
                     const orderDetails = await OrderModel.find(query).lean(true);

                     const totalEarning = orderDetails.length > 0 ? orderDetails.reduce(
                        (acc, order) => acc + order.totalAmount,
                        0
                     ) : 0;
                     return totalEarning;
                  });

                  // Resolve all earnings and calculate the total for the restaurant
                  const totalEarningsArray = await Promise.all(totalEarningPromises);
                  const totalEarnAmount = totalEarningsArray.reduce(
                     (acc, earning) => acc + earning,
                     0
                  );

                  // Fetch last payout data
                  const lastPayoutData = await PaymentByAdminModel.findOne({
                     driverId: driver._id,
                     paymentFor: 2,
                  })
                     .sort({ createdAt: -1 })
                     .lean(true);

                  const totalPayoutData = await PaymentByAdminModel.find({
                     driverId: driver._id,
                     paymentFor: 2,
                  }).lean(true);

                  let totalPayoutAmount = 0;
                  if (totalPayoutData && totalPayoutData.length > 0) {
                     totalPayoutAmount = totalPayoutData.reduce(
                        (acc, payout) => acc + payout.amount,
                        0
                     );
                  }

                  return {
                     ...driver,
                     totalEarning: totalEarnAmount,
                     totalPayoutPending: totalEarnAmount - totalPayoutAmount,
                     lastPayoutDate: lastPayoutData?.createdAt || null,
                     lastPaidAmount: lastPayoutData?.amount || 0,
                  };
               } else {
                  return {
                     ...driver,
                     totalEarning: 0,
                     lastPayoutDate: null,
                     lastPaidAmount: 0,
                     totalPayoutPending: 0,
                  };
               }
            })
         );

         const paginateData = customPaginate(updatedriverResponse, page, pageSize);
         const result = {
            page,
            pageSize,
            totalCount: updatedriverResponse.length,
            data: paginateData
         };

         // Send the updated response
         return sendSuccessResponse(
            res,
            result, // Return the updated array here
            'Fetched driver payout history successfully!',
            HttpStatus.OK
         );
      }

      // If no restaurants were found
      return sendSuccessResponse(res, [], 'No Delivery Boy found', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }

};

export const payoutToRestuarantByAdminByDriverId = async (req, res) => {
   try {
      const driverId = req.params.driverId;
      let { search, fromDate, toDate, page, pageSize } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;
      let query = {
         driverId: new mongoose.Types.ObjectId(driverId),
         paymentFor: 2,
         isDeleted: false,
         ...(search ? { transactionId: search } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      }
      const totalCounts = await PaymentByAdminModel.countDocuments(query);
      const response = await PaymentByAdminModel.find(query).skip(((page - 1) * pageSize)).limit(pageSize).lean(true);
      const restult = {
         page: page,
         pageSize: pageSize,
         totalCount: totalCounts,
         payoutHistory: response,
      }
      return sendSuccessResponse(res, restult, 'Fetch payout history successfully!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// end payout to drivers management




export const getAllSupplementPayoutHistory = async (req, res) => {
   try {
      let { page = 1, pageSize = 10, search, fromDate, toDate } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      // Build the query for SupplementSellerModel
      let query = {
         isDeleted: false,
         supplementStatus: 1,
         ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
      };

      // Get total count of matching restaurants
      const totalCount = await SupplementSellerModel.countDocuments(query);

      // Paginate the restaurants
      const resturantResponse = await SupplementSellerModel.find(query)
         .select('name profileType')
         .sort({ createdAt: 1 })
         // .skip((page - 1) * pageSize)
         // .limit(pageSize)
         .lean(true);

      if (resturantResponse.length > 0) {
         // Use Promise.all to process the paginated restaurant data
         const updatedRestaurantResponse = await Promise.all(
            resturantResponse.map(async (resturant) => {
               const resturantCart = await SupplementCartModel.find({
                  supplementSeller: resturant._id,
                  isDeleted: false,
               })
                  .select('supplementSeller')
                  .lean(true);

               if (resturantCart.length > 0) {
                  // Calculate total earnings from orders
                  const totalEarningPromises = resturantCart.map(async (cart) => {
                     const query = {
                        isDeleted: false,
                        status: 4,
                        supplementCartId: cart._id,
                        // ...(fromDate && toDate
                        //    ? { createdAt: { $gte: new Date(Number(fromDate)).getTime(), $lte: new Date(Number(toDate)).getTime() } }
                        //    : {}),
                     };

                     const orderDetails = await SupplementOrderModel.find(query).lean(true);

                     // Calculate total earnings for this cart
                     return orderDetails.reduce(
                        (acc, order) => acc + order.totalAmount,
                        0
                     );
                  });

                  const totalEarningsArray = await Promise.all(totalEarningPromises);
                  const totalEarnAmount = totalEarningsArray.reduce(
                     (acc, earning) => acc + earning,
                     0
                  );

                  const adminCommission = await calculateAdminCommission(1, totalEarnAmount);

                  const lastPayoutData = await PaymentByAdminModel.findOne({
                     supplementSellerId: resturant._id,
                     paymentFor: 1,
                  })
                     .sort({ createdAt: -1 })
                     .lean(true);

                  const totalPayoutData = await PaymentByAdminModel.find({
                     supplementSellerId: resturant._id,
                     paymentFor: 1,
                     // ...(fromDate && toDate
                     //    ? { createdAt: { $gte: new Date(Number(fromDate)).getTime(), $lte: new Date(Number(toDate)).getTime() } }
                     //    : {}),
                  }).lean(true);

                  const totalPayoutAmount = totalPayoutData.reduce(
                     (acc, payout) => acc + payout.amount,
                     0
                  );

                  return {
                     _id: resturant._id,
                     name: resturant.name,
                     totalEarning: totalEarnAmount,
                     totalPlatformCommission: adminCommission || 0,
                     lastPayoutDate: lastPayoutData?.createdAt || null,
                     lastPaidAmount: lastPayoutData?.amount || 0,
                     totalPayoutPending: totalEarnAmount - adminCommission - totalPayoutAmount,
                  };
               } else {
                  return {
                     _id: resturant._id,
                     name: resturant.name,
                     totalEarning: 0,
                     totalPlatformCommission: 0,
                     lastPayoutDate: null,
                     lastPaidAmount: 0,
                     totalPayoutPending: 0,
                  };
               }
            })
         );

         const result = {
            // page,
            // pageSize,
            // totalCount,
            data: updatedRestaurantResponse,
         };

         return sendSuccessResponse(
            res,
            result,
            'Fetched restaurant payout history successfully!',
            HttpStatus.OK
         );
      }

      return sendSuccessResponse(res, [], 'No restaurants found', HttpStatus.OK);
   } catch (error) {
      console.log(error);
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};


export const payoutToSupplementByAdmin = async (req, res) => {
   try {
      req.body.paymentById = req.adminData?._id || "66337772d888f26460113f16";
      req.body.transactionId = '#' + randomize('0', 9);
      req.body.supplementSellerId = new mongoose.Types.ObjectId(req.body.supplementSellerId);

      const response = await PaymentByAdminModel.create(req.body);
      return sendSuccessResponse(res, response, 'Payment added to Supplement seller!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const payoutToSupplementByAdminBySupplementId = async (req, res) => {
   try {
      const restId = req.params.supId;
      let { search, fromDate, toDate, page = 1, pageSize = 10 } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;
      let query = {
         supplementSellerId: new mongoose.Types.ObjectId(restId),
         // paymentFor: 1,
         isDeleted: false,
         ...(search ? { transactionId: search } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      }
      const totalCounts = await PaymentByAdminModel.countDocuments(query);
      const response = await PaymentByAdminModel.find(query).skip(((page - 1) * pageSize)).limit(pageSize).lean(true);
      const restult = {
         page: page,
         pageSize: pageSize,
         totalCount: totalCounts,
         payoutHistory: response,
      }
      return sendSuccessResponse(res, restult, 'Fetch payout history successfully!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};



// GYM PAYOUT HISTORY 

export const getAllGymPayoutHistory = async (req, res) => {
   try {
      let { page = 1, pageSize = 10, search, fromDate, toDate } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      let query = {
         isDeleted: false,
         gymStatus: 1,
         ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
      };

      const totalCount = await GymModel.countDocuments(query);

      const gymResponse = await GymModel.find(query)
         .select('name')
         .sort({ createdAt: 1 })
         .lean(true);

      if (gymResponse.length > 0) {
         const updatedRestaurantResponse = await Promise.all(
            gymResponse.map(async (gym) => {
               const gymCart = await GymCartModel.find({
                  gymId: gym._id,
                  isDeleted: false,
               })
                  .select('gymId')
                  .lean(true);

               if (gymCart.length > 0) {
                  const totalEarningPromises = gymCart.map(async (cart) => {
                     const query = {
                        isDeleted: false,
                        status: 4,
                        gymCartId: cart._id,
                     };

                     const orderDetails = await GymSubscriptions.find(query).lean(true);

                     return orderDetails.reduce(
                        (acc, order) => acc + order.totalAmount,
                        0
                     );
                  });

                  const totalEarningsArray = await Promise.all(totalEarningPromises);
                  const totalEarnAmount = totalEarningsArray.reduce(
                     (acc, earning) => acc + earning,
                     0
                  );

                  const adminCommission = await calculateAdminCommission(4, totalEarnAmount);

                  const lastPayoutData = await PaymentByAdminModel.findOne({
                     gymId: gym._id,
                     paymentFor: 3,
                  })
                     .sort({ createdAt: -1 })
                     .lean(true);

                  const totalPayoutData = await PaymentByAdminModel.find({
                     gymId: gym._id,
                     paymentFor: 3,
                  }).lean(true);

                  const totalPayoutAmount = totalPayoutData.reduce(
                     (acc, payout) => acc + payout.amount,
                     0
                  );

                  return {
                     _id: gym._id,
                     name: gym.name,
                     totalEarning: totalEarnAmount,
                     totalPlatformCommission: adminCommission || 0,
                     lastPayoutDate: lastPayoutData?.createdAt || null,
                     lastPaidAmount: lastPayoutData?.amount || 0,
                     totalPayoutPending: totalEarnAmount - adminCommission - totalPayoutAmount,
                  };
               } else {
                  return {
                     _id: gym._id,
                     name: gym.name,
                     totalEarning: 0,
                     totalPlatformCommission: 0,
                     lastPayoutDate: null,
                     lastPaidAmount: 0,
                     totalPayoutPending: 0,
                  };
               }
            })
         );

         const paginateData = customPaginate(updatedRestaurantResponse, page, pageSize);


         const result = {
            page,
            pageSize,
            totalCount: paginateData.length,
            data: paginateData,
         };

         return sendSuccessResponse(
            res,
            result,
            'Fetched restaurant payout history successfully!',
            HttpStatus.OK
         );
      }

      return sendSuccessResponse(res, [], 'No restaurants found', HttpStatus.OK);
   } catch (error) {
      console.log(error);
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const payoutToGymByAdmin = async (req, res) => {
   try {
      req.body.paymentById = req.adminData?._id || "66337772d888f26460113f16";
      req.body.transactionId = '#' + randomize('0', 9);
      req.body.supplementSellerId = new mongoose.Types.ObjectId(req.body.gymId);

      const response = await PaymentByAdminModel.create({...req.body, paymentFor : 3});
      return sendSuccessResponse(res, response, 'Payment added to Gym!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const payoutToGymByAdminByGymId = async (req, res) => {
   try {
      const restId = req.params.gymId;
      let { search, fromDate, toDate, page = 1, pageSize = 10 } = req.query;
      page = parseInt(page) || 1;
      pageSize = parseInt(pageSize) || 10;
      let query = {
         gymId: new mongoose.Types.ObjectId(restId),
         // paymentFor: 1,
         isDeleted: false,
         ...(search ? { transactionId: search } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      }
      const totalCounts = await PaymentByAdminModel.countDocuments(query);
      const response = await PaymentByAdminModel.find(query).skip(((page - 1) * pageSize)).limit(pageSize).lean(true);
      const restult = {
         page: page,
         pageSize: pageSize,
         totalCount: totalCounts,
         payoutHistory: response,
      }
      return sendSuccessResponse(res, restult, 'Fetch payout history successfully!', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};