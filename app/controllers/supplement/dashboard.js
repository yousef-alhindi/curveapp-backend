import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
const mongoose = require('mongoose'); // mongoose database
const moment = require('moment');
import { SupplementSellerModel } from '../../models/supplement/supplementSeller.model';
import { SupplementCartModel } from '../../models/user/supplementCart.model';
import SupplementOrderModel from '../../models/supplement/supplementOrder.model';
import { SupplementModel } from '../../models/supplement/supplement';
import { SUPPLEMENT_ORDER_RATING_MODEL } from '../../models/supplement/supplementRating.model';
import { SupplementWalletModel } from '../../models/supplement/supplementWallet.model';


export const getBusinuessStats = async (req, res) => {
    try {
        let { accesstoken } = req.headers;
        let { from, to, timeZone } = req.query

        let rest = await SupplementSellerModel.findOne({ accessToken: accesstoken }, { _id: 1 });
        let query = {};

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
                if (from) query.createdAt.$gte = Number(from);
                if (to) query.createdAt.$lte = Number(to);
            }
        }
        //........................Common Query...................

        let restaurentCart = await SupplementCartModel.find({ supplementSeller: rest._id }, { _id: 1 })
        let cartArray = restaurentCart.map((item) => item._id.toString());

        const totalOrders = await SupplementOrderModel.find({ supplementCartId: { $in: cartArray }, ...query }); // Step 1: Fetch all relevant orders

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
        const orderCount = await SupplementOrderModel.countDocuments({ supplementCartId: { $in: cartArray }, ...query })

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

        const orders = await SupplementOrderModel.find({ supplementCartId: { $in: cartArray } }, { totalAmount: 1 }); // Find orders, but only return the totalAmount field

        // Calculate the sum of totalAmount from all orders
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

        let response = {
            orderCount,
            repeatCustomers: totalRepeatCustomers.length,
            newCustomer: newCustomerOrders.length,
            totalRevenue
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
    } catch (e) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const dashBoardData = async (req, res) => {
    try {
        let { accesstoken } = req.headers;
        let rest = await SupplementSellerModel.findOne({ accessToken: accesstoken })
        // .populate({
        //     path: "resCategory",
        //     select: 'cuisineName'
        // });

        const totalProducts = await SupplementModel.countDocuments({ supplementSeller: rest._id, isDeleted: false })

        // const rating = await RATING_MODEL.find({restId:rest._id},{star:1})
        // let averageRating = 0;
        // rating.map((item)=>{averageRating + item.star})

        // averageRating = averageRating/rating.length;

        // Ratings
        const allRatings = await SUPPLEMENT_ORDER_RATING_MODEL.find({ supplementSellerId: rest._id }, { sellerRating: 1 })
        let totalRatingsCount = allRatings.length;
        let totalStars = allRatings.reduce((sum, rating) => sum + rating.sellerRating, 0);

        // Calculate the average rating
        let averageRating = totalRatingsCount > 0 ? Number((totalStars / totalRatingsCount).toFixed(2)) : 0; // Avoid division by zero


        const walletBalance = await SupplementWalletModel.findOne({ supplementId: rest._id }, { balance: 1 })

        let response = {
            supplementSeller: rest,
            totalProducts,
            averageRating,
            walletBalance: walletBalance?.balance ? walletBalance.balance : 0
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)

    } catch (e) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const deliveryOptionsUpdate = async (req, res) => {
    try {
        const { isDelivery, isPickUp, active, reason } = req.query;
        let { accesstoken } = req.headers;

        let setData = {};
        if (isDelivery) {
            setData.isDelivery = (isDelivery === "true" ? true : false);
        }
        if (isPickUp) {
            setData.isPickUp = (isPickUp === "true" ? true : false);
        }

        const updateDeliveryOption = await SupplementSellerModel.findOneAndUpdate(
            { accessToken: accesstoken },
            { $set: setData },
            { new: true } // This will return the updated document
        );


        if (updateDeliveryOption) {
            return sendSuccessResponse(res, updateDeliveryOption, success.SUCCESS, HttpStatus.OK)
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}
