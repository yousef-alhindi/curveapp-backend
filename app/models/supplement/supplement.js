const mongoose = require('mongoose');
const { Schema } = mongoose;

const supplementSchema = new mongoose.Schema(
   {
      supplementSeller: {
         type: Schema.Types.ObjectId,
         ref: 'SupplementSeller'
      },
      type: {
         type: String,
         enum: ['Weight Gain', 'Weight Loss'],
      },
      name: {
         type: String,
         default: '',
      },
      brandName: {
         type: String,
         default: '',
      },
      stock: [
         {
            size: {
               type: Number,
               default: 0
            },
            quantity: {
               type: Number,   // in Kg
               default: 0
            },
            mrp: {
               type: Number,
               default: 0
            },
            sellingPrice: {
               type: Number,
               default: 0
            },
            isActive: {
               type: Boolean,
               default: true,
            },
         }
      ],
      description: {
         type: String,
         default: '',
      },
      images: [],
      isBlocked: {
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
      isDeleted: {
         type: Boolean,
         default: false,
      },
      reviews: [
         {
            rating: { type: Number, min: 0, max: 5, default: 0 },
            review: { type: String, trim: true, default: "" },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            createdAt: { type: Number, default: () => new Date().getTime() }
         }
      ],
      averageRating: {
         type: Number,
         default: 0
      }
   },
   {
      strict: true,
      collection: 'Supplement',
      versionKey: false,
      timestamps: true,
   }
);

supplementSchema.index({
   location: '2dsphere',
});

exports.SupplementModel = mongoose.model('Supplement', supplementSchema);
