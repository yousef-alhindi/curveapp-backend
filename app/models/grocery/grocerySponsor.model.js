const mongoose = require('mongoose');
const { Schema } = mongoose;

const grocerySponsorSchema = new Schema(
   {
      groceryId: {
         type: Schema.Types.ObjectId,
         ref: 'Grocery'
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
      collection: 'grocerySponsors',
      versionKey: false,
   }
);

exports.GROCERY_SPONSOR_MODEL = mongoose.model('grocerySponsors', grocerySponsorSchema);
