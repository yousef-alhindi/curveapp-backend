import HttpStatus from 'http-status-codes';
import mongoose, { trusted } from 'mongoose';
import { sendSuccessResponse, sendErrorResponse } from '../../../responses/response';
import { CategoryModel } from "../../../models/admin/category.models";
import { BannerModel } from '../../../models/admin/banner.model';
import { SupplementSellerModel } from "../../../models/supplement/supplementSeller.model";
import { Sup_Offer_Order_Model } from "../../../models/supplement/offerOrder.model";
import { DeliveryFare_Model } from "../../../models/admin/deliveryFare.model";
import { ServiceType } from '../../../constants/service.constants';
import { getEstimatedTime, getKmRange } from '../../../utils/helper';
import { isValidObjectId } from 'mongoose';
import { SupplementPkgModel } from '../../../models/supplement/supplementPkg.model';
import { SupplementModel } from '../../../models/supplement/supplement';
import { SupplementCartModel } from '../../../models/user/supplementCart.model';
import * as commonService from '../../../services/common/common.service';
import { success, error } from '../../../responses/messages';
import { WISHLIST_MODEL } from '../../../models/user/wishlist.model';
import UserModel from '../../../models/user/user.model';
import AddressModel from '../../../models/user/address.model';
import SupplementOrderModel from '../../../models/supplement/supplementOrder.model';
import { status } from '../../../constants/order.constants';
import { SUPPLEMENT_ORDER_RATING_MODEL } from '../../../models/supplement/supplementRating.model';
import SupplementOrderDeliveryModel from '../../../models/delivery/supplementDeliveryModel';
const crypto = require('crypto');

export const getSupplementSellerList = async (req, res) => {
   try {
      const { long, lat, search } = req.query;

      if (!long || !lat) {
         return res.status(400).json({ error: 'long and lat are required' });
      }
      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };

      //service:"Supplement" in next query => add this after having Supplement category in our data

      //const allCategories = await CategoryModel.find({ isDeleted: false, status: 1 }, { categoryName: 1, description: 1, status: 1, position: 1, isDelivery: 1, isPickUp: 1 }).sort({ position: 1 });
      const allCategories = await CategoryModel.find({ isDeleted: false, status: 1, $or: [{ category: "Supplement" },{ service: "All" }], },
            { categoryName: 1, description: 1, status: 1, supplementPosition: 1, isDelivery: 1, isPickUp: 1 })
            .sort({ supplementPosition: 1 });

      const getServiceBanners = await BannerModel.find({ bannerType: 2, isDeleted: false, service: "Supplement" })
         .populate('offerRef');

      //const today = new Date().toLocaleString('en-US', { weekday: 'long' });

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { supplementStatus: 1, isBlocked: false },
            },
         },
         {
            $lookup: {
               from: "wishlists",
               localField: "_id",
               foreignField: "supplementSeller",
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
         //   {
         //      $lookup: {
         //                  from: "Rating", 
         //                  localField: "_id", 
         //                  foreignField: "restId", 
         //                  as: "ratings",
         //               },
         //   },
         //   {
         //      $project: {
         //         saved: 0,
         //      },
         //   },
         {
            $project: {
               name: 1,
               ownerName: 1,
               email: 1,
               location: 1,
               addressDetails: 1,
               active: 1,
               supplementStatus: 1,
               colorCode: 1,
               distanceInKm: 1,
               distance: 1,
               documents: 1,
               isDelivery: 1,
               isPickUp: 1,
               active: 1,
               isWishlist: 1
            }
         },
         //   {
         //       $set: {
         //           workingDaysArray: { $ifNull: ["$documents.workingDays", []] }
         //       }
         //   },
         //   {
         //       $match: {
         //           active: true,
         //           $expr: {
         //               $in: [today, "$workingDaysArray"]
         //           }
         //       }
         //   }
      ]
      if (search) {
         pipeline = [...pipeline,
         {
            $match: { name: { $regex: `^${search}`, $options: "i" } },
         },
         ]
      }

      let getAllSupplementSellers = await SupplementSellerModel.aggregate(pipeline);
      //  await Promise.all(getAllSupplementSellers.map(async(supplementSeller,index)=>{
      //        let offerRef = await Sup_Offer_Order_Model.find({supplementSeller:supplementSeller._id}).populate('offerId').sort({createdAt:-1}).limit(1)
      //        getAllSupplementSellers[index].offerRef = offerRef.length>0?offerRef[0]:{}
      //  }))

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
      let newSupplementSellerList = []
      if (getAllSupplementSellers.length > 0) {
         for (let sup of getAllSupplementSellers) {
            sup = JSON.parse(JSON.stringify(sup))
            sup.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(sup.location.coordinates[1], sup.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
            sup.deliveryEstimatedTime = "14-16 mins"
            sup.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
            newSupplementSellerList.push(sup)
         }

         // Add categories with status 1
         finalResult.push(...filteredCategories.map((category) => ({
            ...category._doc,
            supplementSellers: newSupplementSellerList
         })));
      }

      // Insert foodServiceBanner at the determined position
      if (bannerPosition !== undefined) {
         finalResult.splice(bannerPosition, 0, { categoryName: "categoryBanners", banners: getServiceBanners });
      }


      sendSuccessResponse(res, finalResult, "Supplement Seller List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getSupSellerByCategory = async (req, res) => {
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
      const category = await CategoryModel.findOne({ _id: categoryId, isDeleted: false, status: 1 }, { categoryName: 1, description: 1, status: 1, position: 1, isDelivery: 1, isPickUp: 1 });
      if (!category) {
         return res.status(404).json({ error: 'Category not found or inactive' });
      }
      //const today = new Date().toLocaleString('en-US', { weekday: 'long' });
      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { supplementStatus: 1, isBlocked: false },
            },
         },
         {
            $lookup: {
               from: "wishlists",
               localField: "_id",
               foreignField: "supplementSeller",
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
         //   {
         //      $project: {
         //         saved: 0,
         //      },
         //   },
         {
            $project: {
               name: 1,
               ownerName: 1,
               email: 1,
               location: 1,
               addressDetails: 1,
               active: 1,
               supplementStatus: 1,
               colorCode: 1,
               distanceInKm: 1,
               distance: 1,
               documents: 1,
               isDelivery: 1,
               isPickUp: 1,
               active: 1,
               isWishlist: 1
            }
         },
         //   {
         //       $set: {
         //           workingDaysArray: { $ifNull: ["$documents.workingDays", []] }
         //       }
         //   },
         //   {
         //       $match: {
         //           active: true,
         //           $expr: {
         //               $in: [today, "$workingDaysArray"]
         //           }
         //       }
         //   }
      ];

      if (search) {
         pipeline = [...pipeline,
         {
            $match: { name: { $regex: `^${search}`, $options: "i" } },
         },
         ]
      }

      let getAllSupplementSellers = await SupplementSellerModel.aggregate(pipeline);


      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newSupplementSellerList = []
      for (let sup of getAllSupplementSellers) {
         sup = JSON.parse(JSON.stringify(sup))
         sup.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(sup.location.coordinates[1], sup.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         sup.deliveryEstimatedTime = "14-16 mins"
         sup.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         newSupplementSellerList.push(sup)
      }

      // Prepare final result array
      const finalResult = {
         ...category._doc,
         supplementSellers: newSupplementSellerList
      };

      sendSuccessResponse(res, finalResult, "Supplement Seller List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getAllSupplementSellers = async (req, res) => {
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

      //const today = new Date().toLocaleString('en-US', { weekday: 'long' });

      let pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: maxDistance,
               spherical: true,
               query: { supplementStatus: 1, isBlocked: false },
            },
         },
         {
            $lookup: {
               from: "wishlists",
               localField: "_id",
               foreignField: "supplementSeller",
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
         //   {
         //      $project: {
         //         saved: 0,
         //      },
         //   },
         {
            $project: {
               name: 1,
               ownerName: 1,
               email: 1,
               location: 1,
               addressDetails: 1,
               active: 1,
               supplementStatus: 1,
               colorCode: 1,
               distanceInKm: 1,
               distance: 1,
               documents: 1,
               isDelivery: 1,
               isPickUp: 1,
               active: 1,
               isWishlist: 1
            }
         },
         //   {
         //       $set: {
         //           workingDaysArray: { $ifNull: ["$documents.workingDays", []] }
         //       }
         //   },
         //   {
         //       $match: {
         //           active: true,
         //           $expr: {
         //               $in: [today, "$workingDaysArray"]
         //           }
         //       }
         //   }
      ]

      if (search) {
         pipeline = [...pipeline,
         {
            $match: { name: { $regex: `^${search}`, $options: "i" } },
         },
         ]
      }

      let getAllSupplementSellers = await SupplementSellerModel.aggregate(pipeline);

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newSupSellerList = []
      for (let sup of getAllSupplementSellers) {
         sup = JSON.parse(JSON.stringify(sup))
         sup.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (10 * (deliveryFareResp.perKmFare || 1))
         sup.deliveryEstimatedTime = "14-16 mins"
         sup.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         newSupSellerList.push(sup)
      }

      sendSuccessResponse(res, newSupSellerList, "Supplement Seller List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);

   }
}

export const getSupplementBundles = async (req, res) => {
   try {
      let { type } = req.query;
      //type = 'Weight Gain', 'Weight Loss'
      let { sellerId } = req.params

      let query = {
         supplementSeller: new mongoose.Types.ObjectId(sellerId),
         isBlocked: false,
         isDeleted: false
      }

      if (type && type.length > 2) {
         query.type = type
      }
      let supplementBundles = await SupplementPkgModel.find(query).lean();

      let cartDetails = await SupplementCartModel.findOne({
         userId: new mongoose.Types.ObjectId(req.userData?._id),
         supplementSeller: new mongoose.Types.ObjectId(sellerId),
         status: 1,
         bundles: { $exists: true }
      }, {
         bundles: 1
      })

      let bundles = new Set();
      cartDetails && cartDetails.bundles.map((bundle) => { bundles.add(bundle.bundleId.toString()) })
      if (cartDetails) {
         supplementBundles.map((sup, index) => {
            let cartSup = cartDetails.bundles.filter(bundle => bundle.bundleId.toString() === sup._id.toString())
            const totalQuantity = cartSup.reduce((total, bundle) => total + bundle.quantity, 0);
            supplementBundles[index].quantity = totalQuantity
         })

         cartDetails.bundles.map((cartItem) => {
            supplementBundles.map((bundle, index) => {
               if (cartItem.bundleId.equals(bundle._id)) {
                  supplementBundles[index].bundleCartId = cartItem._id
               }
            })
         })

      } else {
         supplementBundles.forEach(supplementBundle => {
            supplementBundle.quantity = 0;
         });
      }

      sendSuccessResponse(res, supplementBundles, "Supplement Bundles List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const supplementBundleDetails = async (req, res) => {
   try {
      let { supBundleId } = req.params

      let query = {
         _id: new mongoose.Types.ObjectId(supBundleId),
         isBlocked: false,
         isDeleted: false
      }
      let supplementBundleDetail = await SupplementPkgModel.findOne(query, { name: 1, price: 1, products: 1, description: 1, isBlocked: 1, isDeleted: 1, image: 1, supplementSeller: 1 }).lean();

      await Promise.all(supplementBundleDetail.products.map(async (product, index) => {
         let productDetail = await SupplementModel.findOne({ _id: product._id });
         let stockData = productDetail.stock.find(stock => stock._id.toString() === product.stockId.toString())
         supplementBundleDetail.products[index].data = {
            name: productDetail.name,
            brandName: productDetail.name,
            stock: stockData,
            description: productDetail.description,
            images: productDetail.images,
            isBlocked: productDetail.isBlocked,
            isDeleted: productDetail.isDeleted
         }
      }))

      let cartDetails = await SupplementCartModel.findOne({
         userId: new mongoose.Types.ObjectId(req.userData?._id),
         supplementSeller: supplementBundleDetail.supplementSeller,
         status: 1,
         bundles: { $exists: true }
      }, {
         bundles: 1
      })

      let bundles = new Set();
      cartDetails && cartDetails.bundles.map((bundle) => { bundles.add(bundle.bundleId.toString()) })

      if (cartDetails) {
         let cartSup = cartDetails.bundles.filter(bundle => bundle.bundleId.toString() === supplementBundleDetail._id.toString())
         const totalQuantity = cartSup.reduce((total, bundle) => total + bundle.quantity, 0);
         supplementBundleDetail.quantity = totalQuantity
      } else {
         supplementBundleDetail.quantity = 0;
      }

      sendSuccessResponse(res, supplementBundleDetail, "Supplement Bundles Detail fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const getSupplements = async (req, res) => {
   try {
      let { type, search } = req.query;
      let { sellerId } = req.params

      let query = {
         supplementSeller: new mongoose.Types.ObjectId(sellerId),
         isBlocked: false,
         isDeleted: false
      }

      if (type && type.length > 2) {
         query.type = type
      }

      if (search && search.length > 0) {
         query.name = { $regex: `^${search}`, $options: "i" };
      }

      let supplements = await SupplementModel.find(query).lean();

      let cartDetails = await SupplementCartModel.findOne({
         userId: new mongoose.Types.ObjectId(req.userData?._id),
         supplementSeller: new mongoose.Types.ObjectId(sellerId),
         status: 1,
         items: { $exists: true }
      }, {
         items: 1
      })

      let items = new Set();
      cartDetails && cartDetails.items.map((item) => { items.add(item.itemId.toString()) })

      if (cartDetails) {
         supplements.map((sup, index) => {
            let cartSup = cartDetails.items.filter(item => item.itemId.toString() === sup._id.toString())
            const totalQuantity = cartSup.reduce((total, item) => total + item.quantity, 0);
            // const itemIds = cartSup.map(item => ({
            //    itemId: item.itemId,
            //    stockId: item.stockId
            //  }));

            supplements[index].quantity = totalQuantity
            //supplements[index].itemIds = itemIds
         })



         cartDetails.items.forEach(cartItem => {
            supplements.forEach(supplement => {
               // let cartSup = cartDetails.items.filter(item=>item.itemId.toString()===supplement._id.toString())
               // const totalQuantity = cartSup.reduce((total, item) => total + item.quantity, 0);
               // supplement.quantity = totalQuantity;
               supplement.stock.forEach(stock => {
                  if (cartItem.stockId.equals(stock._id)) {
                     stock.addedQuantity = cartItem.quantity; // Set matched quantity
                  } else {
                     if (!stock.addedQuantity) {
                        stock.addedQuantity = 0; // Set to 0 if stockId does not match
                     }
                  }
               });
            });
         })
      } else {
         supplements.forEach(supplement => {
            supplement.quantity = 0;
            supplement.stock.forEach(stock => {
               stock.addedQuantity = 0; // Set to 0 if stockId does not match
            });
         });
      }


      sendSuccessResponse(res, supplements, "Supplement List fetched successfully", HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const getSingleSupplementCartAdded = async (req, res) => {
   try {
      let { supId } = req.params

      if (!req?.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      let query = {
         _id: new mongoose.Types.ObjectId(supId),
         isBlocked: false,
         isDeleted: false
      }

      let supplement = await SupplementModel.findOne(query).lean();

      let cartDetails = await SupplementCartModel.findOne({
         userId: new mongoose.Types.ObjectId(req.userData?._id),
         supplementSeller: supplement.supplementSeller,
         status: 1,
         items: { $exists: true }
      }, {
         items: 1
      })

      let items = new Set();
      cartDetails && cartDetails.items.map((item) => { items.add(item.itemId.toString()) })

      if (cartDetails) {
         let cartSup = cartDetails.items.filter(item => item.itemId.toString() === supplement._id.toString())
         const totalQuantity = cartSup.reduce((total, item) => total + item.quantity, 0);
         supplement.quantity = totalQuantity

         cartDetails.items.forEach(cartItem => {
            supplement.stock.forEach(stock => {
               if (cartItem.stockId.equals(stock._id)) {
                  stock.addedQuantity = cartItem.quantity; // Set matched quantity
                  stock.cartStockId = cartItem._id
               } else {
                  if (!stock.addedQuantity) {
                     stock.addedQuantity = 0; // Set to 0 if stockId does not match
                  }
               }
            });
         })
      } else {
         supplement.quantity = 0;
         supplement.stock.forEach(stock => {
            stock.addedQuantity = 0; // Set to 0 if stockId does not match
         });
      }

      supplement.stock = supplement.stock.filter(stock => stock.addedQuantity > 0)

      sendSuccessResponse(res, supplement, "Supplement fetched successfully", HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const supplementDetail = async (req, res) => {
   try {
      let { supId } = req.params

      let query = {
         _id: new mongoose.Types.ObjectId(supId),
         isBlocked: false,
         isDeleted: false
      }
      let supplement = await SupplementModel.findOne(query)
         .populate({
            path: 'reviews.userId',
            select: "fullName profileImage"
         })
         .lean();

      let cartDetails = await SupplementCartModel.findOne({
         userId: new mongoose.Types.ObjectId(req.userData?._id),
         supplementSeller: supplement.supplementSeller,
         status: 1
      }, {
         items: 1
      })

      let items = new Set();
      cartDetails && cartDetails.items.map((item) => { items.add(item.itemId.toString()) })

      if (cartDetails) {
         let cartSup = cartDetails.items.filter(item => item.itemId.toString() === supplement._id.toString())
         const totalQuantity = cartSup.reduce((total, item) => total + item.quantity, 0);
         supplement.quantity = totalQuantity

         cartDetails.items.forEach(cartItem => {
            supplement.stock.forEach(stock => {
               if (cartItem.stockId.equals(stock._id)) {
                  stock.addedQuantity = cartItem.quantity; // Set matched quantity
               } else {
                  if (!stock.addedQuantity) {
                     stock.addedQuantity = 0; // Set to 0 if stockId does not match
                  }
               }
            });
         })
      } else {
         supplement.quantity = 0;
         supplement.stock.forEach(stock => {
            stock.addedQuantity = 0; // Set to 0 if stockId does not match
         });
      }

      sendSuccessResponse(res, supplement, "Supplement Detail fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const getSupOfferHighlight = async (req, res) => {
   try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
         return sendErrorResponse(res, "Id is invalid", 400);
      }

      let list = []
      let offerResp = await Sup_Offer_Order_Model.find({ supplementSeller: new mongoose.Types.ObjectId(id), isActive: true, isDeleted: false, packageExpired: { $gte: new Date().getTime() } }).populate("offerId");
      for (let r of offerResp) {
         list.push(r.offerId)
      }

      sendSuccessResponse(res, list, "List fetched successfully", HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getSupSellerDetail = async (req, res) => {
   try {
      const { long, lat } = req.query;
      let { sellerId } = req.params


      if (!long || !lat) {
         return res.status(400).json({ error: 'Longitude and latitude are required' });
      }

      const userLocation = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)],
      };
      const pipeline = [
         {
            $geoNear: {
               near: userLocation,
               distanceField: 'distance',
               maxDistance: 50000,
               spherical: true,
               query: { supplementStatus: 1, isBlocked: false },
            },
         },
         //   {
         //      $lookup: {
         //         from: "wishlists",
         //         localField: "_id",
         //         foreignField: "restId",
         //         as: "saved",
         //      },
         //   },
         {
            $addFields: {
               // isWishlist: {
               //    $in: [
               //       new mongoose.Types.ObjectId(req.userData?._id),
               //       "$saved.userId",
               //    ],
               // },
               distanceInKm: { $divide: ['$distance', 1000] },
            },
         },
         //   {
         //      $project: {
         //         saved: 0,
         //      },
         //   },
         {
            $project: {
               name: 1,
               ownerName: 1,
               email: 1,
               location: 1,
               addressDetails: 1,
               active: 1,
               supplementStatus: 1,
               colorCode: 1,
               distanceInKm: 1,
               distance: 1,
               documents: 1,
               isDelivery: 1,
               isPickUp: 1,
               active: 1
            }
         },
         {
            $match: {
               _id: new mongoose.Types.ObjectId(sellerId)
            }
         }
      ]
      let supSellerDetail = await SupplementSellerModel.aggregate(pipeline);

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      supSellerDetail[0].deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (10 * (deliveryFareResp.perKmFare || 1))
      supSellerDetail[0].deliveryEstimatedTime = "14-16 mins"
      supSellerDetail[0].freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000

      let isWishlist = await WISHLIST_MODEL.findOne({
         userId: new mongoose.Types.ObjectId(req.userData?._id),
         supplementSeller: new mongoose.Types.ObjectId(supSellerDetail[0]._id),
      });

      supSellerDetail[0].isWishlist = !!isWishlist

      sendSuccessResponse(res, supSellerDetail[0], "Supplement Seller Details", HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const addTocart = async (req, res) => {
   try {
      let { itemId, stockId, bundleId, cartType, quantity, type = 1, deliveryOption } = req.body;
      if (!quantity) {
         return sendErrorResponse(res, "Please enter a valid quantity", HttpStatus.BAD_REQUEST);
      }

      if (!req?.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      let itemResp, stockData, itemPrice, totalItemAmount;
      if (cartType === 'supplement') {
         itemResp = await SupplementModel.findOne({ _id: new mongoose.Types.ObjectId(itemId), 'stock._id': new mongoose.Types.ObjectId(stockId) })
         if (!itemResp) {
            return sendErrorResponse(res, "Item ID or stock Id is invalid", HttpStatus.BAD_REQUEST);
         }

         stockData = itemResp.stock.find(stock => stock._id.toString() === stockId);
         if (quantity > stockData.quantity && type == 1) {
            return sendErrorResponse(res, "This much Quantity is not available in stock", HttpStatus.BAD_REQUEST);
         }
         itemPrice = stockData ? stockData.sellingPrice : 0;
         totalItemAmount = itemPrice * Number(quantity);
      }

      if (cartType === 'bundle') {
         itemResp = await SupplementPkgModel.findOne({ _id: new mongoose.Types.ObjectId(bundleId) })
         if (!itemResp) {
            return sendErrorResponse(res, "Item ID or stock Id is invalid", HttpStatus.BAD_REQUEST);
         }

         // need to check available quanity of all products added in bundle (condition penidng)

         itemPrice = itemResp.price || 0;
         totalItemAmount = itemPrice * Number(quantity);
      }


      let cart = await SupplementCartModel.findOne({ userId: req.userData._id, supplementSeller: itemResp.supplementSeller, status: 1 });

      if (cart) {
         if (cartType === 'supplement') {
            let itemIndex = cart.items.findIndex(item => item.itemId.toString() == itemId.toString() && item.stockId.toString() == stockId.toString());

            if (itemIndex > -1) {
               let totalQuantity = 0;
               if (type === 1) {
                  totalQuantity = Number(cart.items[itemIndex].quantity + quantity)
                  if (totalQuantity > stockData.quantity) {
                     return sendErrorResponse(res, "This much Quantity is not available in stock", HttpStatus.BAD_REQUEST);
                  }
               }
               if (type == 2) {
                  if (cart.items[itemIndex].quantity == 1) {
                     return sendErrorResponse(res, `Please use cart delete api instead of add api `, HttpStatus.BAD_REQUEST);
                  }

                  totalQuantity = Number(cart.items[itemIndex].quantity - quantity)
               }

               cart.items[itemIndex].quantity = totalQuantity
               cart.items[itemIndex].amount = itemPrice * totalQuantity;
               cart.deliveryOption = deliveryOption;
            } else {
               cart.items.push({
                  itemId: new mongoose.Types.ObjectId(itemId),
                  stockId: new mongoose.Types.ObjectId(stockId),
                  quantity: Number(quantity),
                  amount: totalItemAmount
               });
               cart.deliveryOption = deliveryOption;
            }

         }
         if (cartType === 'bundle') {
            let bundleIndex = cart.bundles.findIndex(bundle => bundle.bundleId.toString() == bundleId.toString());

            if (bundleIndex > -1) {
               let totalQuantity = 0;
               if (type == 1) {
                  totalQuantity = Number(cart.bundles[bundleIndex].quantity + quantity)
                  // need to check available quanity of all products added in bundle (condition penidng)
               }
               if (type == 2) {
                  if (cart.bundles[bundleIndex].quantity == 1) {
                     return sendErrorResponse(res, `Please use cart delete api instead of add api `, HttpStatus.BAD_REQUEST);
                  }

                  totalQuantity = Number(cart.bundles[bundleIndex].quantity - quantity)
               }
               cart.bundles[bundleIndex].quantity = totalQuantity
               cart.bundles[bundleIndex].amount = itemPrice * totalQuantity;
               cart.deliveryOption = deliveryOption;
            } else {
               cart.bundles.push({
                  bundleId: new mongoose.Types.ObjectId(bundleId),
                  quantity: Number(quantity),
                  amount: totalItemAmount
               });
               cart.deliveryOption = deliveryOption;
            }
         }

         // Recalculate cart amount
         //cart.amount = cart.items.reduce((total, item) => total + item.amount, 0);
         cart.amount = [...cart?.items, ...cart?.bundles].reduce((total, item) => total + item.amount, 0);

         const updatedCart = await cart.save();
         return sendSuccessResponse(res, updatedCart, success.UPDATED, HttpStatus.OK);

      } else {
         if (cartType === 'supplement') {
            const createdResp = await commonService.create(SupplementCartModel, {
               userId: req.userData._id,
               supplementSeller: itemResp.supplementSeller,
               items: [{
                  itemId: new mongoose.Types.ObjectId(itemId),
                  stockId: new mongoose.Types.ObjectId(stockId),
                  quantity: Number(quantity),
                  amount: totalItemAmount,
               }],
               amount: totalItemAmount,
               deliveryOption: deliveryOption, //takeAway: 0,  delivery: 1
               createdAt: new Date().getTime(),
               updatedAt: new Date().getTime()
            });
            return sendSuccessResponse(res, createdResp, success.SUCCESS, HttpStatus.OK);
         }
         if (cartType === 'bundle') {
            const createdResp = await commonService.create(SupplementCartModel, {
               userId: req.userData._id,
               supplementSeller: itemResp.supplementSeller,
               bundles: [{
                  bundleId: new mongoose.Types.ObjectId(bundleId),
                  quantity: Number(quantity),
                  amount: totalItemAmount,
               }],
               amount: totalItemAmount,
               deliveryOption: deliveryOption, //takeAway: 0,  delivery: 1
               createdAt: new Date().getTime(),
               updatedAt: new Date().getTime()
            });
            return sendSuccessResponse(res, createdResp, success.SUCCESS, HttpStatus.OK);
         }
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const multiCartList = async (req, res) => {
   try {
      if (!req.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      let cartList = await SupplementCartModel.find({ userId: req.userData._id, status: 1, isDeleted: false }, { supplementSeller: 1, items: 1, amount: 1, bundles: 1 })
         .populate({
            path: 'supplementSeller',
            select: 'name ownerName location addressDetails'
         })
         .lean();

      await Promise.all(cartList.map((cart, index1) => {
         if (cart.bundles && cart.bundles.length > 0) {
            cart.bundles.map(async (bundle, index2) => {
               let bundleData = await SupplementPkgModel.findOne({ _id: bundle._id })
               cartList[index1].bundles[index2].data = bundleData
            })
         }
         cartList[index1].quantity = [...cart?.items, ...cart?.bundles].reduce((total, item) => total + item.quantity, 0);
      }))

      return sendSuccessResponse(res, cartList, success.SUCCESS);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const removeCartBySupSeller = async (req, res) => {
   try {
      if (!req.userData) {
         return sendErrorResponse(res, 'token is required', HttpStatus.BAD_GATEWAY);
      }

      const { supSellerId, cartId } = req.params;
      if (!mongoose.isValidObjectId(supSellerId)) {
         return sendErrorResponse(res, "Supplement SellerId is invalid", 400);
      }

      if (!req?.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      await SupplementCartModel.deleteOne({ userId: req.userData._id, supplementSeller: new mongoose.Types.ObjectId(supSellerId), _id: new mongoose.Types.ObjectId(cartId) });
      return sendSuccessResponse(res, {}, success.DELETED_SUCCESS, HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const summarySellerCartView = async (req, res) => {
   try {
      if (!req.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      const { supSellerId } = req.params;
      if (!mongoose.isValidObjectId(supSellerId)) {
         return sendErrorResponse(res, "supplement Seller Id is invalid", 400);
      }

      const result = await SupplementCartModel.findOne({ userId: req.userData._id, supplementSeller: new mongoose.Types.ObjectId(supSellerId), status: 1, isDeleted: false })

      let data = {
         _id: "",
         supplementSellerId: "",
         totalAmount: 0,
         totalItems: 0
      }

      if (result) {

         // Calculate the total quantity from both arrays
         const totalQuantity = [
            ...result?.items,
            ...result?.bundles
         ].reduce((total, item) => total + item.quantity, 0);

         data = {
            _id: result._id,
            supplementSellerId: result.supplementSeller,
            totalAmount: result.amount,
            totalItems: totalQuantity
         }
      }
      return sendSuccessResponse(res, data, success.SUCCESS);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const singleCartView = async (req, res) => {
   try {
      if (!req.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      const { cartId } = req.params;
      if (!mongoose.isValidObjectId(cartId)) {
         return sendErrorResponse(res, "supplement Seller Id is invalid", 400);
      }

      const result = await SupplementCartModel.findOne({ userId: req.userData._id, _id: new mongoose.Types.ObjectId(cartId), status: 1, isDeleted: false })
         .populate({
            path: "supplementSeller",
            select: "name ownerName addressDetails _id location"
         })
         .lean();

      if (result.bundles && result.bundles.length > 0) {
         await Promise.all(result.bundles.map(async (bundle, index) => {
            let bundleData = await SupplementPkgModel.findOne({ _id: bundle.bundleId })
            result.bundles[index].data = bundleData
         }))
      }

      await Promise.all(result.items.map(async (product, index) => {
         let productDetail = await SupplementModel.findOne({ _id: product.itemId });
         let stockData = productDetail.stock.find(stock => stock._id.toString() === product.stockId.toString())
         result.items[index].data = {
            name: productDetail.name,
            images: productDetail.images,
            stock: stockData,
         }
      }))

      let data = {
         _id: "",
         supplementSeller: {},
         supplements: [],
         bundles: [],
         totalAmount: 0
      }
      if (result) {
         data = {
            _id: result._id,
            supplementSeller: result.supplementSeller,
            supplements: result.items || [],
            bundles: result.bundles || [],
            totalAmount: result.amount
         }
      }
      return sendSuccessResponse(res, data, success.SUCCESS);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const removeFromcart = async (req, res) => {
   try {
      if (!req.userData) {
         return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
      }

      const { id, type } = req.params;
      //type : bundle || supplement
      if (!mongoose.isValidObjectId(id)) {
         return sendErrorResponse(res, "ID is invalid", HttpStatus.BAD_REQUEST);
      }

      let carts = await SupplementCartModel.find({ userId: req.userData._id, status: 1 });

      if (!carts.length) {
         return sendErrorResponse(res, "Cart not found", HttpStatus.NOT_FOUND);
      }

      let notFound = true
      for (let cart of carts) {
         if (type === "supplement") {
            let itemIndex = cart.items.findIndex(item => item._id.toString() == id.toString());

            if (itemIndex === -1) {
               continue
            }

            notFound = false
            cart.items.splice(itemIndex, 1);
         }

         if (type === 'bundle') {
            let bundleIndex = cart.bundles.findIndex(bundle => bundle._id.toString() == id.toString());

            if (bundleIndex === -1) {
               continue
            }

            notFound = false
            cart.bundles.splice(bundleIndex, 1);
         }

         //   let totalAmount = 0;
         //   for (let item of cart.items) {
         //       const currentItem = await SupplementModel.findOne({_id:new mongoose.Types.ObjectId(item.itemId),'stock._id':new mongoose.Types.ObjectId(item.stockId)})

         //       if(currentItem){
         //          const stockData = currentItem.stock.find(stock=>stock._id.toString()===item.stockId.toString());
         //          const itemPrice = stockData ? stockData.sellingPrice : 0;
         //          const totalItemAmount = itemPrice * item.quantity;
         //          totalAmount = totalAmount + totalItemAmount
         //       }
         //   }

         //   cart.amount = totalAmount;

         // Recalculate cart amount
         cart.amount = [...cart?.items, ...cart?.bundles].reduce((total, item) => total + item.amount, 0);
         if (cart.items.length === 0 && cart.bundles.length === 0) {
            await SupplementCartModel.deleteOne({ _id: cart._id });
            return sendSuccessResponse(res, {}, "Cart is empty and has been deleted", HttpStatus.OK);
         } else {
            await cart.save();
            return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK);
         }
      }
      if (notFound) {
         return sendErrorResponse(res, "Item ID is invalid", HttpStatus.NOT_FOUND);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getMustTryItems = async (req, res) => {
   try {
      const { supSellerId, userId } = req.params;

      let cartDetails = await SupplementCartModel.findOne({
         userId: new mongoose.Types.ObjectId(userId),
         supplementSeller: new mongoose.Types.ObjectId(supSellerId),
         status: 1
      }, {
         items: 1
      })
      let items = new Set();
      cartDetails.items.map((item) => { items.add(item.itemId.toString()) })

      let mustTryItems = await SupplementModel.find({ supplementSeller: new mongoose.Types.ObjectId(supSellerId), _id: { $nin: Array.from(items) }, isDeleted: false, isBlocked: false }).lean();

      // for (let i = 0; i < mustTryItems.length; i++) {
      //    const addedItemResp = await getSingleSupplementItemByUserAndItem(userId, mustTryItems[i]._id.toString());
      //mustTryItems[i].quantity = addedItemResp?.totalQuantity || 0
      //mustTryItems[i].itemIds = addedItemResp?.itemIds?.length ? addedItemResp?.itemIds[0] : []
      // }

      sendSuccessResponse(res, mustTryItems, success.SUCCESS, HttpStatus.OK);

   } catch {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

// export const getSingleSupplementItemByUserAndItem = async (userId, itemId) => {
//    try {
//       const result = await SupplementCartModel.aggregate([
//          {
//             $match: {
//                userId: new mongoose.Types.ObjectId(userId),
//                'items.itemId': new mongoose.Types.ObjectId(itemId),
//                status:1
//             },
//          },
//          {
//             $unwind: '$items',
//          },
//          {
//             $match: {
//                'items.itemId': new mongoose.Types.ObjectId(itemId),
//             },
//          },
//          {
//             $group: {
//                _id: '$_id', // Group by cart _id
//                totalQuantity: { $sum: '$items.quantity' }, // Sum the quantity for the item
//                itemIds: { $push: '$items._id' }, // Collect items._id into an array
//             },
//          },
//          {
//             $project: {
//                _id: 1, // Keep the original _id (cart's _id)
//                totalQuantity: 1, // Keep totalQuantity in the result
//                itemIds: 1, // Include the array of item IDs
//             },
//          },
//       ])

//       return result.length > 0 ? result[0] : {};
//    } catch (error) {
//       throw error;
//    }
// }

export const addAndRemoveWishlist = async (req, res) => {
   try {
      const { supSellerId, userId } = req.params;
      if (!mongoose.isValidObjectId(supSellerId)) {
         return sendErrorResponse(res, "Id is invalid", 400);
      }


      const supSellerResp = await commonService.findOne(SupplementSellerModel, { _id: supSellerId });
      if (!supSellerResp) {
         return sendErrorResponse(res, "Supplement Seller not found.", 404);
      }

      const alreadySaved = await commonService.findOne(WISHLIST_MODEL, {
         supplementSeller: new mongoose.Types.ObjectId(supSellerId),
         userId: new mongoose.Types.ObjectId(userId),
      });
      if (!!alreadySaved) {
         await commonService.findOneAndDelete(WISHLIST_MODEL, { _id: alreadySaved._id });
         return sendSuccessResponse(res, {}, "Supplement Seller removed successfully from Whishlist");
      }

      await commonService.create(WISHLIST_MODEL, {
         supplementSeller: new mongoose.Types.ObjectId(supSellerId),
         userId: new mongoose.Types.ObjectId(userId),
      });

      sendSuccessResponse(res, {}, "Supplement Seller added successfully in whishList");
   } catch (error) {
      sendErrorResponse(res, error.message);
   }
};

export const listWishlist = async (req, res) => {
   try {
      const { long, lat } = req.query;
      if (!req.userData?._id) {
         return sendErrorResponse(res, "Please provide access token to fetch wishlists.", 404);
      }

      const supSellerResp = await WISHLIST_MODEL.find({ userId: req.userData._id, supplementSeller: { $exists: true } })
         .populate({
            path: 'supplementSeller',
            select: 'name ownerName addressDetails location'
         })
         .lean();

      let list = []
      if (supSellerResp) {
         const filteredSupSellerIds = supSellerResp
            .map(d => d.supplementSeller)
            .filter(supplementSeller => supplementSeller !== null);

         for (let d of filteredSupSellerIds) {
            d = JSON.parse(JSON.stringify(d)); // Deep copy of d
            let isWishlist = await WISHLIST_MODEL.findOne({
               userId: new mongoose.Types.ObjectId(req.userData?._id),
               supplementSeller: new mongoose.Types.ObjectId(d._id),
            });

            list.push({ ...d, isWishlist: !!isWishlist });
         }
      }

      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      let newSupplementSellerList = []
      for (let sup of list) {
         sup = JSON.parse(JSON.stringify(sup))
         sup.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(sup.location?.coordinates?.[1], sup.location?.coordinates?.[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         sup.distanceInKm = getKmRange(sup.location.coordinates?.[1], sup.location.coordinates?.[0], lat, long)
         newSupplementSellerList.push(sup)
      }
      sendSuccessResponse(res, newSupplementSellerList, "Wishlist fetch successfully");
   } catch (error) {
      sendErrorResponse(res, error.message);
   }
};

export const getSupSellersByOffers = async (req, res) => {
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
               query: { supplementStatus: 1, isBlocked: false },
            },
         },
         {
            $lookup: {
               from: 'supOfferOrders',
               localField: '_id',
               foreignField: 'supplementSeller',
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
         pipeline = [...pipeline,
         {
            $match: { name: { $regex: `^${search}`, $options: "i" } },
         },
         ]
      }

      let getAllSupSellers = await SupplementSellerModel.aggregate(pipeline);
      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER })
      const list = []
      for (let sup of getAllSupSellers) {
         sup = JSON.parse(JSON.stringify(sup))
         let isWishlist = await WISHLIST_MODEL.findOne({
            userId: new mongoose.Types.ObjectId(req.userData?._id),
            supplementSeller: new mongoose.Types.ObjectId(sup._id),
         });
         sup.isWishlist = !!isWishlist
         sup.deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + (getKmRange(sup.location.coordinates[1], sup.location.coordinates[0], lat, long) * (deliveryFareResp.perKmFare || 1))
         sup.deliveryEstimatedTime = "14-16 mins"
         sup.freeDeliveryAmount = deliveryFareResp?.freeDeliveryApplicable || 1000
         list.push(sup)
      }

      sendSuccessResponse(res, list, "List fetched successfully", 200);

   } catch (error) {
      return sendErrorResponse(res, error.message, 500);
   }
};

export const getDeliveryFare = async (req, res) => {

   try {
      const { addressCoordinates, supCoordinates } = req.body;

      if (!addressCoordinates || ((addressCoordinates && addressCoordinates.length != 2) || addressCoordinates.includes(null))) {
         return sendErrorResponse(res, 'addressCoordinates required', HttpStatus.BAD_GATEWAY);
      }

      if (!supCoordinates || ((supCoordinates && supCoordinates.length != 2) || supCoordinates.includes(null))) {
         return sendErrorResponse(res, 'supCoordinates required', HttpStatus.BAD_GATEWAY);
      }
      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER, status: true });

      const kmRange = getKmRange(
         addressCoordinates[0],
         addressCoordinates[1],
         supCoordinates[0],
         supCoordinates[1]
      )

      const deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + kmRange * (deliveryFareResp?.perKmFare || 1);

      // Estimate delivery time (you can adjust the speed based on your context)
      const averageSpeedKmh = 30; // Average speed in kilometers per hour
      const estimatedDeliveryTimeInMintutes = kmRange / averageSpeedKmh * 60; // Delivery time in minutes

      return res.status(201).json({ status: true, message: " Delivery Amount & Delivery Time", data: { deliveryAmount, estimatedDeliveryTimeInMintutes } });
   } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
   }
}

export const getDiscountAmount = async (req, res) => {

   try {
      const { supSellerId, promoCodeId, totalAmount } = req.body;

      if (!supSellerId || supSellerId === "" || supSellerId === null) {
         return sendErrorResponse(res, 'supSellerId required', HttpStatus.BAD_GATEWAY);
      }
      if (!promoCodeId || promoCodeId === "" || promoCodeId === null) {
         return sendErrorResponse(res, 'promoCodeId required', HttpStatus.BAD_GATEWAY);
      }
      if (!totalAmount || totalAmount === null) {
         return sendErrorResponse(res, 'totalAmount required', HttpStatus.BAD_GATEWAY);
      }

      const offerOrders = await Sup_Offer_Order_Model.find({ supplementSeller: new mongoose.Types.ObjectId(supSellerId) }).populate('offerId');
      if (offerOrders.length === 0 && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'No offer orders found for this supplement Seller' });
      }

      const specificOfferOrders = offerOrders.find(
         (offerOrder) => offerOrder.offerId._id.toString() === promoCodeId //e.g.:  "66da2f3abb6eabf3cfaf999b"
      );
      if (!specificOfferOrders && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'Promo code is invalid or not applicable' });
      }

      let discount;
      if (promoCodeId !== null && promoCodeId !== "") {
         const discountType = specificOfferOrders.offerId.discountType;
         if (discountType === 0) {
            // No Discount
            discount = 0;
         } else if (discountType === 1) {
            // Flat discount
            discount = specificOfferOrders.offerId.flatDiscountValue;
         } else if (discountType === 2) {
            // Percentage discount
            discount = (totalAmount * specificOfferOrders.offerId.percentDiscountValue) / 100;
            discount = Math.min(discount, specificOfferOrders.offerId.discountUpto);
         }
      }

      return res.status(201).json({ status: true, message: `Discount on this promocode ${specificOfferOrders.offerId.promoCode}`, data: { discount: discount } });
   } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
   }

}

export const promoCodeList = async (req, res) => {
   try {
      //const resData = req.userData;

      let data = await Sup_Offer_Order_Model.aggregate([
         {
            $match: {
               $expr: {
                  $and: [
                     { $eq: ['$supplementSeller', new mongoose.Types.ObjectId(req.query.supSellerId)] },
                     { $eq: ['$isActive', true] },
                     { $eq: ['$isDeleted', false] },
                  ],
               },
            },
         },
         {
            $project: {
               offerId: 1,
               _id: 0
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
               offerDetails: '$offerDetail',
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

export const createOrder = async (req, res) => {
   try {
      let {
         userId,
         supCartId,
         addressId,
         deliveryOption,
         promoCodeId, //66da2f3abb6eabf3cfaf999b
         paymentMethod,
         paymentId,
         anySuggestion,
      } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }
      const cart = await SupplementCartModel.findById(supCartId)
         // .populate('items.itemId')
         // .populate('bundles.bundleId')
         .lean();

      if (!cart || (cart.items.length === 0 && cart.bundles.length === 0)) {
         return res.status(404).json({ message: 'Cart is empty or not found' });
      }
      const orderExisted = await SupplementOrderModel.find({ supplementCartId: new mongoose.Types.ObjectId(supCartId) });

      if (orderExisted.length > 0) {
         return res.status(409).json({ message: 'Order has already been created for this cart.' }); // conflict
      }

      const address = await AddressModel.findById(addressId);
      if (!address) {
         return res.status(404).json({ message: 'Address not found' });
      }
      const supSeller = await SupplementSellerModel.findById(cart.supplementSeller);
      if (!supSeller) {
         return res.status(404).json({ message: 'Supplement Seller not found' });
      }

      const offerOrders = await Sup_Offer_Order_Model.find({ supplementSeller: cart.supplementSeller }).populate('offerId');
      if (offerOrders.length === 0 && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'No offer orders found for this Supplement Seller' });
      }

      const specificOfferOrders = offerOrders.find(
         (offerOrder) => offerOrder.offerId._id.toString() === promoCodeId //e.g.:  "66da2f3abb6eabf3cfaf999b"
      );
      if (!specificOfferOrders && promoCodeId !== null && promoCodeId !== "") {
         return res.status(404).json({ message: 'Promo code is invalid or not applicable' });
      }


      const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER });
      // Calculate total Amount
      const deliveryAmount =
         Number(deliveryFareResp?.baseFare || 0) +
         getKmRange(
            address.location.coordinates[0],
            address.location.coordinates[1],
            supSeller.location.coordinates[0],
            supSeller.location.coordinates[1]
         ) *
         (deliveryFareResp.perKmFare || 1);

      let totalAmount = cart.amount;

      let discount;
      if (promoCodeId !== null && promoCodeId !== "") {
         const discountType = specificOfferOrders.offerId.discountType;
         if (discountType === 0) {
            // No Discount
            discount = 0;
         } else if (discountType === 1) {
            // Flat discount
            discount = specificOfferOrders.offerId.flatDiscountValue;
            totalAmount -= discount;
         } else if (discountType === 2) {
            // Percentage discount
            const percentDiscount = (totalAmount * specificOfferOrders.offerId.percentDiscountValue) / 100;
            discount = Math.min(percentDiscount, specificOfferOrders.offerId.discountUpto);
            totalAmount -= discount;
         }
      }


      totalAmount = Math.max(Math.round((totalAmount + deliveryAmount) * 100) / 100, 0); // Round to 2 decimal places

      function generateOrderId(length = 8) {
         return crypto.randomBytes(length)
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
            .substring(0, length);         // Ensure it's exactly 8 characters
      }

      // Function to check if the orderId exists in the database
      async function isOrderIdUnique(orderId) {
         const existingOrder = await SupplementOrderModel.findOne({ orderId });
         return !existingOrder;  // Returns true if orderId is unique
      }

      // Generate unique orderId by checking in the database
      async function generateUniqueOrderId() {
         let orderId;
         let isUnique = false;

         // Loop until we find a unique orderId
         while (!isUnique) {
            orderId = generateOrderId();
            isUnique = await isOrderIdUnique(orderId);
         }

         return orderId;
      }



      const orderData = {
         userId,
         supplementCartId: supCartId,
         addressId,
         deliveryAmount,
         discountedAmount: discount,
         totalAmount,
         promoCodeId,
         deliveryOption,
         paymentMethod: paymentMethod,
         paymentId: paymentId,
         anySuggestion: anySuggestion || '',
         status: 1,
         orderId: await generateUniqueOrderId()
      };

      const newOrder = new SupplementOrderModel(orderData);
      const orderCreated = await newOrder.save();


      if (orderCreated) {
         const updateCartData = await SupplementCartModel.findByIdAndUpdate(supCartId,
            { $set: { status: 0 } },
            { new: true }
         )
         console.log(`Cart "${updateCartData._id}" removed from user side `)
      }

      //await OrderDeliveryModel.create({orderId : newOrder._id, restId : cart.restId})
      return res.status(201).json({ success: true, message: 'Order created successfully', data: orderData });
   } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
   }
};

export const getOrderById = async (req, res) => {
   try {
      const { id } = req.params;
      let order = await SupplementOrderModel.findById(id)
         .populate('userId')
         .populate({
            path: 'supplementCartId',
            populate: [
               {
                  path: 'supplementSeller',
               },
               {
                  path: 'items.itemId',
                  model: 'Supplement',
                  select: 'name stock images'
               },
               {
                  path: 'bundles.bundleId',
                  model: 'SupplementPkg',
                  // select: 'name'
               }
            ],
         })
         .populate('addressId')
         .populate({
            path: 'orderRating',
            populate: [
               {
                  path: 'itemRatings.itemId',
                  select: "name"
               }
            ]
         });

      if (!order) {
         return res.status(404).json({ status: false, message: 'Order not found', data: {} });
      }

      order = order.toJSON();
      if (order && order.supplementCartId) {
         order.supplementCartId.items.forEach((item) => {
            if (item.itemId && item.stockId) {
               const stockDetails = item.itemId.stock.find(
                  (stock) => stock._id.toString() === item.stockId.toString()
               );
               console.log(stockDetails);
               item.itemId.stock = stockDetails || {};
            }
         });
      }

      let deliveryData = await SupplementOrderDeliveryModel.findOne({ orderId: new mongoose.Types.ObjectId(id) })
         .populate({
            path: 'deliveryBoyId',
            select: 'name countryCode mobileNumber profileImage location rating'
         })

      if (deliveryData && deliveryData.deliveryBoyId) {
         let orders = await SupplementOrderDeliveryModel.find({ deliveryBoyId: deliveryData.deliveryBoyId._id, deliveryBoyRating: { $ne: 0 } });
         let averageRating = 0
         if (orders.length > 0) {
            let totalRating = orders.reduce((sum, order) => sum + order.deliveryBoyRating ? order.deliveryBoyRating : 0, 0);
            averageRating = totalRating / orders.length;
         }

         deliveryData.deliveryBoyRating = averageRating;
      }

      const response = {
         ...order,
         // rating: orderRating ? orderRating : {},
         deliveryData: deliveryData ? deliveryData : null
      };
      return res.status(200).json({ status: true, message: "Order Data", data: response });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getOrdersByUserId = async (req, res) => {
   try {
      const { filterBy } = req.params;
      const userId = req.userData._id
      // const { accesstoken } = req.headers;

      // let user = await UserModel.findOne({ accessToken: accesstoken });

      // if (user === null || user._id.toString() !== userId) {
      //    return res.status(404).json({ message: 'Invalid User ID or expired access Token' });
      // }

      // const validFilters = ["scheduled",
      //  "ongoing",
      //  "past","all",""];

      // if (!validFilters.includes(filterBy)) {
      //    return res.status(400).json({ message: 'filterBy is required' });
      // }

      const baseMatch = { userId: new mongoose.Types.ObjectId(userId), isDeleted: false };

      // Adjust $match based on the filter
      switch (filterBy) {
         case "ongoing":
            baseMatch.status = { $nin: [status.PENDING, status.DELIVERED, status.CANCEL] };
            break;
         case "past":
            baseMatch.status = { $in: [status.DELIVERED, status.CANCEL] };
            break;
      }

      // Build the aggregation pipeline
      const pipeline = [
         { $match: baseMatch },
         {
            $lookup: {
               from: 'supplementCarts',
               localField: 'supplementCartId',
               foreignField: '_id',
               as: 'supplementCartId',
            },
         },
         { $unwind: '$supplementCartId' },
         {
            $lookup: {
               from: 'addresses',
               localField: 'addressId',
               foreignField: '_id',
               as: 'addressId',
            },
         },
         { $unwind: '$addressId' },
         {
            $lookup: {
               from: 'SupplementSeller',
               localField: 'supplementCartId.supplementSeller',
               foreignField: '_id',
               as: 'SupplementSeller',
            },
         },
         { $unwind: '$SupplementSeller' },
         {
            $lookup: {
               from: 'SupplementOrderRating',
               localField: 'orderRating',
               foreignField: '_id',
               as: 'orderRating',
            },
         },
         {
            $unwind: {
               path: '$orderRating',
               preserveNullAndEmptyArrays: true, // This will keep documents without a matching rating
            },
         },
         {
            $group: {
               _id: '$_id', // Group by the main document ID
               userId: { $first: '$userId' },
               supplementCartId: { $first: '$supplementCartId' },
               addressId: { $first: '$addressId' },
               orderId: { $first: '$orderId' },
               totalItemAmount: { $first: '$totalItemAmount' },
               deliveryAmount: { $first: '$deliveryAmount' },
               totalAmount: { $first: '$totalAmount' },
               discountedAmount: { $first: '$discountedAmount' },
               promoCodeId: { $first: '$promoCodeId' },
               paymentMethod: { $first: '$paymentMethod' },
               paymentId: { $first: '$paymentId' },
               anySuggestion: { $first: '$anySuggestion' },
               status: { $first: '$status' },
               deliveryOption: { $first: '$deliveryOption' },
               isDeleted: { $first: '$isDeleted' },
               cancellationReason: { $first: '$cancellationReason' },
               cancellationDate: { $first: '$cancellationDate' },
               createdAt: { $first: '$createdAt' },
               updatedAt: { $first: '$updatedAt' },
               SupplementSeller: { $first: '$SupplementSeller' },
               orderRating: { $first: '$orderRating' }, // Make sure to include the modified rating
            },
         },
         //      {
         //       $addFields: {
         //           'rating.items': {
         //               $cond: {
         //                   if: { $isArray: '$rating.items' },
         //                   then: '$rating.items',
         //                   else: [],
         //               },
         //           },
         //       },
         //   },
         { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      ];


      let orders = await SupplementOrderModel.aggregate(pipeline);

      if (orders.length === 0) {
         return res.status(200).json({ status: true, message: 'No orders found for this user', data: [] });
      } else {
         orders = orders.map(o => {
            return {
               ...o,
               orderRating: o.orderRating === null ? { itemRatings: [] } : o.orderRating
            }
         })
         return res.status(200).json({ status: true, message: "Orders Fetched succesfully", data: orders });
      }
   } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
   }
};

export const cancelOrder = async (req, res) => {
   const { orderId } = req.params;
   const { cancellationReason } = req.body;

   try {
      if (!cancellationReason || cancellationReason.trim() === '') {
         return res.status(400).json({ message: 'Cancellation reason is required' });
      }

      const order = await SupplementOrderModel.findOne({ _id: orderId, userId: req.userData._id });
      if (!order) {
         return res.status(404).json({ message: 'Order not found' });
      }

      // Check if the order is already canceled
      if (order.status === 5) {
         return res.status(400).json({ message: 'Order is already canceled' });
      }
      order.status = 5
      //order.isDeleted = true;
      order.cancellationReason = cancellationReason;
      order.cancellationDate = new Date();

      await order.save();

      res.status(200).json({ status: true, message: 'Order canceled successfully', data: {} });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const rateOrder = async (req, res) => {
   try {
      const userId = req.userData._id
      const { orderId, sellerRating = 0, sellerReview = '', deliveryRating = 0, deliveryReview = '', itemRatings = [] } = req.body;

      let userOrder = await SupplementOrderModel.findById(orderId)
         .populate('userId')
         .populate({
            path: 'supplementCartId',
            populate: [
               {
                  path: 'supplementSeller',
                  select: "_id"
               },
               {
                  path: 'items.itemId',
                  model: 'Supplement',
                  select: 'name stock images'
               },
               {
                  path: 'bundles.bundleId',
                  model: 'SupplementPkg',
                  // select: 'name'
               }
            ],
         })
         .populate('addressId');
      if (!userOrder) {
         return res.status(404).json({ message: 'Order not found or does not belong to you' });
      }

      const supplementSellerId = userOrder.supplementCartId.supplementSeller._id;

      // Check if the items and bundles in the rating exist in the order
      // for (let itemRating of itemRatings) {
      //    const item = userOrder.supplementCartId.items.find(i => i.itemId._id.toString() === itemRating.itemId);
      //    if (!item) {
      //       return res.status(400).json({ message: `Item with ID ${itemRating.itemId} not found in this order.` });
      //    }
      // }

      let existingRating = await commonService.findOne(SUPPLEMENT_ORDER_RATING_MODEL, {
         orderId: new mongoose.Types.ObjectId(orderId),
         userId,
      });
      let rating = {};
      if (existingRating) {
         existingRating.sellerRating = sellerRating;
         existingRating.sellerReview = sellerReview;
         existingRating.deliveryRating = deliveryRating;
         existingRating.deliveryReview = deliveryReview;
         existingRating.itemRatings = itemRatings;
         existingRating.updatedAt = new Date().getTime();

         rating = await commonService.findOneAndUpdate(SUPPLEMENT_ORDER_RATING_MODEL, existingRating._id, existingRating);
      } else {
         const newRating = {
            orderId: new mongoose.Types.ObjectId(orderId),
            userId,
            supplementSellerId: new mongoose.Types.ObjectId(supplementSellerId),
            sellerRating,
            sellerReview,
            deliveryRating,
            deliveryReview,
            itemRatings,
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
         };

         rating = await commonService.create(SUPPLEMENT_ORDER_RATING_MODEL, newRating);
      }

      // Update SupplementSeller reviews and averageRating only if sellerRating > 0
      if (sellerRating) {
         const seller = await SupplementSellerModel.findById(supplementSellerId);
         if (seller) {
            const existingReviewIndex = seller.reviews.findIndex(r => r.userId.toString() === userId.toString());
            if (existingReviewIndex >= 0) {
               seller.reviews[existingReviewIndex].rating = sellerRating;
               seller.reviews[existingReviewIndex].review = sellerReview;
               seller.reviews[existingReviewIndex].createdAt = new Date().getTime();
            } else {
               seller.reviews.push({
                  rating: sellerRating,
                  review: sellerReview,
                  userId,
                  createdAt: new Date().getTime(),
               });
            }

            // Recalculate averageRating
            seller.averageRating =
               seller.reviews.reduce((sum, r) => sum + r.rating, 0) / seller.reviews.length;

            if (!["Fully Rejected", "Document Rejected"].includes(seller.rejected_reason.rejectedBy)) {
               seller.rejected_reason.rejectedBy = null;
            }
            await seller.save();
         }
      }

      // Update Supplement model
      for (let itemRating of itemRatings) {
         // Update reviews array only if rating > 0
         if (itemRating.rating) {
            const item = await SupplementModel.findById(itemRating.itemId);
            if (item) {
               const existingReviewIndex = item.reviews.findIndex(r => r.userId.toString() === userId.toString());
               if (existingReviewIndex >= 0) {
                  item.reviews[existingReviewIndex].rating = itemRating.rating;
                  item.reviews[existingReviewIndex].review = itemRating.review || '';
                  item.reviews[existingReviewIndex].createdAt = new Date().getTime();
               } else {
                  item.reviews.push({
                     rating: itemRating.rating,
                     review: itemRating.review || '',
                     userId,
                     createdAt: new Date().getTime(),
                  });
               }

               // Recalculate averageRating
               item.averageRating =
                  item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length;

               await item.save();
            }
         }
      }

      if (deliveryRating) {
         await SupplementOrderDeliveryModel.findOneAndUpdate({ orderId }, { deliveryBoyRating: Number(deliveryRating), driverReview: deliveryReview })
      }

      await SupplementOrderModel.findByIdAndUpdate(orderId, { orderRating: rating._id });

      return sendSuccessResponse(res, rating, 'Rating submitted successfully', 200);
   } catch (error) {
      console.error('Error rating order:', error);
      res.status(500).json({ message: error.message });
   }
};

export const getOrderRating = async (req, res) => {
   try {
      const { orderId } = req.params;

      const rating = await SUPPLEMENT_ORDER_RATING_MODEL.findOne({ orderId })
         .populate({
            path: 'itemRatings.itemId',
            select: 'name'
         })
      if (!rating) {
         return res.status(404).json({ message: 'Rating not found' });
      }

      return sendSuccessResponse(res, rating, 'Rating fetched successfully', 200);
   } catch (error) {
      console.error('Error rating order:', error);
      res.status(500).json({ message: error.message });
   }
};

export const getOrderProducts = async (req, res) => {
   try {
      const { id } = req.params;
      let order = await SupplementOrderModel.findById(id)
         .populate('userId')
         .populate({
            path: 'supplementCartId',
            populate: [
               {
                  path: 'supplementSeller',
               },
               {
                  path: 'items.itemId',
                  model: 'Supplement',
                  select: 'name stock images'
               },
               {
                  path: 'bundles.bundleId',
                  model: 'SupplementPkg',
                  // select: 'name'
                  populate: {
                     path: 'products._id',
                     model: 'Supplement',
                     select: 'name',
                  },
               }
            ],
         })

      if (!order) {
         return res.status(404).json({ message: 'Order not found' });
      }

      // Extract products from `items`
      let itemsProducts = [];
      if (order.supplementCartId.items.length > 0) {
         itemsProducts = order.supplementCartId.items.map(item => ({
            _id: item.itemId._id,
            name: item.itemId.name,
         }));
      }

      // Extract products from `bundles`
      let bundlesProducts = [];
      if (order.supplementCartId.bundles.length > 0) {
         bundlesProducts = order.supplementCartId.bundles.flatMap(bundle =>
            bundle.bundleId.products.map(product => ({
               _id: product._id._id,
               name: product._id.name,
            }))
         );
      }

      const allProducts = [...itemsProducts, ...bundlesProducts];

      const uniqueProducts = allProducts.filter(
         (product, index, self) =>
            index === self.findIndex((p) => p._id === product._id)
      );

      return sendSuccessResponse(res, uniqueProducts, 'Order products fetched successfully', 200);
   } catch (error) {
      console.error('Error rating order:', error);
      res.status(500).json({ message: error.message });
   }
};
