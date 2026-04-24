
import UserModel from "../../models/user/user.model.js";
import { RestaurantModel } from "../../models/restaurant/restaurant.model.js";
import { SupplementSellerModel } from '../../models/supplement/supplementSeller.model.js';
import { GymModel } from "../../models/gym/gym.model.js";
import { GroceryModel } from "../../models/grocery/grocery.model.js";
import { SubscriptionModel } from "../../models/admin/subscription.model.js";
import { Order_Subcription_Model } from "../../models/restaurant/subscriptionOrder.model.js";
import { GymPkgModel } from "../../models/gym/gymPkg.model.js";
import { GroceryTransactionModel } from "../../models/grocery/groceryTransaction.model.js";
import OrderModel from "../../models/user/order.model.js";
import { PackageFoodModel } from '../../models/admin/foodPackage.model';
import { RestaurantPackageModel } from "../../models/restaurant/restaurantPackage.js"
import SupplementOrderDeliveryModel from "../../models/delivery/supplementDeliveryModel.js"
import { OfferModel } from "../../models/admin/offer.model.js"
import SupplementOrderModel from "../../models/supplement/supplementOrder.model.js"
import { sendErrorResponse, sendSuccessResponse } from "../../responses/response.js";
import moment from "moment";

export const dashboard = async (req, res) => {
  try {
    const { from, to, filterType } = req.body;

    let startDate, endDate;

    if (from && to) {
      startDate = moment(from, "DD-MM-YYYY", true).startOf("day");
      endDate = moment(to, "DD-MM-YYYY", true).endOf("day");
    } else if (filterType) {
      switch (filterType) {
        case "today":
          startDate = moment().startOf("day");
          endDate = moment().endOf("day");
          break;
        case "thisWeek":
          startDate = moment().startOf("week");
          endDate = moment().endOf("week");
          break;
        case "thisMonth":
          startDate = moment().startOf("month");
          endDate = moment().endOf("month");
          break;
        default:
          return sendErrorResponse(res, "Invalid filter type", 400);
      }
    } else {
      startDate = moment("2001-01-01");
      endDate = moment();
    }

    const commonFilter = {
      createdAt: {
        $gte: startDate.valueOf(),
        $lte: endDate.valueOf(),
      },
      isDeleted: false
    };
    const createdAtFilter = {
      createdAt: {
        $gte: startDate.valueOf(),
        $lte: endDate.valueOf(),
      },
    };


    // 1. Registered Users
    const totalUsers = await UserModel.countDocuments(commonFilter);
    const activeUsers = await UserModel.countDocuments({ ...commonFilter, isBlocked: false });

    // 2. Registered restaurant
    const totalRestaurant = await RestaurantModel.countDocuments({ ...commonFilter, restaurantStatus: 1 });
    const activeRestaurant = await RestaurantModel.countDocuments({ ...commonFilter, isBlocked: false, restaurantStatus: 1 });

    //3. Supplement Seller 
    const totalSupplementSeller = await SupplementSellerModel.countDocuments({...commonFilter, supplementStatus: 1});

    //4. Gym 
    const totalGym = await GymModel.countDocuments({ ...commonFilter, gymStatus: 1 });

    //5. Grocery seller Filter
    const totalGrocery = await GroceryModel.countDocuments(commonFilter);

    //6.Subscribed Restro
    const totalSubscibedRestro = await Order_Subcription_Model.countDocuments(commonFilter);

    //7. total food order count
    const totalFoodOrder = await OrderModel.countDocuments({...commonFilter, status: { $in: [1, 2, 3] }});

    //8. total supplement order
    const totalorderSubscription = await SupplementOrderDeliveryModel.countDocuments({...commonFilter, accepted: true});

    //9. total Gym packages order
    const totalGymPackagesOrder = await GymPkgModel.countDocuments(commonFilter);

    //10. total packages created by admin
    const totalPackageByAdmin = await PackageFoodModel.countDocuments(commonFilter);

    //11. total packages created by restro
    const totalPackageByRestaurant = await RestaurantPackageModel.countDocuments(commonFilter);
    //12. total grocery order count
    const totalGroceryTransaction = await GroceryTransactionModel.countDocuments(commonFilter);

    ///////////////////////////////////REVENUE///////////////////////////////////////////////

    //1. Food Order revenue
    const foodOrderRevenue = await OrderModel.aggregate([
      { $match: { isDeleted: false } },
      { $match: { status: { $in: [1, 2, 3] }}},
      {
        $group: {
          _id: null,
          totalFoodOrderRevenue: { $sum: "$totalAmount" }
        }
      }

    ]);


    //2. Food Package revenue
    const foodPackageRevenue = await PackageFoodModel.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalFoodPackageRevenue: { $sum: "$price" }
        }
      }
    ]);

    //3. Restaurant subscription revenue
    const restaurantSubscriptionRevenue = await Order_Subcription_Model.aggregate([
      {
        $group: {
          _id: null,
          totalRestaurantSubscriptionRevenue: { $sum: "$amount" }
        }
      }
    ]);

    console.log(restaurantSubscriptionRevenue);


    //4. Gym package revenue
    const gymPackageRevenue = await GymPkgModel.aggregate([
      {
        $match: {
          isDeleted: false,
          isBlocked: false
        }
      },
      {
        $unwind: "$durations"
      },
      {
        $group: {
          _id: null,
          totalGymPackageRevenue: { $sum: "durations.$price" }
        }
      }
    ]);

    //5. Supplementry product revenue
    const supplementProductsRevenue = await SupplementOrderModel.aggregate([
      {
        $match: {
          isDeleted: false,
        }
      },
      {
        $group: {
          _id: null,
          totalSupplementProductsRevenue: { $sum: "$deliveryAmount" }
        }
      }
    ])
    //6. promo and offer joining revenue
    const promoAndOfferRevenue = await OfferModel.aggregate([
      {
        $match: {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalPromoAndOfferRevenue: { $sum: "$minimumOrderValue" }
        }
      }
    ]);

    //7. grocery order revenue

    const totalFoodOrderRevenue = foodOrderRevenue[0]?.totalFoodOrderRevenue || 0;
    const totalFoodPackageRevenue = foodPackageRevenue[0]?.totalFoodPackageRevenue || 0;
    const totalRestaurantSubscriptionRevenue = restaurantSubscriptionRevenue[0]?.totalRestaurantSubscriptionRevenue || 0;
    const totalGymPackageRevenue = gymPackageRevenue[0]?.totalGymPackageRevenue || 0;
    const totalPromoAndOfferRevenue = promoAndOfferRevenue[0]?.totalPromoAndOfferRevenue || 0;
    const totalSupplementProductsRevenue = supplementProductsRevenue[0]?.totalSupplementProductsRevenue || 0;

    return sendSuccessResponse(res, {
      totalUsers, activeUsers,
      totalRestaurant, activeRestaurant,
      totalSupplementSeller,
      totalGym,
      totalGrocery,
      totalSubscibedRestro,
      totalFoodOrder,
      totalorderSubscription,
      totalGymPackagesOrder,
      totalPackageByAdmin,
      totalPackageByRestaurant,
      totalGroceryTransaction,
      totalGymPackageRevenue, totalFoodOrderRevenue, totalFoodPackageRevenue,
      totalRestaurantSubscriptionRevenue,
      totalPromoAndOfferRevenue,
      totalSupplementProductsRevenue
    }, "Total dashboard response generated successfully", 200);
  } catch (error) {
    console.error("Dashboard Error:", error);
    return sendErrorResponse(res, "Something went wrong", 500);
  }
};


