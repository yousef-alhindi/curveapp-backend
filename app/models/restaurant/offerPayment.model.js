const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerPaymentSchema = new Schema(
   {
      restId: {
         type: Schema.Types.ObjectId,
         ref: 'Restaurant',
      },
      offerId: {
         type: Schema.Types.ObjectId,
         ref: 'Offers',
      },
      userId: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         default: null
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
      status: {
         type: Boolean,
         default: true,
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
      timestamps: true,
      strict: true,
      collection: 'offerPayments',
      versionKey: false,
   }
);

exports.Offer_Payment_Model = mongoose.model('offerPayments', offerPaymentSchema);
