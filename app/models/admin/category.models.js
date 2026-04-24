const mongoose = require('mongoose');
const { categoryStatus, logicType, sectionType } = require('../../constants/category.constants');
const { serviceType, variableCategory } = require('../../constants/common.constants');
const { joiningFeeType } = require('../../constants/offer.constants');

const categorySchema = new mongoose.Schema(
   {
      categoryName: {
         type: String,
         default: '',
      },
      description: {
         type: String,
         default: '',
      },
      status: {
         type: Number,
         enum: categoryStatus,
         default: categoryStatus.active,
      },
      // service: {
      //    type: String,
      //    enum: serviceType,
      //    default: '',
      // },
      service: {
         type: String,
         enum: [...Object.values(serviceType), ''],
         default: '',
      },
      category: {
         type: String,
         enum: variableCategory,
         default: '',
      },
      position: {
         type: Number,
      },
      foodPosition: {
         type: Number,
      },
      packagePosition: {
         type: Number,
      },
      gymPosition: {
         type: Number,
      },
      supplementPosition: {
         type: Number,
      },
      sectionType: {
         type: Number,
         enum: sectionType,
         default: sectionType.nonFix,
      },
      logicType: {
         type: Number,
         enum: logicType,
      },
      joiningFeeType: {
         type: Number,
         default: joiningFeeType.free, // 1 - Free , 2 Paid
         enum: joiningFeeType,
      },
      joinFee: {
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
         default: false,
      },
   },
   {
      strict: true,
      collection: 'Category',
      versionKey: false,
      timestamps: false,
   }
);
// categorySchema.pre('save', async function (next) {
//    try {
//       if (this.isNew) {
//          // Find the document with the highest position
//          const maxPositionDoc = await this.constructor.findOne().sort({ position: -1 }).exec();

//          // Set position based on the highest existing position
//          this.position = maxPositionDoc ? maxPositionDoc.position + 1 : 1;
//       }
//       next();
//    } catch (error) {
//       next(error);
//    }
// });

exports.CategoryModel = mongoose.model('Category', categorySchema);
