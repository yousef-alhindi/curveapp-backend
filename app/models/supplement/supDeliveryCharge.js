import mongoose from 'mongoose';

const supDeliverySchema = new mongoose.Schema(
   {
      supplementSeller: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'SupplementSeller',
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
      collection: 'supDeliveryCharge',
      versionKey: false,
      timestamps: true,
   }
);

exports.SupDeliveryModel = mongoose.model('supDeliveryCharge', supDeliverySchema);
