const mongoose = require('mongoose');
const { ServiceType } = require('../../constants/service.constants');
const { Schema } = mongoose;

const faqSchema = new Schema(
   {
      service: {
         type: Number,
         default: 1,
         enum: Object.values(ServiceType),
      },
      question: {
         type: String,
         default: '',
      },
      answer: {
         type: String,
         default: '',
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
      status: {
         type: Boolean,
         default: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   }
);

exports.FAQ_MODEL = mongoose.model('faqs', faqSchema);
