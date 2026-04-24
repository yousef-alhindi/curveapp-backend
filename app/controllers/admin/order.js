import { sendErrorResponse, sendSuccessResponse } from "../../responses/response";
import HttpStatus from "http-status-codes";
import OrderModel from "../../models/user/order.model";
import { orderType } from "../../constants/order.constants";
import { filterBy as filter } from "../../constants/order.constants";
import OrderDeliveryModel from "../../models/delivery/orderDelivery.model";
import {Delivery_Model} from "../../models/delivery/delivery.model";
import { RATING_MODEL } from '../../models/user/rating.model';

import mongoose from "mongoose";

export const getOrderList = async (req, res) => {
    try{
        // filterBy = ["ongoing 1", "upcoming 2", "past 3"]
        let { filterBy,page,pageSize,restaurant,orderType,search,fromDate,toDate } = req.query; 
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;
        let query = {
            isDeleted: false,
        };
        if(search){
            query.$or = [
                { orderId: search}
            ]
        }
        if(fromDate && toDate){
            query.createdAt = { $gte: fromDate, $lte: toDate }
        }
  if (filter.ONGOING === Number(filterBy)) {
    query.status = { $in: [1,2,3] };
}

else if (filter.UPCOMING === Number(filterBy)) {
    query.orderType = 1;
    query.scheduledDate = { $gt: new Date() };   // future scheduled
}

else if (filter.PAST === Number(filterBy)) {
    query.$or = [
        { status: { $in: [4,5] } },   // delivered/cancelled
        { 
            $and: [
                { orderType: 1 },
                { scheduledDate: { $lte: new Date() } } // old scheduled
            ]
        }
    ]
}

        const totalDocuments = await OrderModel.find(query)
        .populate("userId")
        .populate({
            path:"restaurentCartId",
            ...(restaurant ? { match: { restId: restaurant } } : {}), 
            populate:("restId"),
        });

        const orderResponse = await OrderModel.find(query)
        .populate("userId")
        .populate({
            path:"restaurentCartId",
            ...(restaurant ? { match: { restId: restaurant } } : {}), 
            populate:("restId"),
        })
        // .populate("restaurentCartId.restId")
        .skip((page-1)*pageSize)
        .limit(pageSize)
        .lean(true)

        if(orderResponse.length > 0){
            for(let order of orderResponse){
                const orderDelivery = await OrderDeliveryModel.findOne({orderId: order._id}).select("deliveryBoyId").lean(true);
                if(orderDelivery && orderDelivery.deliveryBoyId){
                    const deliveryBoy = await Delivery_Model.findById(orderDelivery.deliveryBoyId);
                    order.deliveryBoy = deliveryBoy;
                }
            }
        }


        if(orderResponse.length > 0){

            for(let order of orderResponse){
                const ratingData = await RATING_MODEL.find({orderId : new mongoose.Types.ObjectId(order._id)},{review:1,items:1,restId:1,orderId:1,star:1})
                        .populate({
                            path:'items._id',
                            select: 'name'
                        })
                        .populate({
                            path:'restId',
                            select: 'resName'
                        })
                        .populate({
                            path:'orderId',
                            select: 'orderId'
                        })
                        .lean();
                        ratingData.length > 0 && ratingData[0].items.map((item,index)=>{
                            ratingData[0].items[index] = {...item._id,rating : item.rating}
                        })    
                const deliveryBoyRatting = await OrderDeliveryModel.findOne({orderId: order._id},{deliveryBoyRating:1, deliveryBoyId:1}).populate({
                    path: "deliveryBoyId",
                    select: "name mobileNumber"
                }).lean(true);
                order.ratingData = ratingData;
                order.deliveryBoyRatting = deliveryBoyRatting;
            }


            sendSuccessResponse(res, {
                page: page,
                pageSize: pageSize,
                totalCount: totalDocuments.length,
                order: orderResponse
            }, "Order List fetched successfully", HttpStatus.OK);
        }else{
            sendSuccessResponse(res, [], "No order found", HttpStatus.OK);
        }
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}
