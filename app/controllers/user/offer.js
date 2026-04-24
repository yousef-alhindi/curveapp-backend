import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { Offer_Order_Model } from '../../models/restaurant/offerOrder.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

export const offerListInDetail = async (req, res) => {
   try {
      const resData = req.userData;

      let data = await Offer_Order_Model.aggregate([
         {
            $match: {
               $expr: {
                  $and: [
                     { $eq: ['$restId', new ObjectId(req.query.restId)] },
                     { $eq: ['$isActive', true] },
                     { $eq: ['$isDeleted', false] },
                  ],
               },
            },
         },
         {
            $project: {
               offerId: 1,
               _id:0
            },
         },
         {
            $lookup: {
               from: 'Offers',
               let: { offerId: '$offerId' },
               pipeline: [
                  {
                     $match: {
                        $expr: {
                           $eq: ['$_id', '$$offerId'],
                           // $and: [
                           //    { $eq: ['$_id', '$$offerId'] },
                           //    {
                           //       $gt: [
                           //          { $add: [new Date(0), { $toLong: '$endDate' }] },  // Convert endDate to long if it's a string
                           //          new Date(),
                           //       ],
                           //    },
                           // ],
                        },
                     },
                  },
               ],
               as: 'offerDetail',
            },
         },
         { $unwind: { path: '$offerDetail', preserveNullAndEmptyArrays: true } },
         {
            $match: {
               'offerDetail': { $ne: null }  // Filter out any null or empty objects
            }
         },
         {
            $project: {
               // name: '$offerDetail.name',
               // code: '$offerDetail.code',
               // joinFee: '$offerDetail.joinFee',
               // service: '$offerDetail.service',
               // eligibityCriteria: '$offerDetail.eligibityCriteria',
               // discountUpto: '$offerDetail.discountUpto',
               // discountType: '$offerDetail.discountType',
               // startDate: '$offerDetail.startDate',
               // endDate: '$offerDetail.endDate',
               // promoCodeId : '$offerDetail._id',
               offerDetails : '$offerDetail',
               colorCode: 1,
            },
         },
      ]);

      return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      console.log(error);
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
