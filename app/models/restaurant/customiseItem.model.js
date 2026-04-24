const { default: mongoose } = require("mongoose");

const customiseItemSchema = new mongoose.Schema(
   {
      menuId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'MenuItem',
      },
      name: {
         type: String,
         default: '',
      },
      price: {
         type: Number,
         default: 0,
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
      collection: 'CustomiseItem',
      versionKey: false,
      timestamps: true,
   }
);

exports.CustomiseItemModel = mongoose.model('CustomiseItem', customiseItemSchema);
