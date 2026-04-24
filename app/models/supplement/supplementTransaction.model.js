const mongoose = require('mongoose');
const { transactionType } = require('../../constants/wallet.constants');

const supplementTransactionSchema = new mongoose.Schema(
   {
      supplementId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'SupplementSeller',
         required: true,
      },
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         default: null,
      },
      amount: {
         type: Number,
         default: 0,
      },
      transactionId: {
         type: String,
         unique: true,
         required: true,
      },
      transactionType: {
         type: Number,
         enum: transactionType,
      },
      paymentFor: {
         type: Number,
         enum: [1, 2, 3,4], // after R&D 1 for wallet, 2 for Bid(join sponser), 3 for enrolled in offer banner , 4 for enrolled in category offer
         default: 1,
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
      collection: 'supplementTransaction',
      versionKey: false,
      timestamps: true,
   }
);

exports.SupplementTransactionModel = mongoose.model('supplementTransaction',supplementTransactionSchema);
