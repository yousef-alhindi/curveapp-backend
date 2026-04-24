const mongoose = require('mongoose');
const { serviceType } = require('../../constants/common.constants');
const { Schema } = mongoose;

const loyaltySchema = new Schema(
   {
      service: {
         type: String,
         default: '',
         enum: [serviceType],
      },
      loyaltyPoints: {
         minOrderForCashback: {
            type: Number,
            default: 0
         },
         cashbackPoints: {
            type: Number,
            default: 0
         }
      },
      stepsForLoyaltyPoints: {
         dailySteps: {
            type: Number,
            default: 0
         },
         cashbackPoints: {
            type: Number,
            default: 0
         }
      },
      perCashbackPointsValue: {
         type: Number,
         required: true
      },
      spendingLimit: {
         minOrderValue: {
            type: Number,
            default: 0
         },
         maxRedeemLoyaltyPoints: {
            type: Number,
            default: 0
         }
      },
      loyaltyWelcomeBonus: {
         referAndEarn: {
            type: Boolean,
            default: false
         },
         cashbackPoints: {
            type: Number,
            default: 0
         }
      },
      status: {
         type: Number,
         default: 1  // 1 for active and 0 for inactive
      },
      orderData: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Order',
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
      timestamps: true,
      versionKey: false,
   }
);

exports.LOYALTY_POINT_MODEL = mongoose.model('LoyaltyPoint', loyaltySchema);
