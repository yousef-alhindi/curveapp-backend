const mongoose = require('mongoose');
const { walletStatus } = require('../../constants/wallet.constants');

const gymWalletSchema = new mongoose.Schema(
   {
      gymId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Gym',
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
      collection: 'gymWallet',
      versionKey: false,
      timestamps: true,
   }
);

exports.GymWalletModel = mongoose.model('gymWallet', gymWalletSchema);
