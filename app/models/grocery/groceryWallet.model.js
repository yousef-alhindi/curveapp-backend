const mongoose = require('mongoose');
const { walletStatus } = require('../../constants/wallet.constants');

const groceryWalletSchema = new mongoose.Schema(
   {
      groceryId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Grocery',
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
      collection: 'GroceryWallet',
      versionKey: false,
      timestamps: true,
   }
);

exports.GroceryWalletModel = mongoose.model('GroceryWallet', groceryWalletSchema);
