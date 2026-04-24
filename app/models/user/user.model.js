import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
   {
      countryCode: {
         type: String,
         default: '',
      },
      mobileNumber: {
         type: String,
         default: '',
      },
      fullName: {
         type: String,
         default: '',
      },
      gender: {
         type: Number,
         default: 0, // 1 - Male, 2 - Female, 3 - Other
      },
      height: {
         type: Number,
         default: 0, // in CM
      },
      weight: {
         type: Number,
         default: 0, // in KG
      },
      profileImage: {
         type: String,
         default: '',
      },
      dob: {
         type: String,
         default: 0,
      },
      // email: {
      //     type: String,
      //     default: "",
      // },

      isMobileVerified: {
         type: Boolean,
         default: false,
      },
      isProfileCompleted: {
         type: Boolean,
         default: false,
      },
      otp: {
         type: Number,
         default: 123456,
      },
      isBlocked: {
         type: Boolean,
         default: false,
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
      deviceType: {
         type: Number,
         default: 1, // 1 for Android, 2 for IOS, 3 for Web
      },
      deviceToken: {
         type: String,
         default: '',
      },
      location: {
         type: { type: String, default: 'Point' },
         coordinates: [Number],
      },
      accessToken: {
         type: String,
         default: null,
      },
      lastLogin: {
         type: Number,
         default: Date.now(),
      },
      socialType: {
         type: String,
         enum: [1, 2, 3],   //1->google, 2-->facebook,  3--->Apple
         default: null
      },
      uniqueId: {
         type: String,
         default: "",
         //require: true
      },
      referralCode: {
         type: String,
         unique: true,
      },
      referredBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null
      },
      referredTo: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null
      }],
      totalReferralCount: {
         type: Number,
         default: 0
      },
      loyaltyPoints: {
         type: Number,
         default: 0
      },
      createdAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
   },
   {
      strict: true,
      collection: 'User',
      versionKey: false,
   }
);

const UserModel = mongoose.model('User', userSchema);
export default UserModel;
