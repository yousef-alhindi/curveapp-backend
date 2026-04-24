import mongoose from 'mongoose';
const { addressLableType } = require('../../constants/address.constants');


const addressSchema = new mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },
      location: {
         type: { 
            type: String, 
            default: 'Point' 
         },
         coordinates: {
            type: [Number],
            required: false,
         },
      },
      address: {
         type: String,
         required: false,
      },
      houseNo: {
         type: String,
         required: false,
      },
      buildingName: {
         type: String,
      },
      landmarkName: {
         type: String,
         required: false,
      },
      addressLabel: {
         type: Number,
         default: 1,
         enum: Object.values(addressLableType),
      },
      remark: {
         type: String,
      },
      isDeleted: {
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
   }
);

const AddressModel = mongoose.model('Address', addressSchema);
export default AddressModel;
