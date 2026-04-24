import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { PackageFoodModel } from '../../models/admin/foodPackage.model';
import { RestaurantPackageModel } from '../../models/restaurant/restaurantPackage';
import { CategoryModel } from '../../models/admin/category.models';
import { RestaurantPackageCategoryModel } from '../../models/restaurant/restaurantPackageCategory.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
const crypto = require('crypto');
/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

export const create = async (req, res) => {
   try {
      let data = req.body;
      if (!data.goal) {
         return sendErrorResponse(res, 'please send goal', HttpStatus.BAD_REQUEST);
      }
      if (!data.duration) {
         return sendErrorResponse(res, 'please send duration', HttpStatus.BAD_REQUEST);
      }
      if (!data.name) {
         return sendErrorResponse(res, 'please send name', HttpStatus.BAD_REQUEST);
      }
      if (!data.price) {
         return sendErrorResponse(res, 'please send price', HttpStatus.BAD_REQUEST);
      }
      if (!data.upTo) {
         return sendErrorResponse(res, 'please send upTo', HttpStatus.BAD_REQUEST);
      }

      let existedPackage = await PackageFoodModel.findOne({name : data.name})
      if(existedPackage){
       return sendErrorResponse(res, 'Package Name already exists', HttpStatus.CONFLICT);
      }

      function generatePackageId(length = 8) {
         return crypto.randomBytes(length)
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
            .substring(0, length);         // Ensure it's exactly 8 characters
         }
 
         // Function to check if the packageId exists in the database
         async function isPackageIdUnique(packageId) {
            const existingRestPackage = await RestaurantPackageModel.findOne({ packageId });
            const existingAdminPackage = await PackageFoodModel.findOne({ packageId });
            return !existingRestPackage && !existingAdminPackage;  // Returns true if packageId is unique
         }
 
         //adding restaurants category..........
         await Promise.all(data.restaurants.length>0 && data.restaurants.map(async(item,index)=>{
            let restCategories = await RestaurantPackageCategoryModel.find({
               restId : new mongoose.Types.ObjectId(item),
               status:true,
               isDeleted:false
            },{resCategory:1});
            let categories = [];
            restCategories.length>0 && restCategories.map((category)=>{
               categories.push({_id:category._id,category:category.resCategory})
            })
            data.restaurants[index] = {_id : new mongoose.Types.ObjectId(item),categories:categories}
         })  )     
          
         // Generate unique packageId by checking in the database
         async function generateUniquePackageId() {
             let packageId;
             let isUnique = false;
             
             // Loop until we find a unique packageId
             while (!isUnique) {
                 packageId = generatePackageId();
             isUnique = await isPackageIdUnique(packageId);
             }
             return packageId;
         }

         let finalizedData = {
            packageId : await generateUniquePackageId (),
            ...data
         }
      const add = await commonService.create(PackageFoodModel, finalizedData);
      if (add) {
         sendSuccessResponse(res, add, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const edit = async (req, res) => {
   try {
      if (!req.body.id) {
         return sendErrorResponse(res, 'Please enter Id', HttpStatus.FORBIDDEN);
      }
      const requestRestaurants = req.body.restaurants.map(id => new ObjectId(id));
      let existedData = await PackageFoodModel.findOne({_id:new mongoose.Types.ObjectId(req.body.id)});
      let existingRestaurants = existedData.restaurants;

      // Step 1: Filter existing restaurants based on the request
      const filteredData = existingRestaurants.filter(restaurant => 
         requestRestaurants.some(requestId => restaurant._id.equals(requestId))
      );
      
      // Step 2: Add new restaurants that are in the request but not in the existing data
      requestRestaurants.forEach(id => {
         if (!filteredData.some(restaurant => restaurant._id.equals(id))) {
         // If the restaurant doesn't exist, create a new entry
         const newRestaurant = {
            _id: id,
            status: false,
            categories: [] // Assuming you want to keep this empty or add categories from a source
         };
      
         // // Optionally copy categories from an existing restaurant with the same ID
         // const existingRestaurant = existingRestaurants.find(restaurant => restaurant._id.equals(id));
         // if (existingRestaurant) {
         //    newRestaurant.categories = existingRestaurant.categories;
         // }
      
         filteredData.push(newRestaurant);
         }
      });

   //   filteredData.map((item,index)=>{
   //    filteredData[index] = {_id:item._id,status:item.status,categories : categories}
   //   })

     if(req.body.restaurants && req.body.restaurants.length>0){
      req.body.restaurants = filteredData
     }
      const update = await commonService.findOneAndUpdate(PackageFoodModel, new mongoose.Types.ObjectId(req.body.id), req.body);
      if (!update) {
         return sendErrorResponse(res, "Invalid Package ID", HttpStatus.FORBIDDEN);
      } else {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteFoodPackage = async (req, res) => {
   try {
      let { id, isDeleted } = req.body;
      const checkResCat = await commonService.findOne(PackageFoodModel, { _id: id });
      if (!checkResCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndUpdate(
         PackageFoodModel,
         { _id: checkResCat._id },
         { isDeleted: isDeleted }
      );
      if (update) {
         sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const foodPackageList = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10 } = req.query;
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { isDeleted: false };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [
               { name: { $regex: '.*' + search + '.*', $options: 'i' } },
               { description: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
         });
      }
      let count = await PackageFoodModel.countDocuments(params);
      let list = await PackageFoodModel.find(params)
      .populate({path:'restaurants._id',select:"resName"})
         .sort({ createdAt: -1 })
         .skip(skipIndex)
         .limit(limit);
      return sendSuccessResponse(
         res,
         { count: count, list: list },
         'food Package List',
         HttpStatus.OK
      );
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const foodPackagewithRestaurant = async (req, res) => {
   try {
      let { id } = req.query;
      let list = await PackageFoodModel.aggregate([
         {
            $match: {
               _id: new ObjectId(id),
            },
         },
         {
            $project: {
               restaurants: 1,
            },
         },
         // {
         //    $lookup: {
         //       from: 'Restaurant',
         //       let: { restId: '$restaurants' },
         //       pipeline: [
         //          {
         //             $match: {
         //                $expr: {
         //                   $and: [{ $in: ['$_id', '$$restId'] }],
         //                },
         //             },
         //          },
         //       ],
         //       as: 'restDetail',
         //    },
         // },
         {
            $lookup: {
                from: 'Restaurant',
                let: { restIds: '$restaurants._id' }, // Use the new structure to reference the IDs
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ['$_id', '$$restIds'], // Match restaurant IDs
                            },
                        },
                    },
                ],
                as: 'restDetail',
            },
         },        
         {
            $unwind: '$restDetail',
         },
         {
            $project: {
               resName: '$restDetail.resName',
               addressDetails: '$restDetail.addressDetails',
               restaurantStatus: '$restDetail.restaurantStatus',
            },
         },
      ]);
      return sendSuccessResponse(res, list, 'food Package List', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const foodPackagewithCategory = async (req, res) => {
   try {
      let { restId } = req.query;
      let list = await CategoryModel.aggregate([
         {
            $match: {
               restId: new ObjectId(restId),
               status: true,
            },
         },
         {
            $lookup: {
               from: 'MenuItem',
               let: { catId: '$_id' },
               pipeline: [
                  {
                     $match: {
                        $expr: {
                           $and: [
                              { $eq: ['$categoryId', '$$catId'] },
                              { $eq: ['$isDeleted', false] },
                              { $eq: ['$status', true] },
                           ],
                        },
                     },
                  },
               ],
               as: 'menuDetail',
            },
         },
         {
            $addFields: {
               totalMenuItems: { $size: '$menuDetail' },
            },
         },
         {
            $lookup: {
               from: 'CustomiseItem',
               let: { catId: '$menuDetail._id' },
               pipeline: [
                  {
                     $match: {
                        $expr: {
                           $and: [
                              { $in: ['$menuId', '$$catId'] },
                              { $eq: ['$isDeleted', false] },
                              { $eq: ['$status', true] },
                           ],
                        },
                     },
                  },
               ],
               as: 'customise',
            },
         },
         {
            $addFields: {
               totalItems: { $size: '$customise' },
            },
         },
         {
            $project: {
               categoryName: 1,
               menuDetail: '$menuDetail',
               customise: '$customise',
               totalMenuItems: 1,
               totalItems: 1,
            },
         },
      ]);

      return sendSuccessResponse(res, list, 'food category List', HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const packageDetail = async(req,res) =>{
   try {
      let { _id } = req.query;

      if (!_id) {return sendErrorResponse(res, 'package _id required ', HttpStatus.BAD_REQUEST);}

      let packageData = await PackageFoodModel.findOne({_id:new mongoose.Types.ObjectId},{name:1,duration:1,price:1,termAndCondition:1,description:1})
      if(packageData){
         return sendSuccessResponse(res,packageData,'food Package Data',HttpStatus.OK);
      }else{
         return sendSuccessResponse(res,{},'food Package Data Not Found',HttpStatus.NOT_FOUND);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

