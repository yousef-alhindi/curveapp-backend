import mongoose from 'mongoose';
import { serviceType } from '../../constants/common.constants';
import {
   joiningFeeType,
   discountType,
   discountEligilityType,
} from '../../constants/offer.constants';

const OfferSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         default: '',
      },
      promoCode: {
         type: String,
         default: '',
      },
      isPromoCodeRequired: {
         type: Boolean,
         default: false,
      },
      joinFee: {
         type: Number,
         default: 0,
      },
      flatDiscountValue: {
         type: Number,
         default: 0,
      },
      percentDiscountValue: {
         type: Number,
         default: 0,
      },
      minimumOrderValue: {
         type: Number,
         default: 0,
      },
      service: {
         type: String,
         default: '',
         enum: serviceType,
      },
      joiningFeeType: {
         type: Number,
         default: joiningFeeType.free, // 1 - Free , 2 Paid
         enum: joiningFeeType,
      },
      discountType: {
         type: Number,
         default: discountType.flat, // 1 - Flat , 2 Percentage
         enum: discountType,
      },
      bogoValues: {
         buy: { type: Number, default: 0 },
         get: { type: Number, default: 0 },
      },
      discountUpto: {
         type: Number,
         default: 0,
      },
      startDate: {
         type: String,
         default: () => new Date().getTime(),
      },
      endDate: {
         type: String,
         default: () => new Date().getTime(),
      },
      eligibityCriteria: {
         type: Number,
         default: discountEligilityType.na, // 1 - First Order , 2 Every Order
         enum: discountEligilityType,
      },
      status: {
         type: Boolean,
         default: true,
      },
      termAndCondition: {
         type: String,
         default: '',
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
         default: false
      },
   },
   {
      strict: true,
      collection: 'Offers',
      versionKey: false,
      timestamps: false,
   }
);

exports.OfferModel = mongoose.model('Offers', OfferSchema);
