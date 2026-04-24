import mongoose, { Schema } from 'mongoose';
const { transactionType, paymentFor } = require('../../constants/wallet.constants');

const paymentByAdminSchema = new Schema(
   {
      paymentById: {
         type: mongoose.Types.ObjectId,
         ref: 'Admin',
         required: true,
      },
      restuarantId: {
         type: mongoose.Types.ObjectId,
         ref: 'Restaurant',
         default: null,
      },
      supplementSellerId: {
         type: mongoose.Types.ObjectId,
         ref: 'SupplementSeller',
         default: null,
      },
      driverId: {
         type: mongoose.Types.ObjectId,
         ref: 'Delivery',
         default: null,
      },
      gymId: {
         type: mongoose.Types.ObjectId,
         ref: 'Gym',
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
         default: transactionType.credit,
      },
      fromDate: {
         type: Number,
         default: () => new Date().getTime(),
      },
      toDate: {
         type: Number,
         default: () => new Date().getTime(),
      },
      paymentFor: {
         type: Number,
         enum: paymentFor,
         default: paymentFor.restuarent,
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
      collection: 'paymentByAdmin',
      versionKey: false,
      timestamps: true,
   }
);

exports.PaymentByAdminModel = mongoose.model('PaymentByAdmin', paymentByAdminSchema);
