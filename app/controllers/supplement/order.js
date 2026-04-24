import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { status } from '../../constants/order.constants';
import SupplementOrderModel from '../../models/supplement/supplementOrder.model';
import SupplementOrderDeliveryModel from '../../models/delivery/supplementDeliveryModel';
import { SupplementModel } from '../../models/supplement/supplement';
import { SupplementPkgModel } from '../../models/supplement/supplementPkg.model';
const mongoose = require('mongoose'); // mongoose database


// Get Order List
export const orderList = async (req, res) => {
    try {
        const sellerId = req?.tokenData?._id;
        if (!sellerId) {
            return sendErrorResponse(res, "Invalid token", HttpStatus.BAD_REQUEST);
        }

        const { status, orderType, startDate, endDate, search, deliveryOption, page = 1, limit = 10 } = req.query;

        const matchStage = {};

        if (status) {
            matchStage.status = Number(status);
        }

        if (deliveryOption) {
            matchStage.deliveryOption = Number(deliveryOption);
        }

        if (orderType) {
            switch (orderType) {
                case 'new':
                    matchStage.status = 1;
                    break;
                case 'ongoing':
                    matchStage.status = { $in: [2, 3] };
                    break;
                case 'past':
                    matchStage.status = { $in: [4, 5] };
                    break;
                default:
                    break;
            }
        }

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const searchFilter = {};

        if (search) {
            searchFilter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'userId.fullName': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const aggregationPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'User',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userId',
                },
            },
            { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
            { $match: searchFilter },
            {
                $lookup: {
                    from: 'supplementCarts',
                    localField: 'supplementCartId',
                    foreignField: '_id',
                    as: 'supplementCartId',
                },
            },
            { $unwind: { path: '$supplementCartId', preserveNullAndEmptyArrays: true } },

            // Match supplementSeller
            {
                $match: {
                    'supplementCartId.supplementSeller': new mongoose.Types.ObjectId(sellerId),
                },
            },
            // {
            //     $lookup: {
            //         from: 'Supplement',
            //         localField: 'supplementCartId.items.itemId',
            //         foreignField: '_id',
            //         as: 'supplementCartId.itemsDetails',
            //     },
            // },

            // {
            //     $lookup: {
            //         from: 'SupplementPkg',
            //         localField: 'supplementCartId.bundles.bundleId',
            //         foreignField: '_id',
            //         as: 'supplementCartId.bundlesDetails',
            //     },
            // },

            // { $unwind: { path: '$supplementCartId.bundlesDetails', preserveNullAndEmptyArrays: true } },

            // {
            //     $lookup: {
            //         from: 'Supplement',
            //         localField: 'supplementCartId.bundlesDetails.products._id',
            //         foreignField: '_id',
            //         as: 'supplementCartId.bundlesDetails.productsDetails',
            //     },
            // },

            // { $unwind: { path: '$supplementCartId.bundlesDetails.productsDetails', preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'addresses',
                    localField: 'addressId',
                    foreignField: '_id',
                    as: 'addressId',
                },
            },

            {
                $lookup: {
                    from: 'SupplementOrderRating',
                    localField: 'orderRating',
                    foreignField: '_id',
                    as: 'orderRating',
                },
            },
            { $unwind: { path: '$addressId', preserveNullAndEmptyArrays: true } },

            { $sort: { updatedAt: -1 } },

            { $skip: skip },
            { $limit: Number(limit) },
        ];

        const orders = await SupplementOrderModel.aggregate(aggregationPipeline);

        const totalOrdersPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'User',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userId',
                },
            },
            { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
            { $match: searchFilter },
            {
                $lookup: {
                    from: 'supplementCarts',
                    localField: 'supplementCartId',
                    foreignField: '_id',
                    as: 'supplementCartId',
                },
            },
            { $unwind: { path: '$supplementCartId', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    'supplementCartId.supplementSeller': new mongoose.Types.ObjectId(sellerId),
                },
            },
        ];

        const totalOrders = await SupplementOrderModel.aggregate([
            ...totalOrdersPipeline,
            { $count: 'total' },
        ]);


        let items = [];
        let bundles = [];

        orders.forEach(order => {
            order.supplementCartId.items.forEach(item => {
                items.push({
                    _id: item._id,
                    itemId: item.itemId,
                    stockId: item.stockId,
                    quantity: item.quantity,
                    amount: item.amount,
                    orderId: order._id
                });
            });

            order.supplementCartId.bundles.forEach(bundle => {
                bundles.push({
                    _id: bundle._id,
                    bundleId: bundle.bundleId,
                    quantity: bundle.quantity,
                    amount: bundle.amount,
                    orderId: order._id
                });
            });
        });

        const updatedItems = await Promise.all(items.map(async (item) => {
            const supplementItem = await SupplementModel.findById(item.itemId);
            if (supplementItem) {
                const stock = supplementItem.stock.find(stock => stock._id.toString() === item.stockId.toString());
                if (stock) {
                    return {
                        ...item,
                        itemData: {
                            ...supplementItem._doc,
                            stockData: stock
                        }
                    };
                }
            }
            return item;
        }));

        const updatedBundles = await Promise.all(bundles.map(async (bundle) => {
            const supplementPkg = await SupplementPkgModel.findById(bundle.bundleId);
            if (supplementPkg) {
                const updatedProducts = await Promise.all(supplementPkg.products.map(async (product) => {
                    const supplementItem = await SupplementModel.findById(product._id);
                    if (supplementItem) {
                        const stock = supplementItem.stock.find(stock => stock._id.toString() === product.stockId.toString());
                        if (stock) {
                            return {
                                ...supplementItem.toObject(), 
                                stockData: stock 
                            };
                        }
                    }
                    return product;
                }));

                return {
                    ...bundle,
                    bundleData: {
                        ...supplementPkg.toObject(), 
                        products: updatedProducts 
                    }
                };
            }
            return bundle;
        }));

        const updatedTotalOrders = orders.map(order => {
            const items = updatedItems.filter(item => item.orderId.toString() === order._id.toString());
            const bundles = updatedBundles.filter(bundle => bundle.orderId.toString() === order._id.toString());

            return {
                ...order,
                items, 
                bundles
            };
        });


        const totalOrdersCount = totalOrders[0]?.total || 0;

        sendSuccessResponse(res, {
            orders: updatedTotalOrders,
            totalOrdersCount,
            totalPages: Math.ceil(totalOrdersCount / limit),
            currentPage: Number(page),
        }, "Orders fetched successfully");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};

// Update Order Status
export const updateSatus = async (req, res) => {
    const { orderId } = req.params;
    const { status: newStatus } = req.body;

    // Validate status
    if (!Object.values(status).includes(Number(newStatus))) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const order = await SupplementOrderModel.findById(orderId);
        if (!order || order.isDeleted) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const statusMessages = {
            2: 'Cannot change a PREPARING order to PENDING Status.',
            3: 'ONTHEWAY orders cannot be updated to PENDING or PREPARING.',
            4: 'DELIVERED orders cannot revert to PENDING, PREPARING, or ONTHEWAY.',
            5: 'CANCELED orders cannot be changed to PENDING, PREPARING, ONTHEWAY, or DELIVERED.',
        };

        const invalidTransitions = {
            2: [1],
            3: [1, 2],
            4: [1, 2, 3],
            5: [1, 2, 3, 4],
        };

        const checkInvalidTransition = (currentStatus, newStatus) => {
            return invalidTransitions[currentStatus]?.includes(newStatus);
        };

        if (checkInvalidTransition(order.status, newStatus)) {
            return res.status(409).json({ message: statusMessages[order.status] });
        }


        order.status = Number(newStatus);
        order.updatedAt = new Date().getTime(); // Update the timestamp

        await order.save();

        if (newStatus === 2) {
            const order = await SupplementOrderModel.findById(orderId)
                .populate({
                    path: 'supplementCartId',
                })
            let restId = order.supplementCartId.supplementSeller;
            const newDelivery = new SupplementOrderDeliveryModel({
                restId,
                orderId: new mongoose.Types.ObjectId(orderId),
            });

            await newDelivery.save();
        }

        res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}