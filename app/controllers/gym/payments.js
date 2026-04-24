import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import mongoose from 'mongoose';
import GymSubscriptions from '../../models/gym/gymSubscriptions';
import { PaymentByAdminModel } from '../../models/admin/paymentByAdmin.model';
import { calculateAdminCommission } from '../../services/common/calculateCommission.service';
import { success } from '../../responses/messages';

export const getGymTransactionData = async (req, res) => {
    try {
        let { startDate, endDate, search, page = 1, pageSize = 10 } = req.query

        const gymData = req?.gymData || { _id: "67975f30168c6383ddc594cc" }

        page = parseInt(page);
        pageSize = parseInt(pageSize);

        const skip = (page - 1) * pageSize;

        let query = { gymId: gymData._id };

        if (search && search.length > 0) {
            query = {
                $or: [
                    { paymentId: search },
                    { subscriptionId: search }
                ]
            };
        }

        if ((startDate && startDate.length > 1) || (endDate && endDate.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist

            if (startDate && startDate.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(startDate) } });
            }

            if (endDate && endDate.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(endDate) } });
            }
        }

        const totalSubscriptions = await GymSubscriptions.countDocuments({ ...query });

        let allSubscriptions = await GymSubscriptions.find({ gymId: gymData._id })
            .populate({
                path: 'gymCartId',
                populate: {
                    path: 'packageId',
                }
            })
            .sort({ createdAt: -1 })
            .lean();
        const totalRevenue = allSubscriptions.reduce((acc, order) => acc + order.amountPaid, 0);

        let subscriptions = await GymSubscriptions.find({ ...query })
            .populate({
                path: 'gymCartId',
                populate: {
                    path: 'packageId',
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        await Promise.all(subscriptions.map(async (order, index) => {
            const adminCommission = await calculateAdminCommission(4, order.amountPaid)
            subscriptions[index].adminCommission = adminCommission
        }))

        const paidByAdmin = await PaymentByAdminModel.find({ gymId: new mongoose.Types.ObjectId(gymData._id) }, { amount: 1 });

        let totalPaidByAdmin = 0
        if (paidByAdmin.length > 0) {
            totalPaidByAdmin = paidByAdmin.map((item) => item.amount + totalPaidByAdmin)
        }

        let response = {
            totalSubscriptions,
            currentPage: page,
            totalPages: Math.ceil(totalSubscriptions / pageSize),
            pageSize,
            subscriptions,
            totalRevenue,
            totalPaidByAdmin,
            pending: totalRevenue - totalPaidByAdmin,
            received: totalPaidByAdmin
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getPayoutHistory = async (req, res) => {
    try {
        let { startDate, endDate, search, page = 1, pageSize = 10 } = req.query

        const gymData = req?.gymData || { _id: "67975f30168c6383ddc594cc" }

        page = parseInt(page);
        pageSize = parseInt(pageSize);

        const skip = (page - 1) * pageSize;

        let query = {}

        if ((startDate && startDate.length > 1) || (endDate && endDate.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist

            if (startDate && startDate.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(startDate) } });
            }

            if (endDate && endDate.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(endDate) } });
            }
        }

        const totalTimesPaidByAdmin = await PaymentByAdminModel.countDocuments({ ...query, gymId: gymData._id });

        const paidByAdmin = await PaymentByAdminModel.find({ ...query, gymId: gymData._id }, { amount: 1, createdAt: 1, fromDate: 1, toDate: 1 })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        let response = {
            totalTimesPaidByAdmin,
            currentPage: page,
            totalPages: Math.ceil(totalTimesPaidByAdmin / pageSize),
            pageSize, 
            paidByAdmin
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}