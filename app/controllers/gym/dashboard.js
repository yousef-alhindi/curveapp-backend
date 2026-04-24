import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import mongoose from 'mongoose';
import { RATING_MODEL } from '../../models/user/rating.model';
import GymSubscriptions from '../../models/gym/gymSubscriptions';
import { PaymentByAdminModel } from '../../models/admin/paymentByAdmin.model';
import { calculateAdminCommission } from '../../services/common/calculateCommission.service';
import { success } from '../../responses/messages';
import moment from 'moment';
import { GymPkgModel } from '../../models/gym/gymPkg.model';
import { GymWalletModel } from '../../models/gym/gymWallet.model';

export const getGymDashboardData = async (req, res) => {
    try {
        const gymData = req?.gymData || { _id: "67975f30168c6383ddc594cc" };
        let { startDate, endDate, filter } = req.query;

        // Apply filter for today, this week, this month (if there is filter then startDate, endDate filter will not work)
        if (filter) {
            const now = moment().utc();
            switch (filter) {
                case "today":
                    startDate = now.startOf("day").valueOf();
                    endDate = now.endOf("day").valueOf();
                    break;
                case "thisWeek":
                    startDate = now.startOf("isoWeek").valueOf();
                    endDate = now.endOf("isoWeek").valueOf();
                    break;
                case "thisMonth":
                    startDate = now.startOf("month").valueOf();
                    endDate = now.endOf("month").valueOf();
                    break;
                default:
                    startDate = null;
                    endDate = null;
            }
        }

        let query = { gymId: gymData._id };
        if (startDate && endDate) {
            query.createdAt = { $gte: Number(startDate), $lte: Number(endDate) };
        }

        const [subscriptions, totalSubscriptions, uniqueUsers, packageAdded, ratings, gymWallet] = await Promise.all([
            GymSubscriptions.find(query)
                .populate({
                    path: "gymCartId",
                    populate: { path: "packageId" },
                })
                .sort({ createdAt: -1 })
                .lean(),
            GymSubscriptions.countDocuments(query),
            GymSubscriptions.distinct("userId", query),
            GymPkgModel.countDocuments(query),
            RATING_MODEL.find({ ...query, isDeleted: false }).lean(),
            GymWalletModel.findOne({ gymId: gymData._id, isDeleted: false, status: 1 }).lean(),
        ]);

        // Calculate revenue and admin commission in one go
        let totalRevenue = 0;
        await Promise.all(
            subscriptions.map(async (order) => {
                const adminCommission = await calculateAdminCommission(4, order.amountPaid);
                order.adminCommission = adminCommission;
                totalRevenue += order.amountPaid - adminCommission;
            })
        );

        // Compute new vs repeated customers
        const userSubscriptionCounts = await Promise.all(
            uniqueUsers.map((userId) =>
                GymSubscriptions.countDocuments({ userId, gymId: gymData._id }).then((count) => ({ userId, count }))
            )
        );

        let newCustomers = 0;
        let repeatedCustomers = 0;
        userSubscriptionCounts.forEach(({ count }) => {
            count > 1 ? repeatedCustomers++ : newCustomers++;
        });

        // Compute average rating
        const totalStars = ratings.reduce((acc, rating) => acc + rating.star, 0);
        const averageRating = ratings.length ? totalStars / ratings.length : 0;

        const walletBalance = gymWallet ? gymWallet.balance : 0
        
        const data = { totalRevenue: Number(totalRevenue.toFixed(2)), averageRating, packageAdded, repeatedCustomers, newCustomers, totalSubscriptions, walletBalance };
        return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};


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