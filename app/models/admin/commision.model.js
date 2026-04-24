const mongoose = require('mongoose');
const { ServiceType, ServiceTypeForCommission } = require('../../constants/service.constants');
const { Schema } = mongoose;

const commissionSchema = new Schema(
   {
      service: {
         type: Number,
         default: 1,
         enum: Object.values(ServiceTypeForCommission),
      },
      percentage: {
         type: Number,
      },
      termAndCondition: {
         type: String,
         default: '',
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
      strict: true,
      collection: 'commission',
      timestamps: true,
      versionKey: false,
   }
);

exports.Commission_Model = mongoose.model('commission', commissionSchema);
