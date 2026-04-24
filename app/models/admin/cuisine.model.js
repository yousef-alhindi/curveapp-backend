import mongoose from 'mongoose';

const RestaurantCuisineSchema = new mongoose.Schema(
   {
      cuisineName: {
         type: String,
         required: true,
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
      collection: 'Cuisine',
      versionKey: false,
      timestamps: false,
   }
);

exports.RestaurantCuisineModel = mongoose.model('Cuisine', RestaurantCuisineSchema);
