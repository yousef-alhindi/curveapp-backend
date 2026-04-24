import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import OrderModel from '../../models/user/order.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment'); 
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { restaurent } from '../../validations/restaurent/restaurent.validation';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';
import { menuItemModel } from '../../models/restaurant/menuItem.model';
import { RATING_MODEL } from '../../models/user/rating.model';
import { RestaurantWalletModel } from '../../models/restaurant/restaurantWallet.model';
import { Food_Pack_Cart_Model } from '../../models/user/restFoodPackCart.model';
import { AdminFoodPackCartModel } from '../../models/user/adminFoodPackCart.model';
import PackageOrderModel from '../../models/user/packageOrder.model';
import AdminPackageOrderModel from '../../models/user/adminPackageOrder.model';
import { RestaurantPackageModel } from '../../models/restaurant/restaurantPackage';
import {PackageFoodModel} from '../../models/admin/foodPackage.model'
import { REST_PACK_RATING_MODEL } from '../../models/user/restPackageRating.model';
import OrderDeliveryModel from '../../models/delivery/orderDelivery.model';


export const getBusinuessStats = async (req, res) => {
    try{
        let { accesstoken } = req.headers;
        let {from, to, timeZone} = req.query

        let rest = await RestaurantModel.findOne({ accessToken: accesstoken },{_id:1});

        let query ={};

        if (timeZone) {
            const timeRanges = {
                today: [moment().startOf('day'), moment().endOf('day')],
                thisWeek: [moment().startOf('week'), moment().endOf('week')],
                thisMonth: [moment().startOf('month'), moment().endOf('month')],
            };
        
            if (timeRanges[timeZone]) {
                const [fromTime, toTime] = timeRanges[timeZone];
                query.createdAt = {
                    $gte: fromTime.valueOf(),
                    $lte: toTime.valueOf()
                };
            }
        } else {
            if (from || to) {
                query.createdAt = {};
                if (from) query.createdAt.$gte = from;
                if (to) query.createdAt.$lte = to;
            }
        }
        //........................Common Query...................

        let restaurentCart = await Restaurant_Cart_Model.find({restId:rest._id},{_id:1})
        let cartArray = restaurentCart.map((item)=>item._id.toString());

        const totalOrders = await OrderModel.find({ restaurentCartId: { $in: cartArray } ,...query}); // Step 1: Fetch all relevant orders

        // Step 2: Count orders per user
        const userOrderCounts = {};

        totalOrders.forEach(order => {
        if (userOrderCounts[order.userId]) {
            userOrderCounts[order.userId].count += 1; // Increment count for existing user
        } else {
            userOrderCounts[order.userId] = { count: 1, order }; // Initialize count and store order
        }
        });

        //.........................ORDER COUNT...................
        const orderCount = await OrderModel.countDocuments({restaurentCartId:{$in:cartArray}, ...query}) 

        //...................REPEATED CUSTOMERS....................

         // Step 3: Filter users with only one order
         const totalRepeatCustomers = Object.values(userOrderCounts)
         .filter(user => user.count > 1)
         .map(user => user.order); // Extract the orders for users with a single order
 
        //...................NEW CUSTOMERS............................

        // Step 3: Filter users with only one order
        const newCustomerOrders = Object.values(userOrderCounts)
        .filter(user => user.count === 1)
        .map(user => user.order); // Extract the orders for users with a single order

        //.........................TOTAL REVENUE......................
          
          const orders = await OrderModel.find({ restaurentCartId: { $in: cartArray }  }, { totalAmount: 1 }); // Find orders, but only return the totalAmount field

          // Calculate the sum of totalAmount from all orders
          const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
          
          let response = {
            orderCount,
            repeatCustomers : totalRepeatCustomers.length,
            newCustomer: newCustomerOrders.length,
            totalRevenue
         }

          return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
    }catch(e){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const dashBoardData = async (req, res) => {
    try{
        let { accesstoken } = req.headers;
        let rest = await RestaurantModel.findOne({ accessToken: accesstoken })
        .populate({
            path:"resCategory",
            select :'cuisineName'
        });

        const totalDishes = await menuItemModel.countDocuments({restId:rest._id,status:true})

        // const rating = await RATING_MODEL.find({restId:rest._id},{star:1})
        // let averageRating = 0;
        // rating.map((item)=>{averageRating + item.star})

        // averageRating = averageRating/rating.length;

         // Ratings
         const allRatings = await RATING_MODEL.find({restId:rest._id},{star:1})
         let totalRatingsCount = allRatings.length;
         let totalStars = allRatings.reduce((sum, rating) => sum + rating.star, 0);
 
         // Calculate the average rating
         let averageRating = totalRatingsCount > 0 ? totalStars / totalRatingsCount : 0; // Avoid division by zero
 

        const walletBalance = await RestaurantWalletModel.findOne({restaurantId:rest._id},{balance:1})

        let response={
            restaurant : rest,
            totalDishes,
            averageRating,
            walletBalance: walletBalance?.balance ?  walletBalance.balance :0
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)

    }catch(e){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const deliveryOptionsUpdate  = async(req,res)=>{
    try{
        const {isDelivery,isPickUp,active,reason} = req.query;
        let { accesstoken } = req.headers;
        
        let setData = {};
            if (isDelivery) {
                setData.isDelivery = (isDelivery === "true" ? true : false);
            }
            if (isPickUp) {
                setData.isPickUp = (isPickUp === "true" ? true : false);
            }
            if (active) {
                setData.active = (active === "true" ? true : false);
                setData.inActiveResaon = (active === "true" ? "" : reason)
            }

            const updateDeliveryOption = await RestaurantModel.findOneAndUpdate(
                { accessToken: accesstoken },
                { $set: setData },
                { new: true } // This will return the updated document
            );

            if(active==="false"){
                let scheduledOrders = await OrderModel.find({
                    scheduledDate: {
                        $gte: "$$NOW",
                        $lte: {
                            $dateFromParts: {
                                year: { $year: "$$NOW" },
                                month: { $month: "$$NOW" },
                                day: { $dayOfMonth: "$$NOW" },
                                hour: 23,
                                minute: 59,
                                second: 59,
                                millisecond: 999
                            }
                        } // scheduledDate should be less than or equal to today's 11:59 PM
                    },
                    orderType: 1,
                    scheduledDate: { $ne: null } ,
                    status:1
                });

                let startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                let endDate = new Date();
                endDate.setHours(23, 59, 59, 999); // Set to 11:59:59.999 PM
                // Convert to timestamps (milliseconds since Unix epoch)
                startDate = startDate.getTime();
                endDate = endDate.getTime();

                let packageOrders = await PackageOrderModel.find({
                    status: 1, 
                    'dates.date': { $gte: startDate, $lte: endDate },
                    'dates.status': 1 
                });
                await Promise.all(packageOrders.length > 0 && packageOrders.map((order) => {
                    order.dates.map(async(date, index) => {
                                       
                        if (date.date >= startDate && date.date <= endDate && date.status === 1) {
                            date.status = 0;
                
                            // Get the last date from the 'dates' array
                            const lastDate = order.dates[order.dates.length - 1].date;
                
                            // Add 1 day to the last date
                            const nextDayDate = new Date(lastDate); 
                            nextDayDate.setDate(nextDayDate.getDate() + 1); 
                            const nextDayTimestamp = nextDayDate.getTime(); 
                            
                            // Add the new date to the 'dates' array
                            order.dates.push({
                                date: nextDayTimestamp,   
                                status: 1,                
                                orderStatus: 5,          
                                driverId: null,           
                                rejectedBy: [],          
                                accepted: false,         
                                isPickUp: false,         
                                //pickupTime: null,        
                                isDelivered: false,      
                                //deliveredTime: null,      
                            });

                            let updateOrder = await PackageOrderModel.findByIdAndUpdate(
                                order._id,
                                {$set:order},
                                {new:true}
                            )
            
                        }
                    });
                }))
                
    
                if (scheduledOrders.length > 0) {
                    for (let order of scheduledOrders) {
                        order.status = 5;
                        order.cancellationReason = reason;
                        order.cancellationDate = new Date();
                
                        //Update the order in the database
                        let cancelOrder = await OrderModel.findByIdAndUpdate(
                            order._id,
                            { $set: order },
                            { new: true }
                        );

                        //remove order from delivery Request 
                        // let deleteDeliveryRequest = await OrderDeliveryModel.updateOne(
                        //     { orderId: order._id },  // Query condition
                        //     { $set: { isDeleted: false } }  // Update operation
                        // );

                        // console.log("deleteDeliveryRequest.....",deleteDeliveryRequest)
                        

                    }
                }
            }            

       
        if(updateDeliveryOption){
            return sendSuccessResponse(res, updateDeliveryOption, success.SUCCESS, HttpStatus.OK)
        }
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}



export const getPackageBusinuessStats = async (req, res) => {
    try{
        let resId = req?.restaurantData?._id;
        let {from, to, timeZone} = req.query

        let query ={};

        if (timeZone) {
            const timeRanges = {
                today: [moment().startOf('day'), moment().endOf('day')],
                thisWeek: [moment().startOf('week'), moment().endOf('week')],
                thisMonth: [moment().startOf('month'), moment().endOf('month')],
            };
        
            if (timeRanges[timeZone]) {
                const [fromTime, toTime] = timeRanges[timeZone];
                query.createdAt = {
                    $gte: fromTime.valueOf(),
                    $lte: toTime.valueOf()
                };
            }
        } else {
            if (from || to) {
                query.createdAt = {};
                if (from) query.createdAt.$gte = from;
                if (to) query.createdAt.$lte = to;
            }
        }
        //........................Common Query...................

        //rest pack Orders
        let restPackCart = await Food_Pack_Cart_Model.find({restId:resId},{_id:1})
        let cartArray = restPackCart.map((item)=>item._id.toString());

        let restPackOrders = await PackageOrderModel.find({...query,restaurentCartId: { $in: cartArray },isDeleted:false})

        //admin pack Orders
        let adminPackCart = await AdminFoodPackCartModel.find({"restaurants._id": resId}, {_id: 1}); // Select only the `_id` field
        let adminCartArray = adminPackCart.map((item) => item._id.toString()); // Map to the string version of the _id

        let adminOrders = await AdminPackageOrderModel.find({...query,cartId: { $in: adminCartArray },isDeleted:false})
        let totalOrders = [...restPackOrders,...adminOrders]

        // Step 2: Count orders per user
        const userOrderCounts = {};

        totalOrders.forEach(order => {
        if (userOrderCounts[order.userId]) {
            userOrderCounts[order.userId].count += 1; // Increment count for existing user
        } else {
            userOrderCounts[order.userId] = { count: 1, order }; // Initialize count and store order
        }
        });

        //.........................ORDER COUNT...................
        const orderCount = totalOrders.length;

        //...................REPEATED CUSTOMERS....................

         // Step 3: Filter users with only one order
         const totalRepeatCustomers = Object.values(userOrderCounts)
         .filter(user => user.count > 1)
         .map(user => user.order); // Extract the orders for users with a single order
 
        //...................NEW CUSTOMERS............................

        // Step 3: Filter users with only one order
        const newCustomerOrders = Object.values(userOrderCounts)
        .filter(user => user.count === 1)
        .map(user => user.order); // Extract the orders for users with a single order

        //.........................TOTAL REVENUE......................
          
          const restPackorders = await PackageOrderModel.find({ restaurentCartId: { $in: cartArray }  }, { totalAmount: 1 }); // Find orders, but only return the totalAmount field
          const adminPackorders = await AdminPackageOrderModel.find({ restaurentCartId: { $in: cartArray }  }, { totalAmount: 1 }); // Find orders, but only return the totalAmount field

          let orders = [...restPackorders,...adminPackorders]
          // Calculate the sum of totalAmount from all orders
          const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
          
          let response = {
            orderCount,
            repeatCustomers : totalRepeatCustomers.length,
            newCustomer: newCustomerOrders.length,
            totalRevenue
         }

          return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
    }catch(e){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}


export const packagedashBoardData = async (req, res) => {
    try{
        let resId = req?.restaurantData?._id;

        // restaurant Details
        let rest = await RestaurantModel.findById(resId)

        // total Packages 
        const totalRestPackages = await RestaurantPackageModel.countDocuments({restId:resId,status:true})
        const totalAdminPackages = await PackageFoodModel.countDocuments({'restaurants._id':resId,'restaurants.status':true})
        let totalPackages = totalRestPackages + totalAdminPackages

        // Ratings
        const allRatings = await REST_PACK_RATING_MODEL.find({restId:resId},{star:1})
        let totalRatingsCount = allRatings.length;
        let totalStars = allRatings.reduce((sum, rating) => sum + rating.star, 0);

        // Calculate the average rating
        let averageRating = totalRatingsCount > 0 ? totalStars / totalRatingsCount : 0; // Avoid division by zero

        const walletBalance = await RestaurantWalletModel.findOne({restaurantId:resId},{balance:1})

        let response={
            restaurant : rest,
            totalPackages,
            averageRating,
            walletBalance: walletBalance?.balance ?  walletBalance.balance :0
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)

    }catch(e){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}
