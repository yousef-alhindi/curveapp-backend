const mongoose = require('mongoose');
const { ServiceType } = require('../../constants/service.constants');
const { Schema } = mongoose;

const cmsSchema = new Schema(
   {
      service: {
         type: Number,
         default: 1,
         enum: Object.values(ServiceType),
      },
      type: {
         type: Number,
         enum: [1, 2, 3, 4],  // 1 : About Us || 2 : Terms & Condition || 3 : Privacy Policy || 4 Contact Us
      },
      description: {
         type: String,
         default: '',
      },
      contactDetail: {
         phoneNumber: { type: String, default: "" },
         countryCode: { type: String, default: "+44" },
         email: { type: String, default: "" },
       },
      status: {
         type: Boolean,
         default: true,
      },
      isDeleted: {
         type: Boolean,
         default: false
      },
   },
   {
      timestamps: true,
      versionKey: false,
   }
);

exports.cmsModel = mongoose.model('cms', cmsSchema);
