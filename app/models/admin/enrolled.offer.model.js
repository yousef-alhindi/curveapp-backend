import mongoose from 'mongoose';
import { serviceType } from '../../constants/common.constants';

const EnrolledOfferSchema = new mongoose.Schema(
   {
      vendorRef: {
         type: mongoose.Schema.Types.ObjectId,
      },
      offerRef: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Offers',
         required: true,
      },
      service: {
         type: String,
         default: '',
         enum: serviceType,
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
      collection: 'EnrolledOffer',
      versionKey: false,
      timestamps: false,
   }
);

exports.EnrolledOfferModel = mongoose.model('EnrolledOffer', EnrolledOfferSchema);
