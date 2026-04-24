import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
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
      email: {
         type: String,
         default: '',
      },
      dob: {
         type: String,
         default: () => new Date().getTime(),
      },
      gender: {
         type: Number,
         default: 0, // 1 - Male, 2 - Female, 3 - Other
      },
      location: {
         type: { type: String, default: 'Point' },
         coordinates: [Number],
      },
      vechileDetails: {
         vechileName: {
            type: String,
            default: '',
         },
         RegistrationCertificateFront: {
            type: String,
            default: '',
         },
         RegistrationCertificateBack: {
            type: String,
            default: '',
         },
         drivingLicenseFront: {
            type: String,
            default: '',
         },
         drivingLicenseBack: {
            type: String,
            default: '',
         },
         imageFront: {
            type: String,
            default: '',
         },
         imageBack: {
            type: String,
            default: '',
         },
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
      },
      documents: {
         idProofFront: {
            type: String,
            default: '',
         },
         idProofBack: {
            type: String,
            default: '',
         },
         policeBackground: {
            type: String,
            default: '',
         },
      },
      isSmoke: {
         type: Number,
         default: 0,
         enum: [0, 1], // 0- not smoke 1- smoke
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
      password: {
         type: String,
         default: null,
      },
      isOtpVerified: {
         type: Boolean,
         default: false,
      },
      isDocumentsUploaded: {
         type: Boolean,
         default: false,
      },
      isVechileDocUploaded: {
         type: Boolean,
         default: false,
      },
      isBankDetailsUpdated: {
         type: Boolean,
         default: false,
      },
      isBlocked: {
         type: Boolean,
         default: false,
      },
      fullyVerify: {
         type: Number,
         default: 0,
         enum: [0, 1, 2, 3], //0-pending  1 - verify  2 -fullly reject  3- Document reject
      },
      isLocationDetails: {
         type: Boolean,
         default: false,
      },
      isDelivery: {
         type: Boolean,
         default: false,
      },
      isPickUp: {
         type: Boolean,
         default: false,
      },
      deviceType: {
         type: Number,
         default: 1,
         enum: [1, 2, 3], //1-android //2-ios //3-web
      },
      deviceToken: {
         type: String,
         default: '',
      },
      accessToken: {
         type: String,
         default: '',
      },
      status: {
         type: Boolean,
         default: true,
      },
      rejected_reason: {
         type: String,
         default: '',
      },
      language: {
         type: String,
         default: 'en',
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
      rating: {
         type: Number,
         default: 0,
     },
   },
   {
      strict: true,
      collection: 'Delivery',
      versionKey: false,
      timestamps: true,
   }
);

deliverySchema.index({
   location: '2dsphere',
});

exports.Delivery_Model = mongoose.model('Delivery', deliverySchema);
