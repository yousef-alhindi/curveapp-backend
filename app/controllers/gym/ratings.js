import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import mongoose from 'mongoose';
import { RATING_MODEL } from '../../models/user/rating.model';
import { GymModel } from '../../models/gym/gym.model';

export const gymRatings = async (req, res) => {
    try {
        const gymId = req.gymData?._id || "676cf6b401881044bb1b1a83";
        const { search, page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const searchQuery = {}
        if (search) {
            searchQuery.$or = [
                { "subscription.subscriptionId": { $regex: search, $options: 'i' } },
                { "user.fullName": { $regex: search, $options: 'i' } }
            ]
        }

        const matchStage = { gymId: new mongoose.Types.ObjectId(gymId) };

        const ratingsPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "User",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "GymSubscriptions",
                    localField: "subscriptionId",
                    foreignField: "_id",
                    as: "subscription"
                }
            },
            { $unwind: "$subscription" },
            {
                $lookup: {
                    from: "Gym",
                    localField: "gymId",
                    foreignField: "_id",
                    as: "gymDetails"
                }
            },
            { $unwind: "$gymDetails" },
            {
                $match: searchQuery
            },
            {
                $project: {
                    _id: 1,
                    star: 1,
                    review: 1,
                    isDeleted: 1,
                    createdAt: 1,
                    // status: 1,  // not used or maintained anywhere for gym rating, use isDeleted instead
                    userName: "$user.fullName",
                    subscriptionId: "$subscription.subscriptionId",
                    averageRating: "$gymDetails.averageRating"
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ];

        const countPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "User",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "GymSubscriptions",
                    localField: "subscriptionId",
                    foreignField: "_id",
                    as: "subscription"
                }
            },
            { $unwind: "$subscription" },
            {
                $match: searchQuery
            },
            { $count: "totalRecords" }
        ];

        const [ratings, countResult] = await Promise.all([
            RATING_MODEL.aggregate(ratingsPipeline),
            RATING_MODEL.aggregate(countPipeline)
        ]);

        const totalRecords = countResult.length > 0 ? countResult[0].totalRecords : 0;

        return sendSuccessResponse(
            res,
            { ratings, averageRating: req?.gymData?.averageRating || 0, totalRecords, totalPages: Math.ceil(totalRecords / limit), page: parseInt(page), limit: parseInt(limit) },
            "Ratings list",
            HttpStatus.OK
        );
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};


export const deleteRating = async (req, res) => {
    try {
        const ratingId = req.params.id;
        const gymId = req.gymData?._id || "676cf6b401881044bb1b1a83";
        const { isDeleted } = req.body;
        const rating = await RATING_MODEL.findOne({ _id: ratingId, gymId });
        if (!rating) {
            return sendErrorResponse(res, "Rating not found", HttpStatus.NOT_FOUND);
        }
        const update = await RATING_MODEL.findByIdAndUpdate(ratingId, { isDeleted }, { new: true });

        // update average rating in gym
        const reviews = await RATING_MODEL.find({
            gymId,
            isDeleted: false
        });
        const totalRating = reviews.reduce((acc, review) => acc + review.star, 0);
        const averageRating = reviews.length ? totalRating / reviews.length : 0;
        await GymModel.findByIdAndUpdate(gymId, { averageRating }, { new: true });

        return sendSuccessResponse(res, update, 'Rating Deleted', HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};