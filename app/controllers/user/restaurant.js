import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import UserModel from '../../models/user/user.model';
import { WISHLIST_MODEL } from '../../models/user/wishlist.model';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { RATING_MODEL } from '../../models/user/rating.model';
import { BannerModel } from '../../models/admin/banner.model';
import { RestaurantCategoryModel } from '../../models/admin/restaurantCategory.model';
import { RestaurantCuisineModel } from '../../models/admin/cuisine.model'
import { DeliveryFare_Model } from '../../models/admin/deliveryFare.model';
import { ServiceType } from '../../constants/service.constants';
import orderDeliveryModel from '../../models/delivery/orderDelivery.model'
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;

/****************************************
 *************** SPRINT 3 ****************
 *****************************************/

// Add the rating of restaurant and items
export const restRating = async (req, res) => {
   try {
      let { restId,star,orderId,items,review,status,userId ,deliveryBoyRating=0, driverReview} = req.body;

      if (!star) {
         return sendErrorResponse(res, {}, 'Please enter star', HttpStatus.FORBIDDEN);
      }
      if (!restId) {
         return sendErrorResponse(res, {}, 'Please enter restId', HttpStatus.FORBIDDEN);
      }

      let updateDeliveryBoyRating = await orderDeliveryModel.findOneAndUpdate(
         {orderId:new mongoose.Types.ObjectId(orderId)},
         {$set:{deliveryBoyRating:deliveryBoyRating, driverReview :driverReview}},
         {new:true}
      );

      let findRating = await commonService.findOne(RATING_MODEL, {
         restId: new mongoose.Types.ObjectId(restId),
         orderId : new mongoose.Types.ObjectId(orderId),
         userId: new mongoose.Types.ObjectId(userId),
      });

      if (findRating) {
         let detail = {
            star: star
         };
         if(items){
            detail.items = items;
         }
         if(review){
            detail.review = review;
         }
         if(status){
            detail.status = status;
         }
         let data = await commonService.findOneAndUpdate(RATING_MODEL, findRating._id, detail);
         return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
      }
      let detail = {
         restId: new mongoose.Types.ObjectId(restId),
         orderId : new mongoose.Types.ObjectId(orderId),
         userId: new mongoose.Types.ObjectId(userId),
         star: star,
         items: items,
         review: review,
         status:status
      };
      let data = await commonService.create(RATING_MODEL, detail);
      return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      console.log(error);
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// .........Update the ratings for the items.........
//   ratings.forEach(({ itemId, rating }) => {
//    const item = order.items.find(i => i.itemId.toString() === itemId);
//    if (item) {
//        // Validate the rating
//        if (["like", "unlike", "neutral"].includes(rating)) {
//            item.rating = rating; // Update rating to the new string format
//        } else {
//            return res.status(400).json({ message: 'Invalid rating value' });
//        }
//    }
// });

// order.updatedAt = new Date().getTime(); // Update the timestamp

// get all restaurants


export const getAllRestaurants = async (req, res) => {
   try {
      const { long, lat, search } = req.query;
      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const maxDistance = 50000;
      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      const today = new Date().toLocaleString('en-US', { weekday: 'long' });

      const pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: maxDistance,
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
               //active:true,
               $expr: {
                  $in: [today, "$documents.workingDays"]
               }
            },
         },
      ]

      if (!!search) {
         pipeline[4].$match.$and = [
            {
               $or: [
                  { resName: { $regex: search, $options: "i" } },
               ],
            },
         ];
      }

      let getAllRestaurants = await RestaurantModel.aggregate(pipeline);

      await RestaurantModel.populate(getAllRestaurants, {
         path: 'resCategory',
         match: { isDeleted: false },
      });

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newRestList = []
      for(let res of getAllRestaurants) {
         res = JSON.parse(JSON.stringify(res))
         res.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (10 * (deliveryFareResp.perKmFare || 1))
         res.deliveryEstimatedTime = "14-16 mins"
         res.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         newRestList.push(res)
      }

      sendSuccessResponse(res, newRestList, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);

   }
}

// get all restaurants
export const getAllServiceBanners = async (req, res) => {
   try {
      const getServiceBanners = await BannerModel.find({ bannerType: 2, isDeleted: false }).populate('offerRef');
      sendSuccessResponse(res, getServiceBanners, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);

   }
}

// get restaurant cuisine
export const getRestaurantCuisine = async (req, res) => {
   try {
      const getResCuisine = await RestaurantCuisineModel.find({
         restId: { $exists: false },
         isDeleted: false
      });
      sendSuccessResponse(res, getResCuisine, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);

   }
}
