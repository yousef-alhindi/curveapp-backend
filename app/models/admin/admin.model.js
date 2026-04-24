import mongoose from 'mongoose';
const { modules } = require('../../constants/permission.constants')

const permissionSchema = new mongoose.Schema(
   {
     module: { type: String, required: true, enum: modules },
     permission: { type: String, required: true, enum: ['viewOnly', 'performAction'] },
   },
   { _id: false }  // This line prevents _id from being added to each permission
 );


const adminSchema = new mongoose.Schema(
   {
      fullName: {
         type: String,
         default: null,
      },
      email: {
         type: String,
         default: null,
      },
      countryCode: {
         type: String,
         default: null,
      },
      phoneNumber: {
         type: String,
         default: null,
      },
      address: {
         type: String,
         default: null,
      },
      password: {
         type: String,
         default: null,
      },
      otp: {
         type: Number,
         default: 1234,
      },
      role: {
         type: Number,
         default: 0, // 0 for Admin, 1 for subAdmin
      },
      permissions: [permissionSchema], //for sub admin only
      deviceToken: {
         type: String,
         default: null,
      },
      location: {
         type: { type: String, default: 'Point' },
         coordinates: [Number],
      },
      accessToken: {
         type: String,
         default: null,
      },
      isBlocked: {
         type: Boolean,
         default: false,
      },
      createdAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      updatedAt: {
         type: Number,
         default: () => new Date().getTime(),
      },
      lastLogin: {
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
      collection: 'Admin',
      versionKey: false,
   }
);

const AdminModel = mongoose.model('Admin', adminSchema);
export default AdminModel;
