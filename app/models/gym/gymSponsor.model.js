const mongoose = require('mongoose');
const { Schema } = mongoose;

const gymSponsorSchema = new Schema(
   {
      gymId: {
         type: Schema.Types.ObjectId,
         ref: 'Gym'
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
      collection: 'gymSponsors',
      versionKey: false,
   }
);

exports.GYM_SPONSOR_MODEL = mongoose.model('gymSponsors', gymSponsorSchema);
