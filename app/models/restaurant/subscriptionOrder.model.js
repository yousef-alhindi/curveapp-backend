const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionOrderSchema = new Schema(
   {
      restId: {
         type: Schema.Types.ObjectId,
         ref: 'Restaurant',
      },
      subscriptionId: {
         type: Schema.Types.ObjectId,
         ref: 'Subscription',
      },
      subscriptionType: {
         type: Number,
         default: 1, // 1 month
      },
      paymentType: {
         type: String,
         default: '',
      },
      amount: {
         type: Number,
         default: 0,
      },
      currency: {
         type: String,
         default: 'INR',
      },
      orderId: {
         type: String,
         default: '',
      },
      transactionId: {
         type: String,
         default: '',
      },
      subscriptionExpired: {
         type: Date,
         default: '',
      },
      status: {
         type: Boolean,
         default: true,
      },
      createdAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
   },
   {
      timestamps: true,
      strict: true,
      collection: 'orderSubscription',
      versionKey: false,
   }
);

exports.Order_Subcription_Model = mongoose.model('orderSubscription', subscriptionOrderSchema);
