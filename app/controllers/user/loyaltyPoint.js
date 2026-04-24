import { LOYALTY_POINT_MODEL } from "../../models/admin/loyalityPoint.model";
import { sendSuccessResponse, sendErrorResponse } from "../../responses/response";
import OrderModel from "../../models/user/order.model";

// export const getLoyaltyPoints = async (req, res) => {
//    try {
//       const { orderId } = req.params; 

//       const orderData = await OrderModel.findById(orderId)
//          .select("userId restaurentCartId orderId orderType totalAmount");

//       if (!orderData) {
//          return sendErrorResponse(res, "Order not found", 404);
//       }

//       const loyaltyConfig = await LOYALTY_POINT_MODEL.findOne({ status: 1, isDeleted: false });
//       if (!loyaltyConfig) {
//          return sendErrorResponse(res, "Loyalty configuration not found", 404);
//       }

//       const { minOrderForCashback, cashbackPoints } = loyaltyConfig.loyaltyPoints;
//       const { perCashbackPointsValue } = loyaltyConfig;

//       let creditValue = 0;
//       let debitValue = 0;

//       if (orderData.totalAmount >= minOrderForCashback) {
//          creditValue = cashbackPoints;
//       } else {
//          debitValue = 0; 
//       }

//       //  cashback amount
//       const cashbackAmount = creditValue * perCashbackPointsValue;

//       return sendSuccessResponse(res, {
//          userId: orderData.userId,
//          orderId: orderData._id,
//          totalAmount: orderData.totalAmount,
//          creditValue,
//          debitValue,
//          cashbackAmount,
//       }, "Loyalty points calculated successfully", 200);
//    } catch (error) {
//       console.error(" Points Error:", error);
//       return sendErrorResponse(res, "Something went wrong", 500);
//    }
// };
export const getLoyaltyPoints = async (req, res) => {
   try {
      const { userId } = req.params;

      if (!userId) {
         return sendErrorResponse(res, "User ID is required", 400);
      }

      const userOrders = await OrderModel.find({
         userId,
         isDeleted: false,
         status: 4    // Delivered
      }).select("orderId totalAmount createdAt");

      if (!userOrders.length) {
         return sendSuccessResponse(
            res,
            { orders: [], totalCreditSum: 0, totalDebitSum: 0, balanceValue: 0 },
            "No delivered orders found for this user"
         );
      }

      const loyaltyConfig = await LOYALTY_POINT_MODEL.findOne({
         status: 1,
         isDeleted: false
      });

      if (!loyaltyConfig) {
         return sendErrorResponse(res, "Loyalty configuration not found", 404);
      }

      const { minOrderForCashback, cashbackPoints } = loyaltyConfig.loyaltyPoints;
      const { perCashbackPointsValue } = loyaltyConfig;

      let totalCreditSum = 0;
      let totalDebitSum = 0;

      const resultOrders = [];

      for (let order of userOrders) {
         const totalAmount = order.totalAmount;

         // Calculating cashback points
         const calculatedPoints = (totalAmount * cashbackPoints) / 100;

         let creditValue = 0;
         let debitValue = 0;

         // User gets credit only if amount meets minimum criteria
         if (totalAmount >= minOrderForCashback) {
            creditValue = calculatedPoints;
         } else {
            debitValue = calculatedPoints;
         }

         totalCreditSum += creditValue;
         totalDebitSum += debitValue;

         const cashbackAmount = creditValue * perCashbackPointsValue; // Only credit produces money

         resultOrders.push({
            orderId: order.orderId,
            totalAmount,
            cashbackPercentage: cashbackPoints,
            creditValue: Number(creditValue.toFixed(2)),
            debitValue: Number(debitValue.toFixed(2)),
            cashbackAmount: Number(cashbackAmount.toFixed(2)),
            createdAt: order.createdAt,
            //key to check status 
            credit: creditValue > 0,
            debit: debitValue > 0

         });
      }

      const balanceValue = totalCreditSum - totalDebitSum;

      return sendSuccessResponse(
         res,
         {
            orders: resultOrders,
            totalCreditSum: Number(totalCreditSum.toFixed(2)),
            totalDebitSum: Number(totalDebitSum.toFixed(2)),
            balanceValue: Number(balanceValue.toFixed(2))
         },
         "Loyalty points calculated successfully"
      );

   } catch (error) {
      console.error("Points Error:", error);
      return sendErrorResponse(res, "Something went wrong", 500);
   }
};

export const getReferralPoints = async (req, res) => {
   try {
      const data = await LOYALTY_POINT_MODEL.find()
         .select('loyaltyWelcomeBonus.referAndEarn loyaltyWelcomeBonus.cashbackPoints');
      return sendSuccessResponse(res, data, "Referral points fetched successfully")
   } catch (error) {
      console.error("Points Error:", error);
      return sendErrorResponse(res, "Something went wrong", 500);
   }
};



