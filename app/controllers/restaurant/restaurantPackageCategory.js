import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { RestaurantPackageCategoryModel } from '../../models/restaurant/restaurantPackageCategory.model';
import mongoose from 'mongoose';
import { PackageFoodModel } from '../../models/admin/foodPackage.model';

export const CategoryList = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10 } = req.query;
      let resId = req?.restaurantData?._id;
      page = parseInt(page);
      limit = parseInt(limit);
      let skipIndex = (page - 1) * limit;
      let params = { isDeleted: false };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [{ resCategory: { $regex: '.*' + search + '.*', $options: 'i' } }],
         });
      }
      params.restId = resId;
      let count = await RestaurantPackageCategoryModel.countDocuments({...params,status:true,isDeleted:false});
      const getCategory = await RestaurantPackageCategoryModel.find({...params,status:true,isDeleted:false})
      .sort({createdAt: -1})
      .skip(skipIndex)
      .limit(limit);

      const response = {
         count,       // Total number of orders
         currentPage: page, // Current page number
         totalPages: Math.ceil(count / limit), // Total pages
         limit,          // Items per page
         getCategory               // Fetched data for the current page
       };

      sendSuccessResponse(res, response, success.LIST_FETCH, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const createCategory = async (req, res) => {
   try {
      let resData = req.restaurantData;
      req.body.restId = resData?._id;

      // Normalize category name to lowercase
      const normalizedCategoryName = req.body.categoryName;

      // Update the request body with the normalized category name
      req.body.resCategory = normalizedCategoryName;

      // Check for an existing category with a case-insensitive comparison
      let data = await commonService.findOne(RestaurantPackageCategoryModel, {
         resCategory: normalizedCategoryName,
         restId: resData?._id,
         isDeleted:false
      });

      if (data) {
         return sendErrorResponse(res, 'Category Name already exists', HttpStatus.FORBIDDEN);
      }

      // Add the category with normalized name
      req.body.categoryName = normalizedCategoryName; // Ensure the category name is stored in lowercase
      const addCat = await commonService.create(RestaurantPackageCategoryModel, req.body);

      //..........updating admin packages categories in which given restaurant entrolled.......
      let adminPackage = await PackageFoodModel.find({'restaurants._id':req.body.restId});
      for (const [index1, pack] of adminPackage.entries()) {
         for (const [index2, rest] of pack.restaurants.entries()) {
           if (rest._id.toString() === req.body.restId.toString()) {
            adminPackage[index1].restaurants[index2].categories.push({
               _id: addCat._id,
               category: addCat.resCategory
             });
   
             // Update the admin package in the database
             await PackageFoodModel.findOneAndUpdate(
               { _id: adminPackage[index1]._id },
               { $set: { restaurants: adminPackage[index1].restaurants } }, // Update only the restaurants array
               { new: true }
             );
           }
         }
       }

      return sendSuccessResponse(res, addCat, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};


export const editCategory = async (req, res) => {
   try {
      let resData = req.restaurantData;
      req.body.restId = resData._id;
      let { _id, categoryName } = req.body;
            const normalizedCategoryName = req.body.categoryName.toLowerCase();
      const checkEditCat = await commonService.findOne(RestaurantPackageCategoryModel, {_id:{$ne: new mongoose.Types.ObjectId(_id)},resCategory: normalizedCategoryName,
         restId: resData?._id , isDeleted:false});

         if (checkEditCat) {
            return sendErrorResponse(res, 'Category Name already exists', HttpStatus.FORBIDDEN);
         }
         req.body.categoryName = normalizedCategoryName;
      const update = await commonService.findOneAndUpdate(
         RestaurantPackageCategoryModel,
         _id,
         {
            resCategory: req.body.categoryName,
         }
      );

       //..........updating admin packages categories in which given restaurant entrolled.......
       let adminPackage = await PackageFoodModel.find({'restaurants._id':req.body.restId});
       for (const [index1, pack] of adminPackage.entries()) {
          for (const [index2, rest] of pack.restaurants.entries()) {
            if (rest._id.toString() === req.body.restId.toString()) {
               for(const [index3, category] of rest.categories.entries()){
                  if (category._id.toString() === update._id.toString()){
                     adminPackage[index1].restaurants[index2].categories[index3].category=update.resCategory
                  }
               }
    
              // Update the admin package in the database
              await PackageFoodModel.findOneAndUpdate(
                { _id: adminPackage[index1]._id },
                { $set: { restaurants: adminPackage[index1].restaurants } }, // Update only the restaurants array
                { new: true }
              );
            }
          }
        }

      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      } else {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteCategory = async (req, res) => {
   try {
      let resData = req.restaurantData;
      req.body.restId = resData._id;
      let { _id } = req.body;
      const checkCat = await commonService.findOne(RestaurantPackageCategoryModel, { _id: _id });
      if (!checkCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndUpdate(RestaurantPackageCategoryModel, checkCat._id, { isDeleted: true });
       //..........updating admin packages categories in which given restaurant entrolled.......
       let adminPackage = await PackageFoodModel.find({'restaurants._id':req.body.restId});
       for (const [index1, pack] of adminPackage.entries()) {
          for (const [index2, rest] of pack.restaurants.entries()) {
            if (rest._id.toString() === req.body.restId.toString()) {
               for(const [index3, category] of rest.categories.entries()){
                  if (category._id.toString() === _id){
                    // Remove the category from the categories array
                     rest.categories.splice(index3, 1);
                     //break; // Exit the inner loop since we've removed the category
                  }
               }
              // Update the admin package in the database
              await PackageFoodModel.findOneAndUpdate(
                { _id: adminPackage[index1]._id },
                { $set: { restaurants: adminPackage[index1].restaurants } }, // Update only the restaurants array
                { new: true }
              );
            }
          }
        }

      if (update) {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const statusUpdate = async (req,res) =>{
   try {
      let resData = req.restaurantData;
      req.body.restId = resData._id;
      let { _id, status } = req.body;
      const checkCat = await commonService.findOne(RestaurantPackageCategoryModel, { _id: _id });
      if (!checkCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await RestaurantPackageCategoryModel.findOneAndUpdate(
         {_id: checkCat._id},
         {$set:{status: status }},
         {new:true}
      )

       //..........updating admin packages categories in which given restaurant entrolled.......
       let adminPackage = await PackageFoodModel.find({'restaurants._id':req.body.restId});
       for (const [index1, pack] of adminPackage.entries()) {
          for (const [index2, rest] of pack.restaurants.entries()) {
            if (rest._id.toString() === req.body.restId.toString()) {
               if(status===false){
                  for(const [index3, category] of rest.categories.entries()){
                     if (category._id.toString() === _id){
                       // Remove the category from the categories array
                        rest.categories.splice(index3, 1);
                        //break; // Exit the inner loop since we've removed the category
                     }
                  }
               }
               if(status===true){
                  adminPackage[index1].restaurants[index2].categories.push({
                     _id: update._id,
                     category: update.resCategory
                   });
               }
              // Update the admin package in the database
              await PackageFoodModel.findOneAndUpdate(
                { _id: adminPackage[index1]._id },
                { $set: { restaurants: adminPackage[index1].restaurants } }, // Update only the restaurants array
                { new: true }
              );
            }
          }
        }

      if (update) {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}
