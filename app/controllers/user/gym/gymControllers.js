import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';
import { sendSuccessResponse, sendErrorResponse } from '../../../responses/response';
import { WISHLIST_MODEL } from '../../../models/user/wishlist.model';
import { RATING_MODEL } from '../../../models/user/rating.model';
import { BannerModel } from '../../../models/admin/banner.model';
import * as commonService from '../../../services/common/common.service';
import { GymModel } from '../../../models/gym/gym.model';
import { GYM_SPONSOR_MODEL } from '../../../models/gym/gymSponsor.model';
import { CategoryModel } from '../../../models/admin/category.models';
import { GymPkgModel } from '../../../models/gym/gymPkg.model';
import { GymCartModel } from '../../../models/user/gymCart.model';
import { success } from '../../../responses/messages';
import { Gym_Offer_Order_Model } from '../../../models/gym/offerOrder.model';
import GymSubscriptions from '../../../models/gym/gymSubscriptions';


export const getHomePageGym = async (req, res) => {
    try {
        const { long, lat, search } = req.query;

        if (!long || !lat) {
            return res.status(400).json({ error: 'Longitude and latitude are required' });
        }

        const userLocation = {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
        };

        let pipeline = [
            {
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distance',
                    maxDistance: 50000,
                    spherical: true,
                    query: { gymStatus: 1, isBlocked: false },
                },
            },
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { "addressDetails.address": { $regex: search, $options: 'i' } },
                        { "addressDetails.street": { $regex: search, $options: 'i' } },
                        { "addressDetails.building": { $regex: search, $options: 'i' } },
                        { "addressDetails.postalCode": { $regex: search, $options: 'i' } },
                    ],
                },
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "wishlists",
                    localField: "_id",
                    foreignField: "gymId",
                    as: "saved",
                },
            },
            {
                $lookup: {
                    from: 'GymPkg',
                    localField: 'package',
                    foreignField: '_id',
                    as: 'package',
                },
            },
            {
                $unwind: {
                    path: '$package',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    isWishlist: {
                        $in: [
                            new mongoose.Types.ObjectId(req.userData?._id),
                            "$saved.userId",
                        ],
                    },
                    distanceInKm: { $divide: ['$distance', 1000] },
                },
            },
            {
                $lookup: {
                    from: "Rating",
                    localField: "_id",
                    foreignField: "gymId",
                    as: "ratings",
                },
            },
            {
                $addFields: {
                    avgRating: { $avg: "$ratings.star" },
                },
            }
        );

        let getAllGym = await GymModel.aggregate(pipeline);

        // Fetch sponsored gyms
        const sponsoredGyms = await GYM_SPONSOR_MODEL.find({
            isActive: true,
            isBlocked: false,
        }).select("gymId");

        const sponsoredGymIds = sponsoredGyms.map((s) => s.gymId.toString());

        const logicType = {
            usualOrder: 1,
            recentViewed: 2,
            mostAddedFavourite: 3,
            topRated: 4,
            sponsored: 5,
            mostSelling: 6,
            fastestDelivery: 7,
            new: 8,
            bogo: 9,
            percentOff: 10,
            priceOff: 11,
            positiveFeedback: 12,
        };

        //const allCategories = await CategoryModel.find({ isDeleted: false, status: 1, logicType: { $in: [4, 5, 6, 8] } }).sort({ position: 1 });
        const allCategories = await CategoryModel.find({
            isDeleted: false, status: 1, $or: [
                { category: "Gym" },
                { service: "All" }
            ],
             logicType: { $in: [4, 5, 6, 8] }
        }).sort({ gymPosition: 1 });


        const categorizedGyms = allCategories.map((category) => {
            let gyms = [];
            switch (category.logicType) {
                case logicType.topRated:
                    gyms = getAllGym.filter((gym) => gym.avgRating >= 4.0 || gym.avgRating === null); // Adjust rating threshold as needed
                    break;
                case logicType.sponsored:
                    gyms = getAllGym.filter((gym) =>
                        sponsoredGymIds.includes(gym._id.toString())
                    );
                    break;
                case logicType.new:
                    gyms = getAllGym.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
                    break;
                default:
                    gyms = []; // No gyms for unsupported logicType
                    break;
            }
            return {
                ...category.toObject(),
                gyms,
            };
        });

        const getServiceBanners = await BannerModel.find({ bannerType: 2, isDeleted: false, service: "Gym" }).populate('offerRef');

        const position1Category = allCategories.find(cat => cat.position === 1);
        const position2Category = allCategories.find(cat => cat.position === 2);

        const hasPosition1WithStatus1 = position1Category && position1Category.status === 1;
        const hasPosition2WithStatus1 = position2Category && position2Category.status === 1;

        // Determine the position of foodServiceBanner
        let bannerPosition;

        if (hasPosition1WithStatus1 && hasPosition2WithStatus1) {
            // Both positions 1 and 2 have status 1
            bannerPosition = 2; // Place banner at index 2
        } else if (!hasPosition1WithStatus1 && hasPosition2WithStatus1) {
            // Position 1 is missing or does not have status 1
            bannerPosition = 1; // Place banner at index 1
        } else if (hasPosition1WithStatus1 && !hasPosition2WithStatus1) {
            // Position 2 is missing or does not have status 1
            bannerPosition = 1; // Place banner at index 1
        } else if (!hasPosition1WithStatus1 && !hasPosition2WithStatus1) {
            // Neither Position 1 nor Position 2 has Status 1
            bannerPosition = 0; // Place banner at index 0
        }

        if (bannerPosition !== undefined) {
            categorizedGyms.splice(bannerPosition, 0, { categoryName: "categoryBanners", banners: getServiceBanners });
        }

        sendSuccessResponse(
            res,
            categorizedGyms,
            "Categorized gyms fetched successfully",
            HttpStatus.OK
        );
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getAllServiceBanners = async (req, res) => {
    try {
        const getServiceBanners = await BannerModel.find({ bannerType: 2, isDeleted: false, service: "Gym" }).populate('offerRef');
        sendSuccessResponse(res, getServiceBanners, "List fetched successfully", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);

    }
}

export const getGymsByLocationAndOffer = async (req, res) => {
    try {
        const { long, lat, search } = req.query;
        const { offerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(offerId)) {
            return sendErrorResponse(res, "Offer Id is invalid", 400);
        }

        if (!long || !lat) {
            return sendErrorResponse(res, "Longitude and latitude are required", 400);
        }

        const userLocation = {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
        };

        let pipeline = [
            {
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distance',
                    maxDistance: 50000, // 50 km
                    spherical: true,
                    query: { active: true, isDeleted: false, isBlocked: false },
                },
            },
            {
                $lookup: {
                    from: 'gymOfferOrders',
                    localField: '_id',
                    foreignField: 'gymId',
                    as: 'offers',
                },
            },
            {
                $addFields: {
                    distanceInKm: { $divide: ['$distance', 1000] },
                    hasOffer: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$offers",
                                        as: "offer",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$offer.offerId", new mongoose.Types.ObjectId(offerId)] },
                                                { $eq: ["$$offer.isActive", true] },
                                                { $gte: ["$$offer.packageExpired", new Date().getTime()] },
                                            ],
                                        },
                                    },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $lookup: {
                    from: 'GymPkg',
                    localField: 'package',
                    foreignField: '_id',
                    as: 'package',
                },
            },
            {
                $unwind: {
                    path: '$package',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $match: {
                    hasOffer: true,
                    $and: [{}],
                },
            },
            // {
            //     $project: {
            //         name: 1,
            //         location: 1,
            //         gymType: 1,
            //         ownerName: 1,
            //         profileImage: 1,
            //         distanceInKm: 1,
            //     },
            // },
        ];

        if (search) {
            pipeline[3].$match.$and.push({
                $or: [
                    { name: { $regex: search, $options: "i" } }, // Search by gym name
                    { gymType: { $regex: search, $options: "i" } }, // Search by gym type
                ],
            });
        }

        const gyms = await GymModel.aggregate(pipeline);

        if (gyms.length === 0) {
            return sendSuccessResponse(res, [], "No gyms found for the provided criteria", 200);
        }

        sendSuccessResponse(res, gyms, "Gyms fetched successfully", 200);
    } catch (error) {
        return sendErrorResponse(res, error.message, 500);
    }
};


export const getGymsByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { long, lat, search } = req.query;

        if (!long || !lat) {
            return res.status(400).json({ error: 'Longitude and latitude are required' });
        }

        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        const userLocation = {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
        };

        const category = await CategoryModel.findOne({ _id: categoryId, isDeleted: false, status: 1 });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        let pipeline = [
            {
                $geoNear: {
                    near: userLocation,
                    distanceField: 'distance',
                    maxDistance: 50000,
                    spherical: true,
                    query: { gymStatus: 1, isBlocked: false },
                },
            },
            {
                $lookup: {
                    from: "wishlists",
                    localField: "_id",
                    foreignField: "gymId",
                    as: "saved",
                },
            },
            {
                $addFields: {
                    isWishlist: {
                        $in: [
                            new mongoose.Types.ObjectId(req.userData?._id),
                            "$saved.userId",
                        ],
                    },
                    distanceInKm: { $divide: ['$distance', 1000] },
                },
            },
            {
                $lookup: {
                    from: "Rating",
                    localField: "_id",
                    foreignField: "gymId",
                    as: "ratings",
                },
            },
            {
                $lookup: {
                    from: 'GymPkg',
                    localField: 'package',
                    foreignField: '_id',
                    as: 'package',
                },
            },
            {
                $unwind: {
                    path: '$package',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    avgRating: { $avg: "$ratings.star" },
                },
            },
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { "addressDetails.address": { $regex: search, $options: 'i' } },
                        { "addressDetails.street": { $regex: search, $options: 'i' } },
                        { "addressDetails.building": { $regex: search, $options: 'i' } },
                        { "addressDetails.postalCode": { $regex: search, $options: 'i' } },
                    ],
                },
            });
        }

        const logicType = {
            topRated: 4,
            sponsored: 5,
            new: 8,
        };

        let getAllGyms = await GymModel.aggregate(pipeline);

        let gyms = [];
        switch (category.logicType) {
            case logicType.topRated:
                gyms = getAllGyms.filter((gym) => gym.avgRating >= 4.0 || gym.avgRating === null); // Adjust rating threshold as needed
                break;
            case logicType.sponsored:
                const sponsoredGyms = await GYM_SPONSOR_MODEL.find({
                    isActive: true,
                    isBlocked: false,
                }).select("gymId");

                const sponsoredGymIds = sponsoredGyms.map((s) => s.gymId.toString());
                gyms = getAllGyms.filter((gym) =>
                    sponsoredGymIds.includes(gym._id.toString())
                );
                break;
            case logicType.new:
                gyms = getAllGyms.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
                break;
            default:
                gyms = []; // No gyms for unsupported logicType
                break;
        }

        sendSuccessResponse(res, { ...category.toObject(), gyms }, `Gyms for category ${category.categoryName} fetched successfully`, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};


export const toggleGymWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return sendErrorResponse(res, "Id is invalid", 400);
        }

        if (!req.userData?._id) {
            return sendErrorResponse(res, "Please provide access token to add in wishlist.", 404);
        }

        const gymResp = await commonService.findOne(GymModel, { _id: id });
        if (!gymResp) {
            return sendErrorResponse(res, "Gym not found.", 404);
        }

        const alreadySaved = await commonService.findOne(WISHLIST_MODEL, {
            gymId: id,
            userId: req.userData._id,
        });
        if (!!alreadySaved) {
            await commonService.findOneAndDelete(WISHLIST_MODEL, { _id: alreadySaved._id });
            return sendSuccessResponse(res, {}, "Gym removed from wishlist");
        }

        await commonService.create(WISHLIST_MODEL, {
            gymId: id,
            userId: req.userData._id,
        });

        sendSuccessResponse(res, {}, "Gym added to wishlist");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};


export const listWishlistGymController = async (req, res) => {
    try {
        const { lat, long } = req.query;

        // Validate lat and long
        if (!lat || !long) {
            return sendErrorResponse(res, "Please provide lat and long to get wishlist gyms.", 400);
        }

        if (!req.userData?._id) {
            return sendErrorResponse(res, "Please provide access token to fetch wishlists.", 404);
        }

        const gymWishlist = await WISHLIST_MODEL.find({
            userId: req.userData._id,
            gymId: { $exists: true }
        }).populate("gymId");

        const list = [];

        if (gymWishlist) {
            for (let gym of gymWishlist) {
                gym = JSON.parse(JSON.stringify(gym));

                // Extract gym coordinates
                const gymLat = gym.gymId?.location?.coordinates[1];
                const gymLong = gym.gymId?.location?.coordinates[0];

                // Calculate distance
                const distanceInKm = commonService.calculateDistance(
                    parseFloat(lat),
                    parseFloat(long),
                    parseFloat(gymLat),
                    parseFloat(gymLong)
                );

                const isWishlist = await WISHLIST_MODEL.findOne({
                    userId: new mongoose.Types.ObjectId(req.userData?._id),
                    gymId: new mongoose.Types.ObjectId(gym.gymId._id),
                });

                list.push({
                    ...gym,
                    isWishlist: !!isWishlist,
                    distanceInKm: parseFloat(distanceInKm.toFixed(2)),
                });
            }
        }

        sendSuccessResponse(res, list, "Wishlisted gyms fetched successfully");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};


export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, long } = req.query;

        if (!lat || !long) {
            return sendErrorResponse(res, "Please provide lat and long to get gym details.", 400);
        }

        // if (!req.userData?._id) {
        //     return sendErrorResponse(res, "Please provide access token to fetch gym details.", 404);
        // }

        const gym = await GymModel.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [parseFloat(long), parseFloat(lat)]
                    },
                    distanceField: "distance",
                    spherical: true,
                    key: "location"
                }
            },
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    isDeleted: false,
                    active: true,
                }
            },
            {
                $lookup: {
                    from: "Rating",
                    localField: "reviews",
                    foreignField: "_id",
                    as: "reviews"
                }
            },
            {
                $addFields: {
                    reviews: {
                        $filter: {
                            input: "$reviews",
                            as: "review",
                            cond: {
                                $and: [
                                    { $eq: ["$$review.status", true] },
                                    { $eq: ["$$review.isDeleted", false] }
                                ]
                            }
                        }
                    }
                }
            }
        ]);

        if (!gym.length) {
            return sendErrorResponse(res, "Gym not found", 404);
        }

        const packages = await GymPkgModel.find({ gymId: id, isBlocked: false, isDeleted: false });

        let wishlisted;
        if (req.userData?._id) {
            wishlisted = await commonService.findOne(WISHLIST_MODEL, {
                gymId: id,
                userId: req.userData._id,
            });
        }

        const data = { ...gym[0], packages, wishlisted: wishlisted ? true : false };

        sendSuccessResponse(res, data, "Gym fetched successfully with distance");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};

export const getCartByGymId = async (req, res) => {
    try {
        if (!req.userData?._id) {
            return sendErrorResponse(res, "Please provide access token to fetch gym details.", 404);
        }
        const gymId = req.params.id;
        const userId = req.userData._id;
        const cart = await GymCartModel.findOne({ userId, gymId, status: 1, isDeleted: false }).populate("packageId");

        sendSuccessResponse(res, cart ? cart : {}, "Gym cart data fetched successfully");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};

export const addTocart = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";
        let { gymId, packageId, duration } = req.body;
        const pkg = await GymPkgModel.findById(packageId);
        if (!pkg) {
            return sendErrorResponse(res, "Package not found", 404);
        }
        const durationExist = pkg.durations.find((p) => p.duration === Number(duration));
        if (!durationExist) {
            return sendErrorResponse(res, "Duration not found in package", 404);
        }
        const cart = await GymCartModel.findOne({ userId, gymId, status: 1, isDeleted: false }).populate("packageId");
        if (cart) {
            const update = await GymCartModel.findByIdAndUpdate(cart._id, { packageId, duration, amount: durationExist.price }, { new: true })
            const cartData = await GymCartModel.findById(update._id).populate("packageId");
            return sendSuccessResponse(res, cartData, "Cart updated");
        } else {
            const newCart = await GymCartModel.create({ userId, gymId, packageId, duration, amount: durationExist.price });
            const cartData = await GymCartModel.findById(newCart._id).populate("packageId");
            return sendSuccessResponse(res, cartData, "Package added to cart");
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getCartData = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";
        const cart = await GymCartModel.find({ userId, status: 1, isDeleted: false }).populate("gymId packageId");
        return sendSuccessResponse(res, cart, "Cart Data");

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getCartItem = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const { lat, long } = req.query;

        if (!lat || !long) {
            return sendErrorResponse(res, "Please provide lat and long to get gym details.", 400);
        }
        const cartId = req.params.id;
        const userId = req.userData?._id || "66b3100580cc5b313c166b7a";
        const cart = await GymCartModel.findOne({ _id: cartId, userId, status: 1, isDeleted: false })
            .populate("gymId", "-accessToken -bankDetails -documents -otp -rejected_reason")
            .populate("packageId");
        if (!cart) {
            return sendErrorResponse(res, "Cart item not found", 404);
        }
        const gym = cart.gymId;
        const gymLat = gym?.location?.coordinates[1];
        const gymLong = gym?.location?.coordinates[0];

        // Calculate distance
        const distanceInKm = commonService.calculateDistance(
            parseFloat(lat),
            parseFloat(long),
            parseFloat(gymLat),
            parseFloat(gymLong)
        );
        return sendSuccessResponse(res, { ...cart.toObject(), distanceInKm }, "Cart Details");
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const deleteCartItem = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const cartId = req.params.id;
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";
        const cartData = await GymCartModel.findOne({ _id: cartId, userId, isDeleted: false, status: 1 });
        if (!cartData) {
            return sendErrorResponse(res, "Cart item not found", 404);
        }
        const update = await GymCartModel.findByIdAndUpdate(cartId, { isDeleted: true }, { new: true });
        return sendSuccessResponse(res, update, "Cart Data Deleted");

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getGymOffers = async (req, res) => {
    try {
        let gymId = req.params.id;
        let { search } = req.query;
        let detail = [];

        const pipeline = [
            {
                $match: {
                    isDeleted: false,
                    isActive: true,
                    gymId: new mongoose.Types.ObjectId(gymId),
                    packageExpired: { $gte: new Date().getTime() }
                }
            },
            {
                $project: {
                    offerId: 1,
                    bannerId: 1,
                    packageExpired: 1,
                    isPurchasedBysubscription: 1,
                    createdAt: 1,
                    isActive: 1,
                    updatedAt: 1,
                }
            },
            {
                $lookup: {
                    from: 'Offers',
                    let: { orderId: '$offerId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$orderId'],
                                }
                            }
                        }
                    ],
                    as: 'offerDetail'
                }
            },
            {
                $unwind: {
                    path: "$offerDetail",
                    preserveNullAndEmptyArrays: true
                }
            },
            ...(search
                ? [
                    {
                        $match: {
                            "offerDetail.promoCode": {
                                $regex: search, // its a case sensitive search
                            }
                        }
                    }
                ]
                : []
            ),
            {
                $lookup: {
                    from: "Banners",
                    localField: "bannerId",
                    foreignField: "_id",
                    as: "bannerDetail",
                },
            },
            {
                $unwind: {
                    path: "$bannerDetail",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    name: "$offerDetail.name",
                    promoCode: "$offerDetail.promoCode",
                    joinFee: "$offerDetail.joinFee",
                    createdAt: 1,
                    termAndCondition: "$offerDetail.termAndCondition",
                    service: "$offerDetail.service",
                    eligibityCriteria: "$offerDetail.eligibityCriteria",
                    discountUpto: "$offerDetail.discountUpto",
                    discountType: "$offerDetail.discountType",
                    startDate: "$offerDetail.startDate",
                    endDate: "$offerDetail.endDate",
                    flatDiscountValue: "$offerDetail.flatDiscountValue",
                    percentDiscountValue: "$offerDetail.percentDiscountValue",
                    bogoValues: "$offerDetail.bogoValues",
                    bannerType: "$bannerDetail.bannerType",
                    updatedAt: 1,
                    isPurchasedBysubscription: 1,
                    packageExpired: 1,
                    isActive: 1
                }
            }
        ]

        detail = await Gym_Offer_Order_Model.aggregate(pipeline);


        return sendSuccessResponse(res, detail, "Gym Offers", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const applyPromoCode = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";
        let { cartId, promoCode } = req.body;
        const cartData = await GymCartModel.findOne({ _id: cartId, userId, status: 1, isDeleted: false });
        if (!cartData) {
            return sendErrorResponse(res, 'Cart Not Found', HttpStatus.NOT_FOUND);
        }

        let promoDetails;

        const pipeline = [
            {
                $match: {
                    isDeleted: false,
                    isActive: true,
                    gymId: new mongoose.Types.ObjectId(cartData.gymId),
                    packageExpired: { $gte: new Date().getTime() }
                }
            },
            {
                $project: {
                    offerId: 1,
                    bannerId: 1,
                    packageExpired: 1,
                    isPurchasedBysubscription: 1,
                    createdAt: 1,
                    isActive: 1,
                    updatedAt: 1,
                }
            },
            {
                $lookup: {
                    from: 'Offers',
                    let: { orderId: '$offerId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$orderId'],
                                }
                            }
                        }
                    ],
                    as: 'offerDetail'
                }
            },
            {
                $unwind: {
                    path: "$offerDetail",
                    preserveNullAndEmptyArrays: true
                }
            },
            ...(promoCode
                ? [
                    {
                        $match: {
                            $or: [
                                { "_id": mongoose.Types.ObjectId.isValid(promoCode) ? new mongoose.Types.ObjectId(promoCode) : null },
                                { "offerDetail.promoCode": promoCode } // Exact case-sensitive match
                            ]
                        }
                    }
                ]
                : []
            ),
            {
                $lookup: {
                    from: "Banners",
                    localField: "bannerId",
                    foreignField: "_id",
                    as: "bannerDetail",
                },
            },
            {
                $unwind: {
                    path: "$bannerDetail",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    name: "$offerDetail.name",
                    promoCode: "$offerDetail.promoCode",
                    termAndCondition: "$offerDetail.termAndCondition",
                    service: "$offerDetail.service",
                    eligibityCriteria: "$offerDetail.eligibityCriteria",
                    discountUpto: "$offerDetail.discountUpto",
                    discountType: "$offerDetail.discountType",
                    startDate: "$offerDetail.startDate",
                    endDate: "$offerDetail.endDate",
                    flatDiscountValue: "$offerDetail.flatDiscountValue",
                    percentDiscountValue: "$offerDetail.percentDiscountValue",
                    // packageExpired: 1,
                    // isActive: 1
                }
            }
        ]

        const promoCodeDetails = await Gym_Offer_Order_Model.aggregate(pipeline);
        if (promoCodeDetails.length > 0) {
            promoDetails = promoCodeDetails[0];
        }

        if (!promoDetails) {
            return res.status(404).send({ message: "No promo code found" });
        }

        // eligibityCriteria => 1 - First Order , 2 Every Order
        // discountType => 1 - Flat , 2 Percentage

        function calculateCartTotal(cartData, promoDetails, isFirstOrder) {
            let itemTotal = cartData.amount;
            let discount = 0;
            let amountToPay = itemTotal;

            // if (promoDetails.eligibityCriteria === 1 && !isFirstOrder) {
            //     return { itemTotal, discount, amountToPay }; 
            // }

            if (promoDetails.discountType === 1) {
                discount = promoDetails.flatDiscountValue;
            } else if (promoDetails.discountType === 2) {
                discount = (itemTotal * promoDetails.percentDiscountValue) / 100;
            }
            discount = Math.min(discount, promoDetails.discountUpto);

            // Calculate final amount
            amountToPay = itemTotal - discount;

            return { itemTotal, discount, amountToPay };
        }

        const calculatedTotal = calculateCartTotal(cartData, promoDetails)



        return sendSuccessResponse(res, calculatedTotal, "Calculations after promocode is applied", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const checkout = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";
        const { gymCartId, promoCodeId, amountPaid, discount = 0, paymentMethod, paymentId, startDate } = req.body;
        if (!gymCartId || !amountPaid || !paymentMethod || !paymentId || !startDate) {
            return sendErrorResponse(res, 'Required fields are missing', 400);
        }
        const cartData = await GymCartModel.findOne({ _id: gymCartId, userId, status: 1, isDeleted: false });
        if (!cartData) {
            return sendErrorResponse(res, 'Cart Not Found', HttpStatus.NOT_FOUND);
        }

        function calculateEndDate(startDateTimestamp, numberOfMonths) {
            let startDate = new Date(Number(startDateTimestamp));
            startDate.setUTCHours(0, 0, 0, 0);
            let endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + numberOfMonths);
            endDate.setDate(endDate.getDate() - 1);
            endDate.setUTCHours(23, 59, 59, 999);

            return {
                startDate: startDate.getTime(),
                endDate: endDate.getTime()
            };
        }

        const result = calculateEndDate(startDate, cartData.duration);

        let validPromoCodeId = false;
        if (promoCodeId) {
            validPromoCodeId = mongoose.Types.ObjectId.isValid(promoCodeId);
        }

        const subscription = await GymSubscriptions.create({
            userId,
            gymCartId,
            gymId: cartData.gymId,
            startDate: result.startDate,
            endDate: result.endDate,
            promoCodeId: validPromoCodeId ? promoCodeId : undefined,
            amountPaid,
            discount,
            paymentMethod,
            paymentId
        });

        await GymCartModel.findByIdAndUpdate(cartData._id, { status: 0 });

        return sendSuccessResponse(res, subscription, "Subscribed", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getSubscriptions = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";

        let subscriptions = await GymSubscriptions.find({ userId })
            .populate({
                path: "gymId",
                populate: {
                    path: "reviews",
                    match: { userId, isDeleted: false }
                },
                select: "name location reviews averageRating"
            })
            .populate({
                path: "gymCartId",
                populate: {
                    path: "packageId",
                    select: "name gender description termAndCond"
                }
            })
            .lean();

        subscriptions = subscriptions.map(sub => ({
            ...sub,
            gymId: {
                ...sub.gymId,
                reviews: sub.gymId?.reviews?.filter(review => review.subscriptionId?.toString() === sub._id.toString()) || []
            }
        }));

        return sendSuccessResponse(res, subscriptions, "All Subscriptions");

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};


export const renewSubscription = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";
        const subscriptionId = req.params.id
        const subscription = await GymSubscriptions.findOne({ _id: subscriptionId, userId }).populate("gymId gymCartId");
        if (!subscription) {
            return sendErrorResponse(res, 'Subscription Not Found', HttpStatus.NOT_FOUND);
        }
        const cartData = subscription.gymCartId.toJSON();
        delete cartData._id;
        const renew = await GymCartModel.create({ ...cartData, status: 1, createdAt: new Date().getTime(), updatedAt: new Date().getTime() });
        return sendSuccessResponse(res, renew, "Added to cart");

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const gymRating = async (req, res) => {
    try {
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        let { subscriptionId, rating, review = "" } = req.body;
        if (!rating) {
            return sendErrorResponse(res, 'Rating is required', HttpStatus.BAD_REQUEST);
        }
        if (!subscriptionId) {
            return sendErrorResponse(res, 'subscriptionId is required', HttpStatus.BAD_REQUEST);
        }
        const userId = req.userData?._id || "66b21978c603897ff5d0577d";
        const subscription = await GymSubscriptions.findOne({ _id: subscriptionId, userId })
        if (!subscription) {
            return sendErrorResponse(res, 'Subscription Not Found', HttpStatus.NOT_FOUND);
        }
        const existingRating = await RATING_MODEL.findOne({ userId, subscriptionId });
        let response;
        if (existingRating) {
            response = await RATING_MODEL.findByIdAndUpdate(existingRating._id, { star: Number(rating), review, status: true, isDeleted: false }, { new: true });
        } else {
            response = await RATING_MODEL.create({
                userId,
                subscriptionId,
                gymId: subscription.gymId,
                star: Number(rating),
                review,
            })
        }

        const gym = await GymModel.findById(subscription.gymId);
        if (!gym) {
            throw new Error("Gym not found");
        }
        if (!gym.location || !gym.location.coordinates || gym.location.coordinates.length === 0) {
            gym.location = {
                type: "Point",
                coordinates: [0, 0],
            };
        }
        if (!gym.rejected_reason || !gym?.rejected_reason?.rejectedBy || gym.rejected_reason.rejectedBy === '') {
            gym.rejected_reason.rejectedBy = null;
        }
        if (!gym?.reviews?.includes(response._id)) {
            gym.reviews.push(response._id);
        };
        await gym.save();

        return sendSuccessResponse(res, response, "Rating Created", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};