const mongoose = require('mongoose');
const { ServiceType } = require('../../constants/service.constants');
const { itemType } = require('../../constants/foodPackage.constants');
const { Schema } = mongoose;

const supportSchema = new Schema(
   {
      service: {
         type: Number,
         default: 1,
         enum: Object.values(ServiceType),
      },
      item: {
         type: Number,
         default: 1,
         enum: Object.values(itemType),
      },
      userId: {
         type: String,
         required: true,
      },
      ticketId: {
         type: String,
         default: '',
      },
      query: {
         type: String,
         default: '',
      },
      image: {
         type: String,
         default: '',
      },
      supportStatus: {
         type: Number,
         default: 1,
         enum: [1, 2, 3], //1 - pending 2- resolved 3-reject
      },
      status: {
         type: Boolean,
         default: true,
      },
      isDeleted: {
         type: Boolean,
         default: false
      },
      createdAt: {
         type: Number,
         default: new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: new Date().getTime(),
      },
   },
   {
      strict: true,
      collection: 'support',
      timestamps: true,
      versionKey: false,
   }
);

exports.SUPPORT_MODEL = mongoose.model('support', supportSchema);
