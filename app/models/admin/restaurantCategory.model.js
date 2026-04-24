const mongoose = require('mongoose');

const RestaurantCategorySchema = new mongoose.Schema(
   {
      restId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Restaurant',
         required: true,
      },
      resCategory: {
         type: String,
         required: true,
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
      strict: true,
      collection: 'RestaurantCategory',
      versionKey: false,
      timestamps: false,
   }
);

exports.RestaurantCategoryModel = mongoose.model('RestaurantCategory', RestaurantCategorySchema);
