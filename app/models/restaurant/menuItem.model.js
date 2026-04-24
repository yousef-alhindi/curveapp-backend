const { default: mongoose } = require("mongoose");

const menuitemSchema = new mongoose.Schema(
   {
      restId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Restaurant',
      },
      resCategoryId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'RestaurantCategory',
      },
      name: {
         type: String,
         default: '',
      },
      itemType: {
         type: Number,
         default: 1,
         enum: [1, 2], // 1- veg 2-nonveg
      },
      image: {
         type: String,
         default: '',
      },
      description: {
         type: String,
         default: '',
      },
      price: {
         type: Number,
         default: 0,
      },
      nutrition: {
         carbs: {
            type: Number,
            default: 0,
         },
         calories: {
            type: Number,
            default: 0,
         },
         protein: {
            type: Number,
            default: 0,
         },
         fat: {
            type: Number,
            default: 0,
         },
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
      collection: 'MenuItem',
      versionKey: false,
      timestamps: true,
   }
);

exports.menuItemModel = mongoose.model('MenuItem', menuitemSchema);
