const mongoose = require('mongoose');
const { walletStatus } = require('../../constants/wallet.constants');

const supplementWalletSchema = new mongoose.Schema(
   {
      supplementId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'SupplementSeller',
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
      collection: 'supplementWallet',
      versionKey: false,
      timestamps: true,
   }
);

exports.SupplementWalletModel = mongoose.model('supplementWallet', supplementWalletSchema);
