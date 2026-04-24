const mongoose = require("mongoose");
import { transactionType } from "../../constants/wallet.constants";
import { RestaurantTransactionModel } from "../../models/restaurant/restaurantTransaction.model";
import { RestaurantWalletModel } from "../../models/restaurant/restaurantWallet.model";
import { RESTAURENT_SPONSOR_MODEL } from "../../models/restaurant/restaurentSponsor.model";
const randomize = require('randomatic');

export const deductRestaurantBidAmountIfOfferBuy = async ({ userId, restId }) => {
    const orderOfferResp = await RESTAURENT_SPONSOR_MODEL.findOne({ isActive: true, restId: new mongoose.Types.ObjectId(restId), isBlocked: false })
    if (!orderOfferResp) return false

    const startDate = new Date()
    const endDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    const isAmountAlreadyDeductForUser = await RestaurantTransactionModel.findOne({
        restaurantId: new mongoose.Types.ObjectId(restId),
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
            $gte: startDate.getTime(),
            $lte: endDate.getTime(),
        }
    });

    if (!!isAmountAlreadyDeductForUser) {
        console.error(`this user is already paid amount for viewing the restaurant  userId- ${userId}`)
        return false
    }

    let wallet = await RestaurantWalletModel.findOne({ restaurantId: new mongoose.Types.ObjectId(restId) });
    if (!wallet) {
        console.error(`unable to find wallet for restaurant - ${restId}`)
        return false
    }

    if (orderOfferResp.amount > wallet.balance) {
        console.error(`You can't place bid now as you have ${wallet.balance} KD in wallet.`)
        return false
    }

    const totalAmount = await RestaurantTransactionModel.aggregate([
        {
            $match: {
                restaurantId: new mongoose.Types.ObjectId(restId),
                paymentFor: 2,
                createdAt: {
                    $gte: startDate.getTime(),
                    $lte: endDate.getTime(),
                }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]);

    const amount = totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;
    if (orderOfferResp.spendPerDayAmount != 0) {
        if (Number(amount + orderOfferResp.amount) > orderOfferResp.spendPerDayAmount) {
            console.error(`Restaurant spend per day limit is already exceed`)
            return false
        }
    }

    let transactionId = '#' + randomize('0', 9);
    await RestaurantTransactionModel.create({
        paymentFor: 2,
        userId: userId,
        amount: Number(orderOfferResp.amount),
        restaurantId: restId,
        transactionType: transactionType.debit,
        transactionId,
        createdAt: new Date().getTime()
    });
    
    let newBalance = Number(wallet?.balance) - Number(orderOfferResp.amount);
    await RestaurantWalletModel.findByIdAndUpdate(wallet._id, { balance: newBalance });

    if ((Number(amount + orderOfferResp.amount) > orderOfferResp.spendPerDayAmount) || (orderOfferResp.spendPerDayAmount > newBalance)) {
        await RESTAURENT_SPONSOR_MODEL.updateOne({ isActive: true, restId: new mongoose.Types.ObjectId(restId) }, { $set: { isActive: true, isBlocked: true } })
    }

    return true
}