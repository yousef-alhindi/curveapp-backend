const mongoose = require('mongoose');
const { walletStatus } = require('../../constants/wallet.constants');

const restaurantWalletSchema = new mongoose.Schema(
   {
      restaurantId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Restaurant',
      },
      balance: {
         type: Number,
         default: 0,
      },
      status: {
         type: Number,
         enum: walletStatus,
         default: walletStatus.active,
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
      createdAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
   },
   {
      strict: true,
      collection: 'restaurantWallet',
      versionKey: false,
      timestamps: true,
   }
);

exports.RestaurantWalletModel = mongoose.model('restaurantWallet', restaurantWalletSchema);
