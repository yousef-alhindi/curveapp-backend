import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import OrderModel from '../../models/user/order.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
import { getCommission } from '../admin/commision';
import { Commission_Model } from '../../models/admin/commision.model';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { calculateAdminCommission } from '../../services/common/calculateCommission.service';
import { PaymentByAdminModel } from '../../models/admin/paymentByAdmin.model';
import PackageOrderModel from '../../models/user/packageOrder.model';
import { Food_Pack_Cart_Model } from '../../models/user/restFoodPackCart.model';
import { SupplementCartModel } from '../../models/user/supplementCart.model';
import { AdminFoodPackCartModel } from '../../models/user/adminFoodPackCart.model';
import AdminPackageOrderModel from '../../models/user/adminPackageOrder.model';
import { SupplementSellerModel } from '../../models/supplement/supplementSeller.model';
import SupplementOrderModel from '../../models/supplement/supplementOrder.model';


export const getOrderTransactionData = async (req, res) => {
    try {
        let { from, to, search, page = 1, pageSize = 10 } = req.query

        let { accesstoken } = req.headers;

        let supplementSeller = await SupplementSellerModel.findOne({ accessToken: accesstoken }, { _id: 1 });

        let supplementCart = await SupplementCartModel.find({ supplementSeller: supplementSeller._id }, { _id: 1 })
        let cartArray = supplementCart.map((item) => item._id.toString());


        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query = {};

        if (search && search.length > 0) {
            query = {
                $or: [
                    { paymentId: search },
                    { orderId: search }
                ]
            };
        }

        if ((from && from.length > 1) || (to && to.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist

            if (from && from.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(from) } });
            }

            if (to && to.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(to) } });
            }
        }

        const totalOrders = await SupplementOrderModel.countDocuments({ ...query, supplementCartId: { $in: cartArray }, isDeleted: false, status: 4 });

        let orders = await SupplementOrderModel.find({ ...query, supplementCartId: { $in: cartArray }, isDeleted: false, status: 4 })
            .populate({
                path: 'supplementCartId',
                populate:{
                    path: 'items.itemId bundles.bundleId',
                }
            })
            .populate({
                path: 'orderRating',
                populate:{
                    path:'itemRatings.itemId',
                    select: 'name type brandName images reviews averageRating'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip) // Skip documents for pagination
            .limit(pageSize)
            .lean(); // Limit the number of documents per page

        // Calculate the sum of totalAmount from all orders
        let totalOrdersForRevenue = await SupplementOrderModel.find({ supplementCartId: { $in: cartArray }, isDeleted: false, status: 4 }, { totalAmount: 1, })
        const totalRevenue = totalOrdersForRevenue.reduce((acc, order) => acc + order.totalAmount, 0);

        await Promise.all(orders.map(async (order, index) => {
            const adminCommission = await calculateAdminCommission(1, order.totalAmount)
            orders[index].adminCommission = adminCommission
        }))

        const paidByAdmin = await PaymentByAdminModel.find({ supplementSellerId: new mongoose.Types.ObjectId(supplementSeller._id) }, { amount: 1 });

        let totalPaidByAdmin = 0
        if (paidByAdmin.length > 0) {
            totalPaidByAdmin = paidByAdmin.map((item) => item.amount + totalPaidByAdmin)
        }

        let response = {
            totalOrders,
            currentPage: page, // Current page number
            totalPages: Math.ceil(totalOrders / pageSize), // Total pages
            pageSize,          // Items per page
            orders,
            totalRevenue,
            totalPaidByAdmin,
            Pending: totalRevenue - totalPaidByAdmin,
            received: totalPaidByAdmin
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getPayoutHistory = async (req, res) => {
    try {
        let { accesstoken } = req.headers;
        let { from, to, page = 1, pageSize = 10 } = req.query;

        let supplementSeller = await SupplementSellerModel.findOne({ accessToken: accesstoken }, { _id: 1 });

        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query = {}

        if ((from && from.length > 1) || (to && to.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist

            if (from && from.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(from) } });
            }

            if (to && to.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(to) } });
            }
        }

        const totalTimesPaidByAdmin = await PaymentByAdminModel.countDocuments({ ...query, supplementSellerId: supplementSeller._id });

        const paidByAdmin = await PaymentByAdminModel.find({ ...query, supplementSellerId: supplementSeller._id }, { amount: 1, createdAt: 1, fromDate: 1, toDate: 1 })
            .sort({ createdAt: -1 })
            .skip(skip) // Skip documents for pagination
            .limit(pageSize)
            .lean(); // Limit the number of documents per page

        let response = {
            totalTimesPaidByAdmin,
            currentPage: page, // Current page number
            totalPages: Math.ceil(totalTimesPaidByAdmin / pageSize), // Total pages
            pageSize,          // Items per page
            paidByAdmin
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}