import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';
import { sendSuccessResponse, sendErrorResponse } from '../../../responses/response';
import { CategoryModel } from '../../../models/admin/category.models';
import { RestaurantModel } from '../../../models/restaurant/restaurant.model';
import { BannerModel } from '../../../models/admin/banner.model';
import { success } from '../../../responses/messages';
import { RestaurantCategoryModel } from '../../../models/admin/restaurantCategory.model';
import { WISHLIST_MODEL } from '../../../models/user/wishlist.model';
import { menuItemModel } from '../../../models/restaurant/menuItem.model';
import { Restaurant_Cart_Model } from '../../../models/user/restaurantCart.model';
import { isValidObjectId } from 'mongoose';
import { Offer_Order_Model } from '../../../models/restaurant/offerOrder.model';
import { DeliveryFare_Model } from '../../../models/admin/deliveryFare.model';
import { ServiceType } from '../../../constants/service.constants';
import { deductRestaurantBidAmountIfOfferBuy } from '../../../services/restaurants/offer_orders';
import { getEstimatedTime, getKmRange } from '../../../utils/helper';
import { RestaurantPackageModel } from '../../../models/restaurant/restaurantPackage';
import { RATING_MODEL } from '../../../models/user/rating.model';
import { PackageFoodModel } from '../../../models/admin/foodPackage.model';
//
export const getHomePageRestaurant = async (req, res) => {
   try {
      const { cuisine, long, lat, search } = req.query;
      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      //const allCategories = await CategoryModel.find({ isDeleted: false }).sort({ position: 1 });
      const allCategories = await CategoryModel.find({
         isDeleted: false,
         $or: [
            { category: "Food" },
            { service: "All" }
         ]
      })
      .sort({ foodPosition: 1 });
      
      const getServiceBanners = await BannerModel.find({ bannerType: 2, isDeleted: false, service: "Food" }).populate('offerRef');

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { restaurantStatus: 1, isBlocked: false },
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
            $lookup: {
               from: "Rating", // The collection for ratings
               localField: "_id", // Field from restaurants
               foreignField: "restId", // Field from ratings
               as: "ratings",
            },
         },
         {
            $project: {
               saved: 0,
            },
         },
         {
            $match: {
               profileType: 1, // for food type restaurants only
               ...(search && {
                  $or: [
                     { resName: { $regex: search, $options: 'i' } },
                  ],
               }),
            },
         },
      ]

      // allCategories.map((category)=>{
      //    if(category.logicType==4){
      //       pipeline = [
      //          ...pipeline,

      //             {
      //                   $lookup: {
      //                      from: "Rating", // The collection for ratings
      //                      localField: "_id", // Field from restaurants
      //                      foreignField: "restId", // Field from ratings
      //                      as: "ratings",
      //                   },
      //             },
      //             {
      //                   $addFields: {
      //                      avgRating: {
      //                         $avg: {
      //                               $filter: {
      //                                  input: "$ratings",
      //                                  as: "rating",
      //                                  cond: {
      //                                     $and: [
      //                                           { $gt: ["$$rating.value", 0] },
      //                                           { $gte: ["$$rating.createdAt", sixMonthsAgo] }
      //                                     ]
      //                                  }
      //                               }
      //                         }
      //                      }
      //                   },
      //             },
      //             {
      //                   $match: {
      //                      avgRating: { $gt: 4.5 }, // Only include restaurants with avgRating > 4.5
      //                   },
      //             },
      //       ]
      //    }
      // })



      let getAllRestaurants = await RestaurantModel.aggregate(pipeline);
      await RestaurantModel.populate(getAllRestaurants, {
         path: 'resCategory',
         match: { isDeleted: false },
      });
      if (cuisine) {
         const cuisinesArray = Array.isArray(cuisine) ? cuisine : [cuisine];
         getAllRestaurants = getAllRestaurants.filter(restaurant =>
            restaurant.resCategory.some(category =>
               cuisinesArray.includes(category.resCategory)
            )
         );
      }

      // Filter categories to include only those with status 1
      const filteredCategories = allCategories.filter(category => category.status === 1);

      // Prepare final result array
      const finalResult = [];

      // Check status for positions 1 and 2
      const position1Category = allCategories.find(cat => cat.position === 1);
      const position2Category = allCategories.find(cat => cat.position === 2);

      const hasPosition1WithStatus1 = position1Category && position1Category.status === 1;
      const hasPosition2WithStatus1 = position2Category && position2Category.status === 1;

      // Determine the position of foodServiceBanner
      let bannerPosition;

      if (hasPosition1WithStatus1 && hasPosition2WithStatus1) {
         // Both positions 1 and 2 have status 1
         bannerPosition = 2; // Place banner at index 2
      } else if (!hasPosition1WithStatus1 && hasPosition2WithStatus1) {
         // Position 1 is missing or does not have status 1
         bannerPosition = 1; // Place banner at index 1
      } else if (hasPosition1WithStatus1 && !hasPosition2WithStatus1) {
         // Position 2 is missing or does not have status 1
         bannerPosition = 1; // Place banner at index 1
      } else if (!hasPosition1WithStatus1 && !hasPosition2WithStatus1) {
         // Neither Position 1 nor Position 2 has Status 1
         bannerPosition = 0; // Place banner at index 0
      }

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newRestList = []
      for (let res of getAllRestaurants) {
         res = JSON.parse(JSON.stringify(res))
         res.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(res.location.coordinates[1], res.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         res.deliveryEstimatedTime = "14-16 mins"
         res.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         newRestList.push(res)
      }



      //let categorizedRestList =[]

      const categorizedRestList = async (newRestList, logicType) => {
         if (logicType === 4) {
            const filteredRestaurants = [];
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            newRestList.forEach((rest) => {
               let TotalRating = 0;
               let ratingCount = 0;

               rest.ratings.forEach((rating) => {
                  // Parse the createdAt date and check if it's within the last 6 months
                  const createdAtDate = new Date(rating.createdAt);
                  if (createdAtDate >= sixMonthsAgo) {
                     TotalRating += rating.star;
                     ratingCount++;
                  }
               });

               // Calculate average rating if ratingCount is greater than 0
               if (ratingCount > 0) {
                  const avgRating = TotalRating / ratingCount;

                  // Filter restaurants based on average rating
                  if (avgRating >= 4.5) {
                     // Add the restaurant to the filtered list with its average rating
                     filteredRestaurants.push({
                        ...rest,
                        avgRating: avgRating,
                     });
                  }
               }
            });
            // filteredRestaurants now contains the restaurants with an average rating of 4.5 or more
         }

         //   if(logicType === 3){

         //   }

      }

      // Add categories with status 1
      finalResult.push(...filteredCategories.map((category) => ({
         ...category._doc,
         //restaurants : await categorizedRestList(newRestList,category._doc.logicType),
         restaurants: newRestList
      })));

      // Insert foodServiceBanner at the determined position
      if (bannerPosition !== undefined) {
         finalResult.splice(bannerPosition, 0, { categoryName: "categoryBanners", banners: getServiceBanners });
      }

      sendSuccessResponse(res, finalResult, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getRestaurantByCategoryController = async (req, res) => {
   try {
      const { long, lat, search } = req.query;
      const { categoryId } = req.params;

      if (!isValidObjectId(categoryId)) {
         return sendErrorResponse(res, "Category Id is invalid", 400);
      }

      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      // Fetch the specified category
      const category = await CategoryModel.findOne({ _id: categoryId, isDeleted: false, status: 1 });
      if (!category) {
         return res.status(404).json({ error: 'Category not found or inactive' });
      }

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { restaurantStatus: 1, isBlocked: false },
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
               profileType: 1 // for Food type restaurants only
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


      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newRestList = []
      for (let res of getAllRestaurants) {
         res = JSON.parse(JSON.stringify(res))
         res.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(res.location.coordinates[1], res.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         res.deliveryEstimatedTime = "14-16 mins"
         res.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         newRestList.push(res)
      }

      // Prepare final result array
      const finalResult = {
         ...category._doc,
         restaurants: newRestList
      };

      sendSuccessResponse(res, finalResult, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getRestaurantByOffersController = async (req, res) => {
   try {
      const { long, lat, search } = req.query;
      const { offerId } = req.params;

      // Validate offerId
      if (!isValidObjectId(offerId)) {
         return sendErrorResponse(res, "Offer Id is invalid", 400);
      }

      // Validate longitude and latitude
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
               query: { restaurantStatus: 1, isBlocked: false },
            },
         },
         {
            $lookup: {
               from: 'offerOrders',
               localField: '_id',
               foreignField: 'restId',
               as: 'offers',
            },
         },
         {
            $addFields: {
               distanceInKm: { $divide: ['$distance', 1000] },
               hasOffer: {
                  $gt: [
                     {
                        $size: {
                           $filter: {
                              input: "$offers",
                              as: "offer",
                              cond: {
                                 $and: [
                                    { $eq: ["$$offer.offerId", new mongoose.Types.ObjectId(offerId)] },
                                    { $eq: ["$$offer.isActive", true] },
                                    { $gte: ["$$offer.packageExpired", new Date().getTime()] }
                                 ]
                              }
                           }
                        }
                     },
                     0
                  ]
               }
            },
         },
         {
            $match: {
               hasOffer: true,
               $and: [{}],
            },
         },
         {
            $project: {
               saved: 0,
               offers: 0,
               hasOffer: 0,
            },
         },
      ];

      if (search) {
         pipeline[3].$match.$and.push({
            $or: [
               { resName: { $regex: search, $options: "i" } },
            ],
         });
      }

      let getAllRestaurants = await RestaurantModel.aggregate(pipeline);
      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      const list = []
      for (let res of getAllRestaurants) {
         res = JSON.parse(JSON.stringify(res))
         let isWishlist = await WISHLIST_MODEL.findOne({
            userId: new mongoose.Types.ObjectId(req.userData?._id),
            restId: new mongoose.Types.ObjectId(res._id),
         });
         res.isWishlist = !!isWishlist
         res.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(res.location.coordinates[1], res.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         res.deliveryEstimatedTime = "14-16 mins"
         res.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         list.push(res)
      }


      await RestaurantModel.populate(list, {
         path: 'resCategory',
         match: { isDeleted: false },
      });

      sendSuccessResponse(res, list, "List fetched successfully", 200);

   } catch (error) {
      return sendErrorResponse(res, error.message, 500);
   }
};


export const getRestaurantOfferHighlightController = async (req, res) => {
   try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
         return sendErrorResponse(res, "Id is invalid", 400);
      }

      let list = []
      let offerResp = await Offer_Order_Model.find({ restId: new mongoose.Types.ObjectId(id), isDeleted: false, packageExpired: { $gte: new Date().getTime() } }).populate("offerId");
      for (let r of offerResp) {
         list.push(r.offerId)
      }

      sendSuccessResponse(res, list, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const restaurantDetailController = async (req, res) => {
   try {
      const { lat, long } = req.query
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
         return sendErrorResponse(res, "Id is invalid", 400);
      }

      if (!lat || !long) {
         return sendErrorResponse(res, "Please provide lat long in query", 400);
      }

      const query = { _id: id }
      let data = await RestaurantModel.findOne(query).populate('resCategory').exec();;
      if (!data) {
         return sendErrorResponse(res, "Restaurant id is invalid", 400);
      }

      data = JSON.parse(JSON.stringify(data))
      let isWishlist = await WISHLIST_MODEL.findOne({
         userId: new mongoose.Types.ObjectId(req.userData?._id),
         restId: new mongoose.Types.ObjectId(data._id),
      });
      data.isWishlist = !!isWishlist

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      data.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
      data.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(data.location.coordinates[1], data.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
      data.deliveryEstimatedTime = await getEstimatedTime(data.location.coordinates[1], data.location.coordinates[0], lat, long)
      data.distance = getKmRange(data.location.coordinates[1], data.location.coordinates[0], lat, long);

      if (!!req.userData?._id) await deductRestaurantBidAmountIfOfferBuy({ userId: req.userData._id, restId: id })
      sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getRestaurantItemsController = async (req, res) => {
   try {
      let { itemType = "1", search = "" } = req.query;
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
         return sendErrorResponse(res, "Id is invalid", 400);
      }

      const itemTypeFilter = itemType == '1' ? [1] : itemType == '2' ? [2] : [1, 2];
      const categoriesWithMenu = await RestaurantCategoryModel.aggregate([
         {
            $match: {
               restId: new mongoose.Types.ObjectId(id),
               isDeleted: false,
               status: true,
            },
         },
         {
            $lookup: {
               from: 'MenuItem',
               localField: '_id',
               foreignField: 'resCategoryId',
               as: 'menu',
            },
         },
         {
            $unwind: {
               path: '$menu',
               preserveNullAndEmptyArrays: true,
            },
         },
         {
            $match: {
               'menu.isDeleted': false,
               'menu.status': true,
               'menu.itemType': { $in: itemTypeFilter },
            },
         },
         ...(search
            ? [
               {
                  $match: {
                     'menu.name': { $regex: search, $options: 'i' },
                  },
               },
            ]
            : []),
         {
            $lookup: {
               from: 'CustomiseItem',
               localField: 'menu._id',
               foreignField: 'menuId',
               as: 'menu.customizeItems',
            },
         },
         {
            $sort: {
               'menu.name': 1, // Sort by menu item name (optional)
            },
         },
         {
            $group: {
               _id: '$_id',
               resCategory: { $first: '$resCategory' },
               menu: {
                  $push: {
                     _id: '$menu._id',
                     name: '$menu.name',
                     itemType: '$menu.itemType',
                     image: '$menu.image',
                     description: '$menu.description',
                     price: '$menu.price',
                     nutrition: '$menu.nutrition',
                     status: '$menu.status',
                     customizeItems: '$menu.customizeItems',
                  },
               },
            },
         },
         {
            $sort: {
               resCategory: 1,
            },
         },
      ]);

      const list = [];
      for (let catMenu of categoriesWithMenu) {
         const updatedCatMenu = JSON.parse(JSON.stringify(catMenu));
         for (let i = 0; i < updatedCatMenu.menu.length; i++) {
            let menuItem = updatedCatMenu.menu[i];
            const addedItemResp = await getSingleRestaurantItemByUserAndItem(req.userData?._id, menuItem._id);
            menuItem.quantity = addedItemResp?.totalQuantity || 0
            menuItem.itemId = addedItemResp?.itemIds?.length ? addedItemResp?.itemIds[0] : ""
            updatedCatMenu.menu[i] = menuItem;
         }
         list.push(updatedCatMenu);
      }

      sendSuccessResponse(res, list, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getRestaurantMenusController = async (req, res) => {
   try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
         return sendErrorResponse(res, "Id is invalid", 400);
      }


      const categoriesWithMenu = await RestaurantCategoryModel.aggregate([
         {
            $match: {
               restId: new mongoose.Types.ObjectId(id),
               isDeleted: false,
               status: true,
            },
         },
         {
            $lookup: {
               from: 'MenuItem',
               localField: '_id',
               foreignField: 'resCategoryId',
               as: 'menu',
            },
         },
         {
            $unwind: {
               path: '$menu',
               preserveNullAndEmptyArrays: true,
            },
         },
         {
            $match: {
               'menu.isDeleted': false,
               'menu.status': true,
            },
         },
         {
            $group: {
               _id: '$_id',
               resCategory: { $first: '$resCategory' },
               menuCount: { $sum: 1 },
            },
         },
      ]);



      sendSuccessResponse(res, categoriesWithMenu, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getRestaurantItemByIdController = async (req, res) => {
   try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
         return sendErrorResponse(res, "Id is invalid", 400);
      }


      const categoriesWithMenu = await menuItemModel.aggregate([
         {
            $match: {
               _id: new mongoose.Types.ObjectId(id),
               isDeleted: false,
               status: true,
            },
         },
         {
            $lookup: {
               from: 'CustomiseItem',
               localField: '_id',
               foreignField: 'menuId',
               as: 'customizeItems',
            },
         },
         // {
         //    $group: {
         //       _id: '$_id',
         //       name: '$name',
         //       image: '$image',
         //       description: '$description',
         //       price: '$price',
         //       nutrition: '$nutrition',
         //       status: '$status',
         //       customizeItems: '$customizeItems',
         //    },
         // },
      ]);

      const data = categoriesWithMenu.length ? categoriesWithMenu[0] : null
      sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getSingleRestaurantItemByUserAndItem = async (userId, itemId) => {
   try {
      const result = await Restaurant_Cart_Model.aggregate([
         {
            $match: {
               userId: new mongoose.Types.ObjectId(userId),
               'items.itemId': new mongoose.Types.ObjectId(itemId),
               status: 1
            },
         },
         {
            $unwind: '$items',
         },
         {
            $match: {
               'items.itemId': new mongoose.Types.ObjectId(itemId),
            },
         },
         {
            $group: {
               _id: '$_id', // Group by cart _id
               totalQuantity: { $sum: '$items.quantity' }, // Sum the quantity for the item
               itemIds: { $push: '$items._id' }, // Collect items._id into an array
            },
         },
         {
            $project: {
               _id: 1, // Keep the original _id (cart's _id)
               totalQuantity: 1, // Keep totalQuantity in the result
               itemIds: 1, // Include the array of item IDs
            },
         },
      ])

      return result.length > 0 ? result[0] : {};
   } catch (error) {
      throw error;
   }
}



/****************************************
 *************** SPRINT 5 ****************
 *****************************************/
//PACKAGE RESTAURANTS//

export const getRestaurantList = async (req, res) => {
   try {
      const { cuisine, long, lat, search, caloricIntake, goal } = req.query;

      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }
      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      //service:"package" in next query => add this after having package category in our data

      //const allCategories = await CategoryModel.find({ isDeleted: false }).sort({ position: 1 });
      const allCategories = await CategoryModel.find({
         isDeleted: false,
         $or: [
            { category: "Package" },
            { service: "All" }
         ]
      }).sort({ packagePosition: 1 });

      const getServiceBanners = await BannerModel.find({ bannerType: 2, isDeleted: false, service: "Package" }).populate('offerRef');
      let filteredRestaurants = [];
      //weightLoss
      //maintenance
      //weightGain

      if (caloricIntake && goal) {
         if (goal === "weightLoss") {
            filteredRestaurants = await RestaurantPackageModel.find({
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $lte: Number(caloricIntake) },
               //SubstituteItemsCalories:{$lte:Number(caloricIntake)},
               status: true,
               isDeleted: false
            }, { restId: 1, totalItemsCalories: 1, SubstituteItemsCalories: 1 })
         }
         if (goal === "maintenance") {
            filteredRestaurants = await RestaurantPackageModel.find({
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $lte: (Number(caloricIntake) + 100), $gte: (Number(caloricIntake) - 100) },
               //SubstituteItemsCalories:{$lte:Number(caloricIntake)+100,$gte:Number(caloricIntake)-100},
               status: true,
               isDeleted: false
            }, { restId: 1, totalItemsCalories: 1, SubstituteItemsCalories: 1 })
         }
         if (goal === "weightGain") {
            filteredRestaurants = await RestaurantPackageModel.find({
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $gte: Number(caloricIntake) },
               //SubstituteItemsCalories:{$gte:Number(caloricIntake)},
               status: true,
               isDeleted: false
            }, { restId: 1, totalItemsCalories: 1, SubstituteItemsCalories: 1 })
         }
         filteredRestaurants = filteredRestaurants.map(restaurant => restaurant.restId);
      }

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { restaurantStatus: 1, isBlocked: false },
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
            $lookup: {
               from: "Rating",
               localField: "_id",
               foreignField: "restId",
               as: "ratings",
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
               profileType: 2 // for Package type restaurants only
            },
         },
      ]
      if (search) {
         pipeline = [...pipeline,
         {
            $match: { resName: { $regex: `^${search}`, $options: "i" } },
         },
         ]
      }

      if (caloricIntake) {
         pipeline = [
            ...pipeline,
            {
               $match: { _id: { $in: filteredRestaurants } }
            }
         ]
      }

      let getAllRestaurants = await RestaurantModel.aggregate(pipeline);

      await Promise.all(getAllRestaurants.map(async (item, index) => {
         let offerRef = await Offer_Order_Model.find({ restId: item._id }).populate('offerId').sort({ createdAt: -1 }).limit(1)
         getAllRestaurants[index].offerRef = offerRef.length > 0 ? offerRef[0] : {}
      }))
      await RestaurantModel.populate(getAllRestaurants, {
         path: 'resCategory',
         match: { isDeleted: false },
      });
      if (cuisine) {
         const cuisinesArray = Array.isArray(cuisine) ? cuisine : [cuisine];
         getAllRestaurants = getAllRestaurants.filter(restaurant =>
            restaurant.resCategory.some(category =>
               cuisinesArray.includes(category.resCategory)
            )
         );
      }

      // Filter categories to include only those with status 1
      const filteredCategories = allCategories.filter(category => category.status === 1);

      const finalResult = [];

      // Check status for positions 1 and 2
      const position1Category = allCategories.find(cat => cat.position === 1);
      const position2Category = allCategories.find(cat => cat.position === 2);

      const hasPosition1WithStatus1 = position1Category && position1Category.status === 1;
      const hasPosition2WithStatus1 = position2Category && position2Category.status === 1;

      // Determine the position of foodServiceBanner
      let bannerPosition;

      if (hasPosition1WithStatus1 && hasPosition2WithStatus1) {
         // Both positions 1 and 2 have status 1
         bannerPosition = 2; // Place banner at index 2
      } else if (!hasPosition1WithStatus1 && hasPosition2WithStatus1) {
         // Position 1 is missing or does not have status 1
         bannerPosition = 1; // Place banner at index 1
      } else if (hasPosition1WithStatus1 && !hasPosition2WithStatus1) {
         // Position 2 is missing or does not have status 1
         bannerPosition = 1; // Place banner at index 1
      } else if (!hasPosition1WithStatus1 && !hasPosition2WithStatus1) {
         // Neither Position 1 nor Position 2 has Status 1
         bannerPosition = 0; // Place banner at index 0
      }

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newRestList = []
      if (getAllRestaurants.length > 0) {
         for (let res of getAllRestaurants) {
            res = JSON.parse(JSON.stringify(res))
            res.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(res.location.coordinates[1], res.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
            res.deliveryEstimatedTime = "14-16 mins"
            res.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
            newRestList.push(res)
         }

         // Add categories with status 1
         finalResult.push(...filteredCategories.map((category) => ({
            ...category._doc,
            //restaurants : await categorizedRestList(newRestList,category._doc.logicType),
            restaurants: newRestList
         })));
      }

      // Insert foodServiceBanner at the determined position
      if (bannerPosition !== undefined) {
         finalResult.splice(bannerPosition, 0, { categoryName: "categoryBanners", banners: getServiceBanners });
      }


      sendSuccessResponse(res, finalResult, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getPackageRestByCategory = async (req, res) => {
   try {
      const { long, lat, search } = req.query;
      const { categoryId } = req.params;

      if (!isValidObjectId(categoryId)) {
         return sendErrorResponse(res, "Category Id is invalid", 400);
      }

      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      // Fetch the specified category
      const category = await CategoryModel.findOne({ _id: categoryId, isDeleted: false, status: 1 });
      if (!category) {
         return res.status(404).json({ error: 'Category not found or inactive' });
      }

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { restaurantStatus: 1, isBlocked: false },
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
               profileType: 2 // for Package type restaurants only
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
      await Promise.all(getAllRestaurants.map(async (item, index) => {
         let offerRef = await Offer_Order_Model.find({ restId: item._id }).populate('offerId').sort({ createdAt: -1 }).limit(1)
         getAllRestaurants[index].offerRef = offerRef.length > 0 ? offerRef[0] : {}
      }))
      await RestaurantModel.populate(getAllRestaurants, {
         path: 'resCategory',
         match: { isDeleted: false },
      });


      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newRestList = []
      for (let res of getAllRestaurants) {
         res = JSON.parse(JSON.stringify(res))
         res.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(res.location.coordinates[1], res.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         res.deliveryEstimatedTime = "14-16 mins"
         res.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         newRestList.push(res)
      }

      // Prepare final result array
      const finalResult = {
         ...category._doc,
         restaurants: newRestList
      };

      sendSuccessResponse(res, finalResult, "Restaurant List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getRestPackages = async (req, res) => {
   try {
      const { restId, caloricIntake, goal } = req.query;

      if (!restId) {
         return res.status(400).json({ status: false, error: 'Restaurant Id is required' });
      }

      let packages = []

      if (caloricIntake && caloricIntake.length > 0 && goal && goal.length > 0) {
         if (goal === "weightLoss") {
            packages = await RestaurantPackageModel.find({
               restId: new mongoose.Types.ObjectId(restId),
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $lte: Number(caloricIntake) },
               //SubstituteItemsCalories:{$lte:Number(caloricIntake)},
               status: true,
               isDeleted: false
            })
         }
         if (goal === "maintenance") {
            packages = await RestaurantPackageModel.find({
               restId: new mongoose.Types.ObjectId(restId),
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $lte: (Number(caloricIntake) + 100), $gte: (Number(caloricIntake) - 100) },
               //SubstituteItemsCalories:{$lte:Number(caloricIntake)+100,$gte:Number(caloricIntake)-100},
               status: true,
               isDeleted: false
            })
         }
         if (goal === "weightGain") {
            packages = await RestaurantPackageModel.find({
               restId: new mongoose.Types.ObjectId(restId),
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $gte: Number(caloricIntake) },
               //SubstituteItemsCalories:{$gte:Number(caloricIntake)},
               status: true,
               isDeleted: false
            })
         }
      } else {
         packages = await RestaurantPackageModel.find({
            restId: new mongoose.Types.ObjectId(restId),
            status: true,
            isDeleted: false
         })
      }

      sendSuccessResponse(res, packages, "Package List fetched successfully", HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getPackageDetail = async (req, res) => {
   try {
      const { packageId } = req.query;

      if (!packageId || packageId.length < 1) {
         return res.status(400).json({ error: 'Package Id required!!' });
      }

      const packageData = await RestaurantPackageModel.findById(packageId);

      sendSuccessResponse(res, packageData, "Packaged fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}


//PACKAGE ADMIN//
// export const getAdminPackageList = async (req,res) =>{
//    try{

//       let {search,duration, long , lat} = req.query

//       if (!long || !lat) {
//          return res.status(400).json({ error: 'Longitude and latitude are required' });
//       }
//       const userLocation = {
//          type: 'Point',
//          coordinates: [parseFloat(long), parseFloat(lat)],
//       };

//       let params={} ;
//       if(duration && duration.length<1){
//          params.duration = duration
//       }
//       if (search && search.length > 0) {
//          params.restaurants = {
//             $elemMatch: {
//                 _id: mongoose.Types.ObjectId(search) // Convert search string to ObjectId
//             }
//         }
//       } 

//       // let adminPackages = await PackageFoodModel.aggregate([
//       //    {
//       //       $geoNear: {
//       //          near: userLocation,
//       //          distanceField: 'distance',
//       //          maxDistance: 50000, // 50 kilometers
//       //          spherical: true,
//       //          query: { isDeleted: false, status: true, ...params },
//       //       }
//       //    }
//       // ]);
//       let adminPackages = await PackageFoodModel.find({ isDeleted: false, status: true,...params }).lean();

//       console.log("adminPackages...",adminPackages)

//       adminPackages.map((item,index)=>{

//          console.log("item...",item.restaurants)
//          let totalRest = item.restaurants.length;
//          adminPackages[index].totalRestaurants = totalRest
//       })
//       sendSuccessResponse(res, adminPackages, "Admin Packaged fetched successfully", HttpStatus.OK);
//    } catch(error){
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//    }
// }

export const getAdminPackageList = async (req, res) => {
   try {
      let { search, duration, long, lat, offerId } = req.query;

      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      let params = {};
      if (duration && duration.length > 0 && (duration !== 0 && duration !== '0')) {
         params.duration = duration;
      }
      if (search && search.length > 0) {
         const regex = new RegExp(`^${search}`, 'i'); // '^' ensures it starts with 'search', 'i' makes it case-insensitive
         params.name = { $regex: regex };
      }

      // First, find restaurants near the user location
      const nearbyRestaurants = await RestaurantModel.aggregate([
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000, // 50 kilometers
               spherical: true,
               query: { isDeleted: false, restaurantStatus: 1, isBlocked: false } // Adjust as needed
            }
         },
         {
            $match: {
               profileType: 2 // for Package type restaurants only
            },
         },
         {
            $project: {
               _id: 1
            }
         }
      ]);

      let restaurantIds = nearbyRestaurants.map(restaurant => restaurant._id);
      if (offerId && offerId.length > 0) {
         let offerData = await Offer_Order_Model.find({
            offerId: new mongoose.Types.ObjectId(offerId),
            restId: { $in: restaurantIds },
            packageExpired: { $gte: new Date().getTime() },
            isActive: true,
            status: true,
            isDeleted: false
         }, { restId: 1 })
         //filtering restaurants those purchased selected offer/banner
         restaurantIds = offerData.map(restaurant => restaurant.restId);
      }

      // Now, find food packages that include these restaurants
      let adminPackages = await PackageFoodModel.find({
         isDeleted: false,
         status: true,
         'restaurants._id': { $in: restaurantIds },
         ...params,
      }).populate('restaurants._id').lean();

      adminPackages.length > 0 && adminPackages.forEach((item, index) => {

         adminPackages[index].restaurants = adminPackages[index].restaurants.filter(restaurant =>
            restaurantIds.some(id => id.equals(restaurant._id._id))
         );
         let totalRest = adminPackages[index].restaurants.length;
         adminPackages[index].totalRestaurants = totalRest;

         if (totalRest < item.upTo) {
            adminPackages[index].upTo = totalRest
         }

      });

      // Filter the populated results based on resName or package name
      // adminPackages = adminPackages.filter(pkg => 
      //    pkg.restaurants.some(restaurant => 
      //       restaurant.resName && restaurant.resName.includes(search)
      //    ) || pkg.name === search // Check if pkg.name matches search
      // );

      sendSuccessResponse(res, adminPackages, "Admin Packages fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getAdminPackageRestList = async (req, res) => {
   try {
      const { long, lat, packageId, offerId } = req.query;
      if (!packageId && packageId.length < 1) {
         return res.status(400).json({ error: 'Package Id required!!' });
      }

      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      let adminPackageData = await PackageFoodModel.findOne({ _id: new mongoose.Types.ObjectId(packageId), isDeleted: false, status: true });
      if (!adminPackageData) {
         return res.status(400).json({ error: 'Invalid Package Id!!' });
      }

      let restaurants = adminPackageData.restaurants.map(rest => rest._id);

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { restaurantStatus: 1, isBlocked: false },
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
            $lookup: {
               from: "Rating", // The collection for ratings
               localField: "_id", // Field from restaurants
               foreignField: "restId", // Field from ratings
               as: "ratings",
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
               _id: { $in: restaurants },
               profileType: 2 // for Package type restaurants only
            },
         },
      ]

      let getAllRestaurants = await RestaurantModel.aggregate(pipeline);
      await RestaurantModel.populate(getAllRestaurants, {
         path: 'resCategory',
         match: { isDeleted: false },
      });

      let restaurantIds;
      if (offerId && offerId.length > 4) {
         let offerData = await Offer_Order_Model.find({
            offerId: new mongoose.Types.ObjectId(offerId),
            //restId:{$in:restaurantIds},
            packageExpired: { $gte: new Date().getTime() },
            isActive: true,
            status: true,
            isDeleted: false
         }, { restId: 1 })
         //filtering restaurants those purchased selected offer/banner
         restaurantIds = offerData.map(restaurant => restaurant.restId.toString());
         getAllRestaurants = getAllRestaurants.filter((item) => restaurantIds.includes(item._id.toString()))
      }

      sendSuccessResponse(res, getAllRestaurants, "Restaurants fetched successfully", HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const restCategoriesList = async (req, res) => {
   try {
      let { restId, packageId } = req.query;
      let categoryData = await PackageFoodModel.findOne({
         _id: new mongoose.Types.ObjectId(packageId),
         restaurants: {
            $elemMatch: {
               _id: new mongoose.Types.ObjectId(restId), // Convert search string to ObjectId
            },
         },
         isDeleted: false,
         status: true,
      })
         .lean();

      if (!categoryData) {
         return sendErrorResponse(res, "No categories found", HttpStatus.NOT_FOUND);
      }

      categoryData.restaurants.map((restaurant) => {
         if (restaurant._id.toString() === restId) {
            categoryData.restaurants = restaurant
         }
      })

      sendSuccessResponse(res, categoryData, "Categories fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getServiceBannerList = async (req, res) => {
   try {
      const serviceBanners = await BannerModel.find({ bannerType: 2, isDeleted: false, service: "Package" }).populate('offerRef');
      sendSuccessResponse(res, serviceBanners, "Banners fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

// BMI Calculator

export const userSurveyCalculation = async (req, res) => {
   try {

      const { gender, age, height, presentWeight, targetWeight, activityLevel, goal, diet, long, lat } = req.query

      if (!gender) { return res.status(400).json({ status: false, error: 'Gender is required' }); }
      if (!age) { return res.status(400).json({ status: false, error: 'Age is required' }); }
      if (!height) { return res.status(400).json({ status: false, error: 'Height is required' }); }
      if (!presentWeight) { return res.status(400).json({ status: false, error: 'Present Weight is required' }); }
      if (!activityLevel) { return res.status(400).json({ status: false, error: 'activityLevel is required' }); }
      if (!goal) { return res.status(400).json({ status: false, error: 'goal is required' }); }

      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }
      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };



      //Basal Metabolic Rate (BMR) calculation.....
      let bmr;
      if (gender === "men") {
         //BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (years) + 5
         bmr = 10 * Number(presentWeight) + 6.25 * Number(height) - 5 * Number(age) + 5;
      }
      if (gender === "women") {
         // BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age(years) - 161
         bmr = 10 * Number(presentWeight) + 6.25 * Number(height) - 5 * Number(age) - 161;
      }

      //Total Daily Energy Expenditure (TDEE) calculation.....
      const activityMultipliers = {
         // sedentary: 1.2,                           // ▪ Sedentary: BMR * 1.2
         lightlyActive: 1.375,                     // ▪ Lightly active: BMR * 1.375
         moderatelyActive: 1.55,                   // ▪ Moderately active: BMR * 1.55
         veryActive: 1.725,                        // ▪ Very active: BMR * 1.725
         superActive: 1.9                          // ▪ Super active: BMR * 1.9
      };
      const multiplier = activityMultipliers[activityLevel];
      let tdee;
      if (multiplier) {
         // TDEE = BMR * Activity Level Multiplier
         tdee = bmr * multiplier;
      } else {
         return sendErrorResponse(res, "enter correct activityLevel", HttpStatus.NOT_FOUND);
      }

      //Adjustments Based on Goals...........
      let caloricIntake = 0;
      if (goal === "weightLoss") {
         //o Recommended Caloric Intake = TDEE - 500 calories/day (for a safe weight loss of about 0.5 kg/week)
         caloricIntake = tdee - 500  //calories/day
      }
      if (goal === "maintenance") {
         //o Recommended Caloric Intake = TDEE
         caloricIntake = tdee  //calories/day
      }
      if (goal === "weightGain") {
         //o Recommended Caloric Intake = TDEE + 500 calories/day (for a safe weight gain of about 0.5 kg/week)
         caloricIntake = tdee + 500  //calories/day
      }

      // diet.......................
      // o Vegetarian
      // o Vegan
      // o Gluten-free
      // o Lactose-free
      // o Any specific allergies

      let filteredRestaurants = [];
      //weightLoss
      //maintenance
      //weightGain

      let packages = []

      if (caloricIntake && goal) {
         if (goal === "weightLoss") {
            packages = await RestaurantPackageModel.find({
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $lte: Number(caloricIntake) },
               //SubstituteItemsCalories:{$lte:Number(caloricIntake)},
               status: true,
               isDeleted: false
            }, { restId: 1, totalItemsCalories: 1, SubstituteItemsCalories: 1 })
         }
         if (goal === "maintenance") {
            packages = await RestaurantPackageModel.find({
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $lte: (Number(caloricIntake) + 100), $gte: (Number(caloricIntake) - 100) },
               //SubstituteItemsCalories:{$lte:Number(caloricIntake)+100,$gte:Number(caloricIntake)-100},
               status: true,
               isDeleted: false
            }, { restId: 1, totalItemsCalories: 1, SubstituteItemsCalories: 1 })
         }
         if (goal === "weightGain") {
            packages = await RestaurantPackageModel.find({
               totalItemsCalories: { $exists: true },
               SubstituteItemsCalories: { $exists: true },
               totalItemsCalories: { $gte: Number(caloricIntake) },
               //SubstituteItemsCalories:{$gte:Number(caloricIntake)},
               status: true,
               isDeleted: false
            }, { restId: 1, totalItemsCalories: 1, SubstituteItemsCalories: 1 })
         }
         filteredRestaurants = packages.map(restaurant => restaurant.restId);
      }

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { restaurantStatus: 1, isBlocked: false },
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
            $lookup: {
               from: "Rating",
               localField: "_id",
               foreignField: "restId",
               as: "ratings",
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
               profileType: 2 // for Package type restaurants only
            },
         },
      ]

      if (caloricIntake) {
         pipeline = [
            ...pipeline,
            {
               $match: { _id: { $in: filteredRestaurants } }
            }
         ]
      }

      let getAllRestaurants = await RestaurantModel.aggregate(pipeline);


      let totalPacakges = [];
      packages.map((item) => {
         let restExisted = getAllRestaurants.find((rest) => rest._id.toString() === item.restId.toString())
         if (restExisted) {
            totalPacakges = [...totalPacakges, item]
         }
      })

      let data = {
         caloricIntake,
         goal,
         totalPackages: totalPacakges.length
      }


      sendSuccessResponse(res, data, "calories calculation fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}