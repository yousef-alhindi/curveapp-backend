import mongoose from 'mongoose';

const restDeliverySchema = new mongoose.Schema(
   {
      restId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Restaurant',
      },
      type: {
         type: Number,
         default: 1,
      },
      deliveryCharge: {
         type: Number,
         default: 0,
      },
      minOrderToFree: {
         type: Number,
         default: 0,
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
      collection: 'restDeliveryCharge',
      versionKey: false,
      timestamps: true,
   }
);

exports.RestDeliveryModel = mongoose.model('restDeliveryCharge', restDeliverySchema);
