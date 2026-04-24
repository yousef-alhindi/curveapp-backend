import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         default: '',
      },
      duration: {
         type: Number,
         default: 1, // In Month
      },
      description: {
         type: String,
         default: '',
      },
      price: {
         type: Number,
         default: 0,
      },
      termAndCond: {
         type: String,
         default: '',
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
         default: false
      },
   },
   {
      strict: true,
      collection: 'Subscription',
      versionKey: false,
      timestamps: false,
   }
);

exports.SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema);
