const mongoose = require('mongoose');
const { serviceType } = require('../../constants/common.constants');
const { Schema } = mongoose;

const sponsorSchema = new Schema(
   {
      service: {
         type: String,
         default: '',
         enum: [serviceType],
      },
      minimumBid: {
         type: Number,
         default: 0,
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
      timestamps: true,
      versionKey: false,
   }
);

exports.SPONSOR_MODEL = mongoose.model('sponsor', sponsorSchema);
