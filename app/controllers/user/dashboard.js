import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { BannerModel } from '../../models/admin/banner.model';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { CategoryModel } from '../../models/admin/category.models';
import { menuItemModel } from '../../models/restaurant/menuItem.model';
import UserModel from '../../models/user/user.model';
import { DeliveryFare_Model } from '../../models/admin/deliveryFare.model';
import { getEstimatedTime, getKmRange } from '../../utils/helper';
import { ServiceType } from '../../constants/service.constants';
import { RestaurantCategoryModel } from '../../models/admin/restaurantCategory.model';
import { CustomiseItemModel } from '../../models/restaurant/customiseItem.model';
import { getSingleRestaurantItemByUserAndItem } from './restaurant/homePageRestaurant';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';

const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

export const bannerWithServiceType = async (req, res) => {
   try {
      const { serviceType } = req.body;
      const bannerList = await commonService.getAll(BannerModel, { service: serviceType, isDeleted: false });
      if (bannerList) {
         return sendSuccessResponse(res, bannerList, success.LIST_FETCH, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const banner = async (req, res) => {
   try {
      const bannerList = await BannerModel.find({ bannerType: 1, isDeleted: false }).populate('offerRef');
      return sendSuccessResponse(res, bannerList.filter(d => d.offerRef != null), success.LIST_FETCH, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const restaurantListByDeliveryType = async (req, res) => {
   try {
      let { deliveryType, long, lat, search } = req.query;
      let condition = {};
      if (deliveryType == 1) {
         condition = {
            isDelivery: true,
            isBlocked: false,
            restaurantStatus: 1,
         };
      } else {
         condition = {
            isPickUp: true,
            isBlocked: false,
            restaurantStatus: 1,
         };
      }

      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: condition,
            },
         },
         {
            $lookup: {
               from: "wishlists",
               localField: "_id",
               foreignField: "restId",
               as: "saved",
            },
         },
         {
            $addFields: {
               isWishlist: {
                  $in: [
                     new mongoose.Types.ObjectId(req.userData?._id),
                     "$saved.userId",
                  ],
               },
               distanceInKm: { $divide: ['$distance', 1000] },
            },
         },
         {
            $project: {
               saved: 0,
            },
         },
         {
            $match: {
               $and: [{}],
            },
         },
      ];

      if (!!search) {
         pipeline[4].$match.$and.push({
            $or: [
               { resName: { $regex: search, $options: "i" } },
            ],
         });
      }

      let getAllRestaurants = await RestaurantModel.aggregate(pipeline);
      await RestaurantModel.populate(getAllRestaurants, {
         path: 'resCategory',
         match: { isDeleted: false },
      });

      let newRestList = []
      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      for (let res of getAllRestaurants) {
         res = JSON.parse(JSON.stringify(res))
         res.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(res.location.coordinates[1], res.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         res.deliveryEstimatedTime = "14-16 mins"
         res.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         newRestList.push(res)
      }

       sendSuccessResponse(res, newRestList, success.LIST_FETCH, HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const newarByRestaurantList = async (req, res) => {
   try {
      const { lat, long, order } = req.body;
      const resData = req.userData;
      if (resData !== undefined) {
         let user = await UserModel.findOne({ _id: resData._id });
         let userLocation = user.location.coordinates;
         const point = {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
         };

         let filter = {
            location: {
               $near: {
                  $geometry: { type: 'Point', coordinates: point.coordinates },
                  $maxDistance: 10 * 1000,
               },
            },
            isBlocked: false,
            restaurantStatus: 1,
         };

         const nearByRes = await commonService.getAll(RestaurantModel, filter);

         const restaurantsWithDistance = await RestaurantModel.aggregate([
            {
               $lookup: {
                  from: 'RestaurantCategory',
                  let: { resId: '$resCategory' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $in: ['$_id', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 0,
                           resCategory: 1,
                        },
                     },
                  ],
                  as: 'resCatDetail',
               },
            },
            {
               $addFields: {
                  distance: {
                     $round: [
                        {
                           $divide: [
                              {
                                 $sqrt: {
                                    $add: [
                                       {
                                          $pow: [
                                             {
                                                $subtract: [
                                                   { $arrayElemAt: ['$location.coordinates', 0] },
                                                   userLocation[0],
                                                ],
                                             },
                                             2,
                                          ],
                                       },
                                       {
                                          $pow: [
                                             {
                                                $subtract: [
                                                   { $arrayElemAt: ['$location.coordinates', 1] },
                                                   userLocation[1],
                                                ],
                                             },
                                             2,
                                          ],
                                       },
                                    ],
                                 },
                              },
                              0.009,
                           ],
                        },
                        2,
                     ],
                  },
               },
            },
            {
               $addFields: {
                  resCatName: { $arrayElemAt: ['$resCatDetail.resCategory', 0] },
               },
            },
            {
               $project: {
                  resCatName: 1,
                  distance: 1,
               },
            },
         ]);
         nearByRes.forEach((restaurant, index) => {
            nearByRes[index].distance = restaurantsWithDistance[index].distance;
            nearByRes[index].resCatName = restaurantsWithDistance[index].resCatName;
         });

         if (nearByRes.length > 0) {
            return sendSuccessResponse(res, nearByRes, success.LIST_FETCH, HttpStatus.OK);
         }
         return sendSuccessResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      } else {
         const point = {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
         };

         let filter = {
            location: {
               $near: {
                  $geometry: { type: 'Point', coordinates: point.coordinates },
                  $maxDistance: 10 * 1000,
               },
            },
            isBlocked: false,
            restaurantStatus: 1,
         };

         const nearByRes = await commonService.getAll(RestaurantModel, filter);

         const restaurantsWithDistance = await RestaurantModel.aggregate([
            {
               $lookup: {
                  from: 'RestaurantCategory',
                  let: { resId: '$resCategory' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $in: ['$_id', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 0,
                           resCategory: 1,
                        },
                     },
                  ],
                  as: 'resCatDetail',
               },
            },
            {
               $addFields: {
                  resCatName: { $arrayElemAt: ['$resCatDetail.resCategory', 0] },
               },
            },
            {
               $project: {
                  resCatName: 1,
                  distance: null,
               },
            },
         ]);
         nearByRes.forEach((restaurant, index) => {
            nearByRes[index].distance = restaurantsWithDistance[index].distance;
            nearByRes[index].resCatName = restaurantsWithDistance[index].resCatName;
         });

         if (nearByRes.length > 0) {
            return sendSuccessResponse(res, nearByRes, success.LIST_FETCH, HttpStatus.OK);
         }
         return sendSuccessResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const AllRestaurant = async (req, res) => {
   try {
      let { long, lat, order } = req.query;
      const resData = req.userData;
      if (resData !== undefined) {
         let user = await UserModel.findOne({ _id: resData._id });
         let userLocation = user.location.coordinates;
         const allRestaurant = await RestaurantModel.aggregate([
            {
               $geoNear: {
                  near: {
                     type: 'Point',
                     coordinates: [parseFloat(long), parseFloat(lat)],
                  },
                  distanceField: 'distance',
                  maxDistance: 100000, // in meters, corresponds to a 100km radius
                  spherical: true,
               },
            },
            {
               $match: {
                  restaurantStatus: 1,
               },
            },
            {
               $lookup: {
                  from: 'RestaurantCategory',
                  let: { resId: '$resCategory' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $in: ['$_id', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 0,
                           resCategory: 1,
                        },
                     },
                  ],
                  as: 'resCatDetail',
               },
            },
            // {
            //     $lookup: {
            //         from: "Rating",
            //         let: { resId: "$_id" },
            //         pipeline: [
            //             {
            //                 $match: {
            //                     $expr: {
            //                         $eq: ["$restId", "$$resId"]
            //                     }
            //                 }
            //             },
            //             {
            //                 $group: {
            //                     _id: "$restId",
            //                     avgRating: { $avg: "$star" },
            //                     myCount: { $sum: 1 }
            //                 }
            //             }
            //         ],
            //         as: "ratingDetail"
            //     }
            // },
            {
               $addFields: {
                  distance: {
                     $round: [
                        {
                           $divide: [
                              {
                                 $sqrt: {
                                    $add: [
                                       {
                                          $pow: [
                                             {
                                                $subtract: [
                                                   { $arrayElemAt: ['$location.coordinates', 0] },
                                                   userLocation[0],
                                                ],
                                             },
                                             2,
                                          ],
                                       },
                                       {
                                          $pow: [
                                             {
                                                $subtract: [
                                                   { $arrayElemAt: ['$location.coordinates', 1] },
                                                   userLocation[1],
                                                ],
                                             },
                                             2,
                                          ],
                                       },
                                    ],
                                 },
                              },
                              0.009,
                           ],
                        },
                        2,
                     ],
                  },
               },
            },
            {
               $addFields: {
                  // isLike: { $arrayElemAt: ["$resDetail.isLike", 0] },
                  resCatName: { $arrayElemAt: ['$resCatDetail.resCategory', 0] },
                  // TotalRating: { $arrayElemAt: ["$ratingDetail.myCount", 0] },
                  // star: { $arrayElemAt: ["$ratingDetail.avgRating", 0] },
               },
            },
            {
               $project: {
                  _id: 1,
                  resName: 1,
                  addressDetails: 1,
                  location: 1,
                  // TotalRating: 1,
                  // star: 1,
                  // isLike: 1,
                  resCatName: 1,
                  distance: 1,
               },
            },
         ]);
         if (allRestaurant) {
            return sendSuccessResponse(res, allRestaurant, success.LIST_FETCH, HttpStatus.OK);
         }
         return sendSuccessResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      } else {
         const allRestaurant = await RestaurantModel.aggregate([
            {
               $lookup: {
                  from: 'RestaurantCategory',
                  let: { resId: '$resCategory' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $in: ['$_id', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 0,
                           resCategory: 1,
                        },
                     },
                  ],
                  as: 'resCatDetail',
               },
            },
            
            {
               $addFields: {
                  resCatName: { $arrayElemAt: ['$resCatDetail.resCategory', 0] },
               },
            },
            {
               $project: {
                  _id: 1,
                  resName: 1,
                  addressDetails: 1,
                  location: 1,
                  resCatName: 1,
                  distance: null,
               },
            },
         ]);
         if (allRestaurant) {
            return sendSuccessResponse(res, allRestaurant, success.LIST_FETCH, HttpStatus.OK);
         }
         return sendSuccessResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const MenuList = async (req, res) => {
   try {
      let { itemType, restId } = req.query;
      let itemTypeFilter = [];
      if (itemType === '1') {
         itemTypeFilter.push(1); // Veg
      } else if (itemType === '2') {
         itemTypeFilter.push(2); // Non-veg
      } else if (itemType === '3') {
         itemTypeFilter = [1, 2]; // Both (veg and non-veg)
      }
      const menuList = await CategoryModel.aggregate([
         {
            $match: {
               restId: new ObjectId(restId),
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
                  {
                     $lookup: {
                        from: 'CustomiseItem',
                        let: { menuId: '$_id' },
                        pipeline: [
                           {
                              $match: {
                                 $expr: {
                                    $and: [
                                       { $eq: ['$menuId', '$$menuId'] },
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
                     $match: {
                        itemType: { $in: itemTypeFilter },
                     },
                  },
               ],
               as: 'menu',
            },
         },
         {
            $project: {
               categoryName: 1,
               restId: 1,
               menu: {
                  $map: {
                     input: '$menu',
                     as: 'm',
                     in: {
                        _id: '$$m._id',
                        name: '$$m.name',
                        nutrition: '$$m.nutrition',
                        itemType: '$$m.itemType',
                        description: '$$m.description',
                        price: '$$m.price',
                        image: '$$m.image',
                        customise: '$$m.customise',
                     },
                  },
               },
            },
         },
      ]);
      sendSuccessResponse(res, menuList, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const featuredList = async (req, res) => {
   try {
      let { order } = req.query;
      const resData = req.userData;
      if (resData !== undefined) {
         let user = await UserModel.findOne({ _id: resData._id });
         let userLocation = user.location.coordinates;
         const list = await RestaurantModel.aggregate([
            {
               $lookup: {
                  from: 'RestaurantCategory',
                  let: { resId: '$resCategory' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $in: ['$_id', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 0,
                           resCategory: 1,
                        },
                     },
                  ],
                  as: 'resCatDetail',
               },
            },
            {
               $lookup: {
                  from: 'orderSubscription',
                  let: { resId: '$_id' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $eq: ['$restId', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 1, // You might need other fields here if necessary
                        },
                     },
                  ],
                  as: 'subscriptionDetail',
               },
            },
            {
               $match: {
                  subscriptionDetail: { $exists: true, $not: { $size: 0 } },
               },
            },
            {
               $addFields: {
                  distance: {
                     $round: [
                        {
                           $divide: [
                              {
                                 $sqrt: {
                                    $add: [
                                       {
                                          $pow: [
                                             {
                                                $subtract: [
                                                   { $arrayElemAt: ['$location.coordinates', 0] },
                                                   userLocation[0],
                                                ],
                                             },
                                             2,
                                          ],
                                       },
                                       {
                                          $pow: [
                                             {
                                                $subtract: [
                                                   { $arrayElemAt: ['$location.coordinates', 1] },
                                                   userLocation[1],
                                                ],
                                             },
                                             2,
                                          ],
                                       },
                                    ],
                                 },
                              },
                              0.009,
                           ],
                        },
                        2,
                     ],
                  },
               },
            },
            {
               $addFields: {
                  resCatName: { $arrayElemAt: ['$resCatDetail.resCategory', 0] },
               },
            },
            {
               $project: {
                  _id: 1,
                  resName: 1,
                  addressDetails: 1,
                  location: '$location',
                  resCatName: 1,
                  distance: 1,
               },
            },
         ]);
         sendSuccessResponse(res, list, success.SUCCESS, HttpStatus.OK);
      } else {
         const list = await RestaurantModel.aggregate([
            {
               $lookup: {
                  from: 'RestaurantCategory',
                  let: { resId: '$resCategory' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $in: ['$_id', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 0,
                           resCategory: 1,
                        },
                     },
                  ],
                  as: 'resCatDetail',
               },
            },
            {
               $lookup: {
                  from: 'orderSubscription',
                  let: { resId: '$_id' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $eq: ['$restId', '$$resId'],
                           },
                        },
                     },
                     {
                        $project: {
                           _id: 1, // You might need other fields here if necessary
                        },
                     },
                  ],
                  as: 'subscriptionDetail',
               },
            },
            {
               $match: {
                  subscriptionDetail: { $exists: true, $not: { $size: 0 } },
               },
            },
            {
               $addFields: {
                  resCatName: { $arrayElemAt: ['$resCatDetail.resCategory', 0] },
               },
            },
            {
               $project: {
                  _id: 1,
                  resName: 1,
                  addressDetails: 1,
                  location: '$location',
                  resCatName: 1,
                  distance: null,
               },
            },
         ]);
         sendSuccessResponse(res, list, success.SUCCESS, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const ItemDetail = async (req, res) => {
   try {
      const list = await menuItemModel.aggregate([
         {
            $match: {
               _id: new ObjectId(req.query.itemId),
               isDeleted: false,
               status: true,
            },
         },
         {
            $lookup: {
               from: 'CustomiseItem',
               let: { menuId: '$_id' },
               pipeline: [
                  {
                     $match: {
                        $expr: {
                           $and: [
                              { $eq: ['$menuId', '$$menuId'] },
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
            $project: {
               customise: {
                  $map: {
                     input: '$customise',
                     as: 'c',
                     in: {
                        _id: '$$c._id',
                        name: '$$c.name',
                        price: '$$c.price',
                     },
                  },
               },
               name: 1,
               image: 1,
               itemType: 1,
               nutrition: 1,
               price: 1,
               description: 1,
            },
         },
      ]);
      sendSuccessResponse(res, list, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const menuCountList = async (req, res) => {
   try {
      let { restId } = req.query;
      const list = await CategoryModel.aggregate([
         {
            $match: {
               restId: new ObjectId(restId),
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
            $project: {
               categoryName: 1,
               status: 1,
               createdAt: 1,
               totalMenuItems: 1,
            },
         },
      ]);
      return sendSuccessResponse(res, list, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getsuggestedItems = async (req, res) => {
   try{
      const {restId} = req.params;
      const {userId} = req.body;

      let suggestedMenus = await menuItemModel.find({restId : new mongoose.Types.ObjectId(restId),isDeleted:false,status:true}).limit(3).lean();
      if(userId && userId.length>0){
         await Promise.all(suggestedMenus.map(async(menu,index)=>{
            const customizeMenu = await CustomiseItemModel.find({menuId:menu._id})
            suggestedMenus[index] = {...suggestedMenus[index],customizeMenu}
         }))
   
         for (let i = 0; i < suggestedMenus.length; i++) {
            const addedItemResp = await getSingleRestaurantItemByUserAndItem(userId, suggestedMenus[i]._id.toString());
            suggestedMenus[i].quantity = addedItemResp?.totalQuantity || 0
            suggestedMenus[i].itemId = addedItemResp?.itemIds?.length ? addedItemResp?.itemIds[0] : ""
         }   
      }else{
         suggestedMenus.map((item,i)=>{
            suggestedMenus[i].quantity =  0
          suggestedMenus[i].itemId = ""
         })
      }
      sendSuccessResponse(res, suggestedMenus, success.SUCCESS, HttpStatus.OK);

   }catch{
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}



export const getMustTryItems = async (req, res) => {
   try{
      const {restId,userId} = req.params;

      let cartDetails = await Restaurant_Cart_Model.findOne({userId : new mongoose.Types.ObjectId(userId),
         restId: new mongoose.Types.ObjectId(restId),
         status:1
       },{
         items:1
       })
       let items = new Set();
       cartDetails.items.map((item)=>{items.add(item.itemId.toString())})

      let mustTryItems = await menuItemModel.find({restId : new mongoose.Types.ObjectId(restId), _id:{$nin:Array.from(items)} , isDeleted:false,status:true});


      await Promise.all(mustTryItems.map(async(menu,index)=>{
         const customizeMenu = await CustomiseItemModel.find({menuId:menu._id})
         mustTryItems[index] = {...mustTryItems[index]._doc,customizeMenu}
      }))

      for (let i = 0; i < mustTryItems.length; i++) {
         const addedItemResp = await getSingleRestaurantItemByUserAndItem(userId, mustTryItems[i]._id.toString());
         mustTryItems[i].quantity = addedItemResp?.totalQuantity || 0
         mustTryItems[i].itemId = addedItemResp?.itemIds?.length ? addedItemResp?.itemIds[0] : ""
      }

      sendSuccessResponse(res, mustTryItems, success.SUCCESS, HttpStatus.OK);

   }catch{
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}