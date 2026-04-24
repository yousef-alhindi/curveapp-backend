import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { SubscriptionModel } from '../../models/admin/subscription.model';
const mongoose = require("mongoose"); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
import moment from 'moment';
import { Order_Subcription_Model } from '../../models/restaurant/subscriptionOrder.model';
import { Payment_Subscription_Model } from '../../models/restaurant/paymentSub.model';
var randomize = require('randomatic');

/****************************************
*************** SPRINT 2 ****************
***************body**************************/

export const subscriptionSaveTransaction= async (req, res) => {
    try {
        let resData = req.restaurantData
        req.body.amount = parseInt(req.body.amount)
        if (req.body.amount == 0 || req.body.amount == undefined || req.body.amount == "" || req.body.amount == null) {
            return sendErrorResponse(res,('Please Enter amount more than Zero'),HttpStatus.BAD_REQUEST)
        }
        if (!req.body.orderId) {
            return sendErrorResponse(res, "Send Razorpay order ID", HttpStatus.BAD_REQUEST);
        }
        if (!req.body.subscriptionId) {
            return sendErrorResponse(res, "Send Subscription ID", HttpStatus.BAD_REQUEST);
        }
        if (!req.body.amount) {
            return sendErrorResponse(res, "Send Amount", HttpStatus.BAD_REQUEST);
        }
        if (!req.body.paymentType) {
            return sendErrorResponse(res, "Send Payment Type", HttpStatus.BAD_REQUEST);
        }
        if(!req.body.subscriptionType){
            return sendErrorResponse(res, "Send Subscription Type", HttpStatus.BAD_REQUEST);
        }
        let detail = await commonService.findOne(Order_Subcription_Model,{restId:resData._id,subscriptionId:req.body.subscriptionId,subscriptionExpired:{$gte:new Date()}})
        if(detail){
        return  sendErrorResponse(res,error.Subscription_Already,HttpStatus.FORBIDDEN)
        }
        req.body.restId = resData._id
        let transaction = await commonService.create(Payment_Subscription_Model,req.body)
        req.body.transactionId = transaction._id
        var subscriptonDays = 30 * parseInt(req.body.subscriptionType)
        req.body.subscriptionExpired = new Date(moment().add(subscriptonDays, 'days'));
        let data = await commonService.create(Order_Subcription_Model,req.body)
        return sendSuccessResponse(res, { orderDetail: data }, success.SUCCESS,HttpStatus.OK)
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}
export const newSubcriptionList= async (req, res) => {
    try {
        let resData = req.restaurantData 
        let detail = await SubscriptionModel.aggregate([
            {
                $project:{
                    name:1,
                    price:1,
                    description:1,
                    duration:1,
                    termAndCond:1
                }
            },
        ])
        return sendSuccessResponse(res, { orderDetail: detail },success.SUCCESS,HttpStatus.OK)
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}
export const subscriptionBuyList= async (req, res) => {
    try {
        let resData = req.restaurantData 
        let detail = await Order_Subcription_Model.aggregate([{
            $match:{
               restId:resData._id,
            }
            },
            {
                $project:{
                    subscriptionId:1,
                    subscriptionExpired:1,
                }
            },
            {
                $lookup: {
                    from: "Subscription",
                    let: { subId: "$subscriptionId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$subId"]
                                }
                            }
                        }
                    ],
                    as: "subDetail"
                }
            },
            { $unwind: { path: "$subDetail", preserveNullAndEmptyArrays: true } },
            {
                $project:{
                    name:"$subDetail.name",
                    price:"$subDetail.price",
                    description:"$subDetail.description",
                    duration:"$subDetail.duration",
                    termAndCond:"$subDetail.termAndCond",
                    subscriptionExpired:1,
                }
            }
    ])
        return sendSuccessResponse(res, { orderDetail: detail },success.SUCCESS,HttpStatus.OK)
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}