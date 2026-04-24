import mongoose from 'mongoose';
import { bannerType } from '../../constants/banner.constants';
import { serviceType } from '../../constants/common.constants';

const BannerSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         default: '',
      },
      bannerType: {
         type: Number,
         enum: bannerType,
         default: bannerType.na,
      },
      offerRef: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Offers',
      },
      service: {
         type: String,
         default: '',
         enum: serviceType,
      },
      image: {
         type: String,
         default: '',
      },
      colorCode: {
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
      collection: 'Banners',
      versionKey: false,
      timestamps: false,
   }
);

exports.BannerModel = mongoose.model('Banners', BannerSchema);
