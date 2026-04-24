const mongoose = require('mongoose');
const { Schema } = mongoose;

const restaurentSponsorSchema = new Schema(
   {
      restId: {
         type: Schema.Types.ObjectId,
         ref: 'Restaurant'
      },
      amount: {
         type: Number,
         default: 0,
      },
      spendPerDayAmount: {
         type: Number,
         default: 0,
      },
      isActive: {
         type: Boolean,
         default: true
      },
      isBlocked: {
         type: Boolean,
         default: false
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
      createdAt: {
         type: Number,
         default: new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: new Date().getTime(),
      },
   },
   {
      timestamps: true,
      collection: 'restaurentSponsors',
      versionKey: false,
   }
);

exports.RESTAURENT_SPONSOR_MODEL = mongoose.model('restaurentSponsors', restaurentSponsorSchema);
