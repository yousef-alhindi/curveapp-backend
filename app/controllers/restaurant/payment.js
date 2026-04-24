import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import OrderModel from '../../models/user/order.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
import { getCommission } from '../admin/commision';
import { Commission_Model } from '../../models/admin/commision.model';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { calculateAdminCommission } from '../../services/common/calculateCommission.service';
import { PaymentByAdminModel } from '../../models/admin/paymentByAdmin.model';
import PackageOrderModel from '../../models/user/packageOrder.model';
import { Food_Pack_Cart_Model } from '../../models/user/restFoodPackCart.model';
import { AdminFoodPackCartModel } from '../../models/user/adminFoodPackCart.model';
import AdminPackageOrderModel from '../../models/user/adminPackageOrder.model';


export const getOrderTransactionData = async (req, res) => {
    try{
        let {from,to,search,page = 1, pageSize = 10} = req.query

        let { accesstoken } = req.headers;

        let rest = await RestaurantModel.findOne({ accessToken: accesstoken },{_id:1});

        let restaurentCart = await Restaurant_Cart_Model.find({restId:rest._id},{_id:1})
        let cartArray = restaurentCart.map((item)=>item._id.toString());


        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query = {};

        if (search && search.length > 0) {
            query = {
                $or: [
                    { paymentId: search },
                    { orderId: search }
                ]
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

        const totalOrders = await OrderModel.countDocuments({...query,restaurentCartId: { $in: cartArray },isDeleted:false,status:4});

        let orders = await OrderModel.find({...query,restaurentCartId: { $in: cartArray },isDeleted:false,status:4},{orderId:1,totalAmount:1, createdAt:1,paymentMethod:1,paymentId:1})
        .sort({createdAt:-1})
        .skip(skip) // Skip documents for pagination
        .limit(pageSize)
        .lean(); // Limit the number of documents per page

        // Calculate the sum of totalAmount from all orders
        let totalOrdersForRevenue = await OrderModel.find({restaurentCartId: { $in: cartArray },isDeleted:false,status:4},{totalAmount:1,})
        const totalRevenue = totalOrdersForRevenue.reduce((acc, order) => acc + order.totalAmount, 0);

        await Promise.all(orders.map(async(order,index)=>{
            const adminCommission = await calculateAdminCommission(1,order.totalAmount)
            orders[index].adminCommission = adminCommission
        }))

        const paidByAdmin = await PaymentByAdminModel.find({restId:new mongoose.Types.ObjectId(rest)},{amount:1});

        let totalPaidByAdmin = 0
        if(paidByAdmin.length>0){
            totalPaidByAdmin = paidByAdmin.map((item)=>item.amount+totalPaidByAdmin)
        }

        let response = {
            totalOrders,
            currentPage: page, // Current page number
            totalPages: Math.ceil(totalOrders / pageSize), // Total pages
            pageSize,          // Items per page
            orders,
            totalRevenue,
            totalPaidByAdmin,
            Pending : totalRevenue-totalPaidByAdmin,
            received : totalPaidByAdmin
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
      
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getPayoutHistory = async (req,res) =>{
    try{
        let { accesstoken } = req.headers;
        let {from,to,page = 1, pageSize = 10} = req.query;

        let rest = await RestaurantModel.findOne({ accessToken: accesstoken },{_id:1});

         // Convert page and pageSize to numbers, in case they are passed as strings
         page = parseInt(page);
         pageSize = parseInt(pageSize);
 
         // Calculate the number of documents to skip
         const skip = (page - 1) * pageSize;
 
         let query ={}
        
        if ((from && from.length > 1) || (to && to.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist
        
            if (from && from.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(from) } });
            }
        
            if (to && to.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(to) } });
            }
        }

        const totalTimesPaidByAdmin = await PaymentByAdminModel.countDocuments({...query,restuarantId:rest._id});
        
        const paidByAdmin = await PaymentByAdminModel.find({...query,restuarantId:rest._id},{amount:1,createdAt:1,fromDate:1,toDate:1})
        .sort({createdAt:-1})
        .skip(skip) // Skip documents for pagination
        .limit(pageSize)
        .lean(); // Limit the number of documents per page

        let response = {
            totalTimesPaidByAdmin,
            currentPage: page, // Current page number
            totalPages: Math.ceil(totalTimesPaidByAdmin / pageSize), // Total pages
            pageSize,          // Items per page
            paidByAdmin
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getPackageOrderTransactionData = async (req, res) => {
    // try{
    //     let {from,to,search,page = 1, pageSize = 10} = req.query

    //     let { accesstoken } = req.headers;

    //     let rest = await RestaurantModel.findOne({ accessToken: accesstoken },{_id:1});

    //     //for rest package............
    //     let restPackCart = await Food_Pack_Cart_Model.find({restId:rest._id},{_id:1})
    //     let cartArray = restPackCart.map((item)=>item._id.toString());

    //     //for admin package..........
    //     let adminPackCart = await AdminFoodPackCartModel.find({"restaurants._id": rest._id}, {_id: 1}); // Select only the `_id` field
    //     let adminCartArray = adminPackCart.map((item) => item._id.toString()); // Map to the string version of the _id

    //     let query = {};

    //     if (search && search.length > 0) {
    //         query = {
    //             $or: [
    //                 { paymentId: search },
    //                 { orderId: search }
    //             ]
    //         };
    //     }

    //     if ((from && from.length > 1) || (to && to.length > 1)) {
    //         query.$and = query.$and || []; // Initialize $and if it doesn't exist
        
    //         if (from && from.length > 1) {
    //             query.$and.push({ createdAt: { $gte: Number(from) } });
    //         }
        
    //         if (to && to.length > 1) {
    //             query.$and.push({ createdAt: { $lte: Number(to) } });
    //         }
    //     }

    //     //rest pack orders ............
    //     const totalOrders = await PackageOrderModel.countDocuments({...query,restaurentCartId: { $in: cartArray },isDeleted:false,status:4});
    //     let orders = await PackageOrderModel.find({...query,restaurentCartId: { $in: cartArray },isDeleted:false,status:4},{orderId:1,totalAmount:1, createdAt:1,paymentMethod:1,paymentId:1})
    //     .sort({createdAt:-1})
    //     .lean(); // Limit the number of documents per page

    //      // Calculate the sum of totalAmount from all orders
    //      let totalOrdersForRevenue = await PackageOrderModel.find({restaurentCartId: { $in: cartArray },isDeleted:false,status:4},{totalAmount:1,})
    //      const totalRevenue = totalOrdersForRevenue.reduce((acc, order) => acc + order.totalAmount, 0);

    //      await Promise.all(orders.map(async(order,index)=>{
    //         const adminCommission = await calculateAdminCommission(1,order.totalAmount)
    //         orders[index].adminCommission = adminCommission
    //     }))

    //     //admin pack orders..........
    //     const adminTotalOrders = await AdminPackageOrderModel.countDocuments({...query,cartId: {$in: adminCartArray},isDeleted:false,status:4})
    //     let adminOrders = await AdminPackageOrderModel.find({...query,cartId: { $in: adminCartArray },isDeleted:false,status:4},{orderId:1,totalAmount:1, createdAt:1,paymentMethod:1,paymentId:1})
    //     .sort({createdAt:-1})
    //     .lean(); // Limit the number of documents per page

    //      // Calculate the sum of totalAmount from all orders
    //      let totalAdminOrdersForRevenue = await AdminPackageOrderModel.find({cartId: { $in: adminCartArray },isDeleted:false,status:4},{totalAmount:1,})
    //      const totalAdminPackRevenue = totalAdminOrdersForRevenue.reduce((acc, order) => acc + order.totalAmount, 0);

    //      await Promise.all(adminOrders.map(async(order,index)=>{
    //         const adminCommission = await calculateAdminCommission(1,order.totalAmount)
    //         orders[index].adminCommission = adminCommission
    //     }))

    //     const paidByAdmin = await PaymentByAdminModel.find({restId:new mongoose.Types.ObjectId(rest)},{amount:1});

    //     let totalPaidByAdmin = 0
    //     if(paidByAdmin.length>0){
    //         totalPaidByAdmin = paidByAdmin.map((item)=>item.amount+totalPaidByAdmin)
    //     }

    //     //**************PAGINATION****************** */
    //     const allOrders = [...orders, ...adminOrders]; // Combine the rest pack orders and admin pack orders

    //     // Calculate start index based on the page number
    //     const startIndex = (page - 1) * pageSize;
    //     // Slice the array to get the orders for the current page
    //     const paginatedOrders = allOrders.slice(startIndex, startIndex + pageSize);

    //     let response = {
    //         totalOrders : totalOrders + adminTotalOrders,
    //         currentPage: page, // Current page number
    //         totalPages: Math.ceil((totalOrders + adminTotalOrders) / pageSize), // Total pages
    //         pageSize,          // Items per page
    //         orders : paginatedOrders,
    //         totalRevenue : totalRevenue + totalAdminPackRevenue,
    //         totalPaidByAdmin,
    //         Pending : (totalRevenue + totalAdminPackRevenue)-totalPaidByAdmin,
    //         received : totalPaidByAdmin
    //     }

    //     return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
      
    // }catch(error){
    //     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    // }

    try{
        let {page = 1, pageSize = 10,from,to,search,tab} = req.query
        const restaurantData = req.restaurantData;
          page = parseInt(page);
          pageSize = parseInt(pageSize);
  
          const skip = (page - 1) * pageSize;

          let query ={}

          if (search && search.length > 0) {
              query ={
                  ...query,
                  $or: [{ paymentId: search }, { orderId: search }] 
                //   $or: [
                //       { name: { $regex: `^${search}`, $options: 'i' } },  // Matches name starting with search
                //       { packageId: { $regex: `^${search}`, $options: 'i' } } // Matches packageId starting with search
                //   ]
              }
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

        if(tab === 'Active'){
            query.expired = false
        }else if(tab === 'Expired'){
            query.expired = true
        }

        let restPackageOrders = await PackageOrderModel.find(query)
        .sort({createdAt:-1})
        .skip(skip) // Skip documents for pagination
        .limit(pageSize) // Limit the number of documents per page
        .populate({
            path: 'restaurentCartId',
            populate:{
                path:'packageId',
                select : 'goal name description termsAndCondition durations' 
            },
            populate: {
               path: 'restId',
               select: '_id resName profileType'
            },
            select: 'restId duration packageId'
         })

         let filteredOrders = restPackageOrders.filter(
            (data) => data?.restaurentCartId?.restId?._id?.toString() === restaurantData._id.toString()
          );

        let response = [];
        filteredOrders.forEach((data) => {
          response.push({
            orderId: data.orderId,
            restId: data.restaurentCartId.restId._id,
            purchaseDateTime: data.createdAt,
            amount: data.totalAmount,
            transactionId : data.paymentId,
            paymentMethod: data.paymentMethod

          });
        });

        let data = {
            totalorders: filteredOrders.length,
            response,
          };
          
         return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
  
  
    }catch(error){
        console.log("error",error)
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getPackagePayoutHistory = async (req,res) =>{
    try{
        let { accesstoken } = req.headers;
        let {from,to,page = 1, pageSize = 10} = req.query;

        let rest = await RestaurantModel.findOne({ accessToken: accesstoken },{_id:1});

         // Convert page and pageSize to numbers, in case they are passed as strings
         page = parseInt(page);
         pageSize = parseInt(pageSize);
 
         // Calculate the number of documents to skip
         const skip = (page - 1) * pageSize;
 
         let query ={}
        
        if ((from && from.length > 1) || (to && to.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist
        
            if (from && from.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(from) } });
            }
        
            if (to && to.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(to) } });
            }
        }

        const totalTimesPaidByAdmin = await PaymentByAdminModel.countDocuments({...query,restuarantId:rest._id});
        
        const paidByAdmin = await PaymentByAdminModel.find({...query,restuarantId:rest._id},{amount:1,createdAt:1,fromDate:1,toDate:1})
        .sort({createdAt:-1})
        .skip(skip) // Skip documents for pagination
        .limit(pageSize)
        .lean(); // Limit the number of documents per page

        let response = {
            totalTimesPaidByAdmin,
            currentPage: page, // Current page number
            totalPages: Math.ceil(totalTimesPaidByAdmin / pageSize), // Total pages
            pageSize,          // Items per page
            paidByAdmin
        }

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK)
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}