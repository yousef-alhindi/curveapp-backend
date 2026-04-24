const mongoose = require('mongoose');

const supplementSellerSchema = new mongoose.Schema(
   {
      countryCode: {
         type: String,
         default: '',
      },
      mobileNumber: {
         type: String,
         default: null,
      },
      profileImage: {
         type: String,
         default: '',
      },
      otp: {
         type: Number,
         default: 123456,
      },
      name: {
         type: String,
         default: '',
      },
      ownerName: {
         type: String,
         default: '',
      },
      email: {
         type: String,
         default: '',
      },
      location: {
         type: { type: String, default: 'Point' },
         coordinates: [Number],
      },
      addressDetails: {
         address: {
            type: String,
            default: '',
         },
         street: {
            type: String,
            default: '',
         },
         building: {
            type: String,
            default: '',
         },
         postalCode: {
            type: String,
            default: '',
         },
         supLogo: {
            type: String,
            default: '',
         },
      },
      documents: {
         license: {
            type: String,
            default: '',
         },
         idProof: {
            type: String,
            default: '',
         },
         workingDays: [
            {
               type: String,
               emum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            },
         ],
         openingTime: {
            type: String,
            default: '',
         },
         closingTime: {
            type: String,
            default: '',
         },
      },
      bankDetails: {
         bankAccountNo: {
            type: String,
            default: '',
         },
         accHolderName: {
            type: String,
            default: '',
         },
         bankCode: {
            type: String,
            default: '',
         },
         bankName: {
            type: String,
            default: '',
         },
      },
      isBlocked: {
         type: Boolean,
         default: false,
      },
      isOtpVerified: {
         type: Boolean,
         default: false,
      },
      isDocumentsUploaded: {
         type: Boolean,
         default: false,
      },
      isBankDetailsUpdated: {
         type: Boolean,
         default: false,
      },
      profileCompletion: {
         type: Number,
         default: 0, // 1- verify Otp, 2 - Details added, 3 - Profile completed
      },
      isLocationDetails: {
         type: Boolean,
         default: false,
      },
      isDelivery: {
         type: Boolean,
         default: true,
      },
      isPickUp: {
         type: Boolean,
         default: true,
      },
      active: {
         type: Boolean,
         default: true,
      },
      supplementStatus: {
         type: Number,
         default: 0, // 0 for Pending, 1 for Accept, 2 for Reject
      },
      deviceType: {
         type: Number,
         default: 0,
         enum: [1, 2, 3],
      },
      deviceToken: {
         type: String,
         default: '',
      },
      accessToken: {
         type: String,
         default: '',
      },
      rejected_reason: {
         rejectedBy: {
            type: String,
            enum: ["Fully Rejected", "Document Rejected"],
            default: null,
         },
         reason: {
            type: String,
            default: null,
         },
      },
      colorCode: {
         type: String,
         default: '#33BDBC',
      },
      createdAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      SignUpByEmail: {
         type: Boolean,
         default: false
      },
      SignUpByPhone: {
         type: Boolean,
         default: false
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
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
   },
   {
      strict: true,
      collection: 'SupplementSeller',
      versionKey: false,
      timestamps: true,
   }
);

supplementSellerSchema.index({
   location: '2dsphere',
});

exports.SupplementSellerModel = mongoose.model('SupplementSeller', supplementSellerSchema);
