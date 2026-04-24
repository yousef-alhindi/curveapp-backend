import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { OfferModel } from '../../models/admin/offer.model';
import { EnrolledOfferModel } from '../../models/admin/enrolled.offer.model';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import mongoose from 'mongoose';
import { discountType, joiningFeeType } from '../../constants/offer.constants';
import { Offer_Order_Model } from '../../models/restaurant/offerOrder.model';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

export const getOfferList = async (req, res) => {
   try {
      const { page, limit, fromDate, toDate, searchQuery, serviceType } = req.query;
      let matchStage = { isDeleted: false };
      let projectStage = {};

      // Handle Date Range Filtering
      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }

      // Status based Filtering
      matchStage.status = true;

      // Handle Search Query
      if (searchQuery) {
         matchStage.$or = [{ promoCode: { $regex: searchQuery, $options: 'i' } }];
      }

      // service based Filtering
      if (serviceType) {
         matchStage.service = serviceType;
      }

      // Project Stage
      projectStage = {
         _id: 1,
         name: 1,
         promoCode: 1,
         isPromoCodeRequired: 1,
         joinFee: 1,
         flatDiscountValue: {
            $cond: {
               if: { $eq: ['$flatDiscountValue', 0] },
               then: '$$REMOVE',
               else: '$flatDiscountValue',
            },
         },
         percentDiscountValue: {
            $cond: {
               if: { $eq: ['$percentDiscountValue', 0] },
               then: '$$REMOVE',
               else: '$percentDiscountValue',
            },
         },
         minimumOrderValue: 1,
         service: 1,
         joiningFeeType: 1,
         discountType: 1,
         bogoValues: {
            buy: {
               $cond: {
                  if: { $eq: ['$bogoValues.buy', 0] },
                  then: '$$REMOVE',
                  else: '$bogoValues.buy',
               },
            },
            get: {
               $cond: {
                  if: { $eq: ['$bogoValues.get', 0] },
                  then: '$$REMOVE',
                  else: '$bogoValues.get',
               },
            },
         },
         discountUpto: 1,
         startDate: 1,
         endDate: 1,
         eligibityCriteria: 1,
         status: 1,
         termAndCondition: 1,
         createdAt: 1,
         updatedAt: 1,
      };

      const resp = await commonService.listAggregation({
         model: OfferModel,
         page,
         limit,
         searchQuery,
         matchStage,
         projectStage,
      });

      if (resp) {
         sendSuccessResponse(res, resp, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getOfferVendorList = async (req, res) => {
   try {
      const { page, limit, searchQuery, offerId } = req.query;
      let searchCondition = {};
      if (!!searchQuery) {
         searchCondition = {
            $or: [
               { 'restaurant.ownerName': { $regex: searchQuery, $options: 'i' } },
            ]
         };
      }

      let result = await Offer_Order_Model.aggregate([{
         $match: {
            isDeleted: false,
            offerId: new mongoose.Types.ObjectId(offerId),
            packageExpired: { $gte: new Date().getTime() }
         }
      },
      {
         $project: {
            offerId: 1,
            packageExpired: 1,
            isPurchasedBysubscription: 1,
            createdAt: 1,
            updatedAt: 1,
            restId: 1,
         }
      },
      {
         $lookup: {
            from: 'Restaurant',
            localField: 'restId',
            foreignField: '_id',
            as: 'restaurant',
         },
      },
      {
         $unwind: {
            path: '$restaurant',
            preserveNullAndEmptyArrays: true,
         },
      },
      {
         $lookup: {
            from: "Offers",
            let: { orderId: "$offerId" },
            pipeline: [
               {
                  $match: {
                     $expr: {
                        $eq: ["$_id", "$$orderId"]
                     }
                  }
               }
            ],
            as: "offerDetail"
         }
      },
      { $unwind: { path: "$offerDetail", preserveNullAndEmptyArrays: true } },
      {
         $sort: {
            createdAt: -1,
         },
      },
      {
         $match: searchCondition
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
            updatedAt: 1,
            isPurchasedBysubscription: 1,
            packageExpired: 1,
            restaurantAddressDetails: "$restaurant.addressDetails",
            restaurantName: "$restaurant.resName",
            restaurantOwnerName: "$restaurant.ownerName",
         }
      }
      ])
      sendSuccessResponse(res, result, success.LIST_FETCH, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const create = async (req, res) => {
   try {
      let data = req.body;
      const addOffer = await commonService.create(OfferModel, data);
      if (addOffer) {
         sendSuccessResponse(res, addOffer, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const edit = async (req, res) => {
   try {
      let { id } = req.params;
      let { isPromoCodeRequired, joiningFeeType: joiningType, discountType: discount } = req.body;
      let data = req.body;
      if (!isPromoCodeRequired) {
         data.promoCode = '';
      }
      if (joiningType === joiningFeeType.free) {
         data.joinFee = 0;
      }
      if (discount === discountType.bogo) {
         data.flatDiscountValue = 0;
         data.percentDiscountValue = 0;
      } else if (discount === discountType.flat) {
         data.bogoValues = { buy: 0, get: 0 };
         data.percentDiscountValue = 0;
      } else if (discount === discountType.percentage) {
         data.bogoValues = { buy: 0, get: 0 };
         data.flatDiscountValue = 0;
      }
      const checkOffer = await commonService.findOne(OfferModel, {
         _id: id,
      });
      if (!checkOffer) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const update = await commonService.findOneAndUpdate(OfferModel, checkOffer._id, data);
      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      } else {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteOffer = async (req, res) => {
   try {
      let { id } = req.params;
      const checkResCat = await commonService.findOne(OfferModel, { _id: id });
      if (!checkResCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
         return;
      }
      const update = await commonService.findOneAndUpdate(OfferModel, checkResCat._id, { isDeleted: true });
      if (update) {
         sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const showOfferDiscount = async (req, res) => {
   try {
      const showDiscount = await OfferModel.find({ isDeleted: false }, { discountUpto: 1, discountType: 1 });
      sendSuccessResponse(res, { showDiscount }, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
