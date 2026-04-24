import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { CategoryModel } from '../../models/admin/category.models';
import { OfferModel } from '../../models/admin/offer.model';
const mongoose = require('mongoose'); // mongoose database
// const ObjectId = mongoose.Types.ObjectId;
import moment from 'moment';
import { BannerModel } from '../../models/admin/banner.model';
import { randomIntegerGenerate } from '../../utils/helper';
import { transactionType } from '../../constants/wallet.constants';
import { Sup_Offer_Order_Model } from '../../models/supplement/offerOrder.model';
import { SupplementTransactionModel } from '../../models/supplement/supplementTransaction.model';
import { SupplementWalletModel } from '../../models/supplement/supplementWallet.model';
import { Sup_Offer_Category_Model } from '../../models/supplement/offerCategory.model';

var randomize = require('randomatic');
const ObjectId = mongoose.Types.ObjectId;

/****************************************
*************** SPRINT 7 ****************
***************body**************************/

export const OfferSaveTransaction = async (req, res) => {
    try {
        let supData = req.supplementData
        if (!req.body?.offerId) {
            return sendErrorResponse(res, "Send Offer ID", HttpStatus.BAD_REQUEST);
        }

        const offerRespone = await commonService.findById(OfferModel, req.body.offerId)
        if (!offerRespone) {
            return sendErrorResponse(res, "Offer ID is invalid", HttpStatus.BAD_REQUEST);
        }

        const alreadyPurchased = await commonService.findOne(Sup_Offer_Order_Model, { offerId: new ObjectId(req.body.offerId), supplementSeller: supData._id })
        if (!!alreadyPurchased) {
            return sendErrorResponse(res, "You have already purchased this offer.", HttpStatus.BAD_REQUEST);
        }

        req.body.amount = offerRespone.joinFee
        req.body.endDate = offerRespone.endDate
        req.body.startDate = offerRespone.startDate
        req.body.discountUpto = offerRespone.discountUpto
        req.body.createdAt = new Date().getTime()
        req.body.updatedAt = new Date().getTime()
        req.body.isPurchasedBysubscription = req.body.isPurchasedBysubscription
        req.body.supplementSeller = supData._id
        let transactionId = '#' + randomize('0', 9);
        const transaction = await SupplementTransactionModel.create({
            paymentFor: 3,
            userId: null,
            amount: Number(offerRespone.joinFee),
            supplementId: supData._id,
            transactionType: transactionType.debit,
            transactionId,
            createdAt: new Date().getTime()
        });
        
        req.body.transactionId = transaction._id
        const startDate = moment.unix(parseInt(req.body.startDate) / 1000);
        const endDate = moment.unix(parseInt(req.body.endDate) / 1000);
        const daysDifference = endDate.diff(startDate, 'days');
        req.body.packageExpired = moment().add(daysDifference, 'days').toDate().getTime();
        req.body.orderId = "CV-ODR" + randomIntegerGenerate()
        let data = await commonService.create(Sup_Offer_Order_Model, req.body)
        
        if (req.body?.isWalletSelected) {
            let wallet = await SupplementWalletModel.findOne({ supplementId: new mongoose.Types.ObjectId(req.supplementData?._id) });
            if (!!wallet) {
                let newBalance = 0
                if (Number(wallet?.balance) > Number(offerRespone.joinFee)) {
                    newBalance = Number(wallet?.balance) - Number(offerRespone.joinFee);
                }

                await SupplementWalletModel.findByIdAndUpdate(wallet._id, { balance: newBalance });
            }
        }

        return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
    return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
}
}

export const newOfferList = async (req, res) => {
    try {
        const { status = "1" , bannerType} = req.query
        let supData = req.supplementData
        let detail = []
        let query ={};
        if(bannerType && bannerType.length>0&&  bannerType!=='0'){
            query.bannerType=Number(bannerType)
        }
        if (status == "1") {
            let detailData = await BannerModel.aggregate([
                {
                    $lookup: {
                        from: 'Offers',
                        localField: 'offerRef', // The field in BannerModel to populate
                        foreignField: '_id',
                        as: 'offerDetail'
                    }
                },
                {
                    $unwind: {
                        path: '$offerDetail',
                        preserveNullAndEmptyArrays: true // This will include banners without an offerRef
                    }
                },
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $gte: ["$offerDetail.endDate", new Date().getTime()] }
                            ]
                        },
                        isDeleted: false,
                        service : 'Supplement',
                        ...query
                    }
                },
                {
                    $sort: {
                        createdAt: -1, // Sort by banner creation date
                    }
                },
                {
                    $project: {
                        offerId: '$offerRef',
                        name: '$offerDetail.name',
                        code: '$offerDetail.code',
                        joinFee: '$offerDetail.joinFee',
                        service: '$offerDetail.service',
                        eligibityCriteria: '$offerDetail.eligibityCriteria',
                        flatDiscountValue: '$offerDetail.flatDiscountValue',
                        percentDiscountValue: '$offerDetail.percentDiscountValue',
                        bogoValues: '$offerDetail.bogoValues',
                        discountUpto: '$offerDetail.discountUpto',
                        termAndCondition: '$offerDetail.termAndCondition',
                        discountType: '$offerDetail.discountType',
                        startDate: '$offerDetail.startDate',
                        endDate: '$offerDetail.endDate',
                        promoCode: '$offerDetail.promoCode',
                        createdAt: '$createdAt',
                        bannerType: '$bannerType',
                        image: '$image',
                        colorCode: '$colorCode',
                    }
                }
            ]);

            console.log("detailData....",detailData)
            let existingData = await Sup_Offer_Order_Model.aggregate([{
                $match: {
                    isDeleted: false,
                    supplementSeller: supData._id,
                    packageExpired: { $gte: new Date().getTime() }
                },
            }, {
                $sort: {
                    createdAt: -1,
                },
            },])
            existingData = existingData.map(d => String(d.offerId))
            detail = detailData.filter(d => !existingData.includes(String(d.offerId)))
        } else {
            let detailData = await CategoryModel.find({ isDeleted: false })
            // need filter of service : Gym (for that need to create that properly first)
            let existingData = await Sup_Offer_Category_Model.find({ supplementSeller: supData._id }).populate("categoryId").sort({ createdAt: -1 })
            existingData = existingData.map(d => String(d.categoryId._id))
            detail = detailData.filter(d => !existingData.includes(String(d._id)))
        }
        return sendSuccessResponse(res, detail, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const buyOfferList = async (req, res) => {
    try {
        const { status = "1",bannerType } = req.query;
        let supData = req.supplementData;
        let detail = [];

        let query ={};
        if(bannerType && bannerType.length>0&&  bannerType!=='0'){
            query.bannerType=Number(bannerType)
        }

        if (status === "1") {
            const pipeline = [
                {
                    $match: {
                        isDeleted: false,
                        supplementSeller: supData._id,
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
                        code: "$offerDetail.code",
                        joinFee: "$offerDetail.joinFee",
                        createdAt: 1,
                        termAndCondition: "$offerDetail.termAndCondition",
                        service: "$offerDetail.service",
                        eligibityCriteria: "$offerDetail.eligibityCriteria",
                        discountUpto: "$offerDetail.discountUpto",
                        discountType: "$offerDetail.discountType",
                        promoCode: "$offerDetail.promoCode",
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

             // Add the conditional match for bannerType if it exists
            if (query.bannerType) {
                pipeline.splice(6, 0, { // Insert after the second unwind
                    $match: {
                        'bannerDetail.bannerType': query.bannerType
                    }
                });
            }

            detail = await Sup_Offer_Order_Model.aggregate(pipeline);
        } else {
            detail = await Sup_Offer_Category_Model.find({ supplementSeller: supData._id })
                .populate("categoryId")
                .sort({ createdAt: 1 });
        }

        return sendSuccessResponse(res, detail, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const offerActiveandDeactive = async (req, res) => {
    try {
        let { joinedOfferId, isActive } = req.body;
        let joinedOfferResponse = await commonService.findById(Sup_Offer_Order_Model, joinedOfferId);
        
        if (!joinedOfferResponse) {
            return sendErrorResponse(res, "Joined Offer ID is invalid", HttpStatus.BAD_REQUEST);
        }

        let resp = await Sup_Offer_Order_Model.findByIdAndUpdate(
            { _id: joinedOfferId },
            { $set: { isActive: isActive } },
            { new: true }
        );

        const message = isActive ? "Offer is unblocked successfully" : "Offer is blocked successfully";

        return sendSuccessResponse(res, resp , message, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const offerSaveCategory = async (req, res) => {
    try {
        let { categoryId, amount = 0 } = req.body
        let categoryResponse = await commonService.findById(CategoryModel, categoryId)
        if (!categoryResponse) {
            return sendErrorResponse(res, "Category ID is invalid", HttpStatus.BAD_REQUEST);
        }

        if (categoryResponse.joinFee != amount) {
            return sendErrorResponse(res, "Please provide valid amount to purchase subscription", HttpStatus.BAD_REQUEST);
        }

        let offerCategoryResponse = await commonService.findOne(Sup_Offer_Category_Model, { categoryId, supplementSeller: req.supplementData?._id })
        if (!!offerCategoryResponse) {
            return sendErrorResponse(res, "You have already joinded the category", HttpStatus.BAD_REQUEST);
        }

        if (req.body?.isWalletSelected) {
            let wallet = await SupplementWalletModel.findOne({ supplementId: new mongoose.Types.ObjectId(req.supplementData?._id) });
            if (!!wallet) {
                let newBalance = 0
                if (Number(wallet?.balance) > Number(amount)) {
                    newBalance = Number(wallet?.balance) - Number(amount);
                }

                await SupplementWalletModel.findByIdAndUpdate(wallet._id, { balance: newBalance });
            }
        }

        const transactionId =  '#' + randomize('0', 9)
        const transaction = await SupplementTransactionModel.create({
            paymentFor: 4,
            userId: null,
            amount: amount,
            supplementId: req.supplementData?._id,
            transactionType: transactionType.debit,
            transactionId,
            createdAt: new Date().getTime()
        });
        

        const orderId = "CV-ODC" + randomIntegerGenerate()
        let resp = await Sup_Offer_Category_Model.create({ categoryId, transactionId: transaction._id, orderId, amount, supplementSeller: req.supplementData?._id, createdAt: new Date().getTime() });

        return sendSuccessResponse(res, resp, success.UPDATED, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const categoryActiveandDeactive = async (req, res) => {
    try {
        let { joinedCategoryId, isActive } = req.body
        let joinedOfferResponse = await commonService.findById(Sup_Offer_Category_Model, joinedCategoryId)
        if (!joinedOfferResponse) {
            return sendErrorResponse(res, "Joined Category ID is invalid", HttpStatus.BAD_REQUEST);
        }

        let resp = await Sup_Offer_Category_Model.findByIdAndUpdate(
            { _id: joinedCategoryId },
            { $set: { isActive: isActive } },
            { new: true }
        );

        return sendSuccessResponse(res, resp, success.UPDATED, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}