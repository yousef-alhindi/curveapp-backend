const mongoose = require('mongoose');
const { ServiceType } = require('../../constants/service.constants');
const { Schema } = mongoose;

const deliveryFareSchema = new Schema(
   {
      service: {
         type: Number,
         default: 1,
         enum: Object.values(ServiceType),
      },
      baseFare: {
         type: Number,
         default: 0
      },
      perKmFare: {
         type: Number,
         default: 0
      },
      freeDeliveryApplicable: {
         type: Number,
         default: 0
      },
      status: {
         type: Boolean,
         default: true,
      },
      isDeleted: {
         type: Boolean,
         default: false
      },
   },
   {
      strict: true,
      collection: 'deliveryFare',
      timestamps: true,
      versionKey: false,
   }
);

exports.DeliveryFare_Model = mongoose.model('deliveryFare', deliveryFareSchema);
