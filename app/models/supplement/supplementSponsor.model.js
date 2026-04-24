const mongoose = require('mongoose');
const { Schema } = mongoose;

const supplementSponsorSchema = new Schema(
   {
      supplementId: {
         type: Schema.Types.ObjectId,
         ref: 'SupplementSeller'
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
      collection: 'supplementSponsors',
      versionKey: false,
   }
);

exports.SUPPLEMENT_SPONSOR_MODEL = mongoose.model('supplementSponsors', supplementSponsorSchema);
