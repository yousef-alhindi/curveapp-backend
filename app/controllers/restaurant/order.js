import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
//import * as commonService from '../../services/common/common.service';
import AddressModel from '../../models/user/address.model';
import { Offer_Order_Model } from '../../models/restaurant/offerOrder.model';
import UserModel from '../../models/user/user.model';
import OrderModel from '../../models/user/order.model';
import { getKmRange } from '../../utils/helper';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { DeliveryFare_Model } from '../../models/admin/deliveryFare.model';
import { ServiceType } from '../../constants/service.constants';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';
import { RATING_MODEL } from '../../models/user/rating.model';
import { status } from '../../constants/order.constants';
import {orderDeliveryRequest} from '../delivery/order'
const mongoose = require('mongoose'); // mongoose database


// Get Order List
export const orderList = async (req, res) =>{
    try{
      const {restID} = req.params;
        const orderList = await OrderModel.find()
        .populate('userId')
        .populate({
           path: 'restaurentCartId',
           match: { restId: new mongoose.Types.ObjectId(restID) }, // Filter for matching restId
           populate: {
              path: 'restId',
           },
        })
        .populate('addressId');

        const filteredOrderList = orderList.filter(order => order.restaurentCartId);

        return res.status(200).json({ filteredOrderList });
    }catch(errro){
      res.status(500).json({ message: error.message });
    }
}

// Update Order Status
export const updateSatus = async(req,res)=>{
  const { orderId } = req.params;
  const { status: newStatus } = req.body;

   // Validate status
   if (!Object.values(status).includes(newStatus)) {
       return res.status(400).json({ message: 'Invalid status' });
   }

  try {
       const order = await OrderModel.findById(orderId);
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
    
    
       order.status = newStatus;
       order.updatedAt = new Date().getTime(); // Update the timestamp

       await order.save();

       if(newStatus===2){
        const createDeliveryRequest = await orderDeliveryRequest(orderId)
        console.log(createDeliveryRequest)
       }

       res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
       res.status(500).json({ message: 'Server error', error });
  }
}

export const foodOrderManagement = async(req,res)=>{
  try{

    let {tab,orderType,search,page = 1, pageSize = 10,from,to } = req.query;

    // Convert page and pageSize to numbers, in case they are passed as strings
    page = parseInt(page);
    pageSize = parseInt(pageSize);

    // Calculate the number of documents to skip
    const skip = (page - 1) * pageSize;


    let query ={}
    if(tab==='newOrder'){
      const currentTime = Date.now();
      // Calculate the timestamp for one hour ago
      const oneHourAgo = new Date(currentTime - (1 * 60 * 60 * 1000));
      const unixTimestamp = new Date(oneHourAgo).getTime();
      query = {
        $or: [
            { createdAt : { $gte: unixTimestamp } },
            //{ scheduledDate : { $gte: oneHourAgo } }
        ],
        status : {$nin :[2,3,4,5]}
    };
    }else if(tab==='onGoing'){
      query.status = {$in :[2,3]}
    }else if(tab==='scheduled'){
      query.orderType = 1
      query.scheduledDate = { $ne: null }
      query.status = {$nin :[4,5]}
    }else if(tab==='past'){
      query.status = {$in :[4,5]}
    }

    if(orderType){
      query.deliveryOption = parseInt(orderType);
    }

    if (search && search.length > 0) {
      query = {
        ...query,
        orderId: search
      };
    }
    if ((from && from.length > 1) || (to && to.length > 1)) {
      query.$and = query.$and || []; // Initialize $and if it doesn't exist
  
      if (from && from.length > 1) {
          query.$and.push({ createdAt: { $gte: Number(from) } });
      }
  
      if (to && to.length > 1) {
          query.$and.push({ createdAt: { $lte: Number(to) } });
      }
  }

    const totalOrders = await OrderModel.countDocuments({...query,isDeleted:false});

    const data = await OrderModel.find({isDeleted:false,...query},{orderId:1,createdAt:1,deliveryOption:1,totalAmount:1,
      discountedAmount:1,status:1,orderType:1,scheduledDate:1,deliveryAmount:1})
    .populate({
      path: 'userId',
      select: 'fullName'
    })
    .populate('addressId')
    .populate({
      path: 'restaurentCartId',
      select: 'items',
      populate: [{
        path: 'items.itemId',
        select: 'name image'
      }, {
        path: 'items.customize',
        select: 'name price'
      }]
    })
    .sort({createdAt:-1})
    .skip(skip) // Skip documents for pagination
    .limit(pageSize); // Limit the number of documents per page

    const response = {
      totalOrders,       // Total number of orders
      currentPage: page, // Current page number
      totalPages: Math.ceil(totalOrders / pageSize), // Total pages
      pageSize,          // Items per page
      data               // Fetched data for the current page
    };
    res.json({ status:true,message: 'Order Data Fetched Successfully', data:response });

  }catch(error){
    res.status(500).json({ message: 'Server error', error });
  }
}

export const getAllFoodRating = async(req,res)=>{
  try{
    let {page = 1, pageSize = 10,search}=req.query
    let { accesstoken } = req.headers;

    let rest = await RestaurantModel.findOne({ accessToken: accesstoken },{_id:1});
  
    let query={};
    if (search && search.length > 0) {
      query = {
        ...query,
        orderId: search
      };
    }

      // Convert page and pageSize to numbers, in case they are passed as strings
      page = parseInt(page);
      pageSize = parseInt(pageSize);
  
      // Calculate the number of documents to skip
      const skip = (page - 1) * pageSize;
  

    let restaurentCart = await Restaurant_Cart_Model.find({restId:rest._id},{_id:1})
    let cartArray = restaurentCart.map((item)=>item._id.toString());

    let totalOrders = await OrderModel.countDocuments({...query,restaurentCartId: { $in: cartArray },status:4});
    let orders = await OrderModel.find({...query,restaurentCartId: { $in: cartArray },status:4},{orderId:1,createdAt:1,isDeleted:1})
    .populate({
      path: 'userId',
      select: 'fullName'
    })
    .sort({createdAt:-1})
    .skip(skip) // Skip documents for pagination
    .limit(pageSize) // Limit the number of documents per page
    .lean();

    const rating = await RATING_MODEL.find({restId:rest._id,status:true,isDeleted:false},{star:1})
    let averageRating = 0

    if(rating.length>0){
      rating.map((item)=>{
        averageRating = (item?.star ? item.star : 0) + averageRating;
      })
      averageRating = averageRating/rating.length;
    }

    const response = {
      totalOrders,       // Total number of orders
      currentPage: page, // Current page number
      totalPages: Math.ceil(totalOrders / pageSize), // Total pages
      pageSize,          // Items per page
      orders   ,            // Fetched data for the current page
      averageRating
    };

    res.json({ status:true,message: 'Order data ', data:response });
    
  }catch(error){
    res.status(500).json({ message: 'Server error', error });
  }
}

export const requestToDeleteRating = async(req,res)=>{
  try{

  }catch(error){

  }
}

export const getSingleOrderRating = async(req,res)=>{
  try{
      let {orderId} = req.query

      if(!orderId || orderId.length<0){
        return res.status(400).json({ message: 'OrderId required' });
      }

      let ratingData = await RATING_MODEL.find({orderId : new mongoose.Types.ObjectId(orderId)},{review:1,items:1,restId:1,orderId:1,star:1})
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

      ratingData.length && ratingData[0].items.map((item,index)=>{
        ratingData[0].items[index] = {...item._id,rating : item.rating}
      })      
      res.json({ status:true,message: `Rating of Order ${orderId}`, data:{ratingData} });
  }catch(error){
    res.status(500).json({ message: 'Server error', error });
  }
}

