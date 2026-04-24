import AddressModel from '../../models/user/address.model';
const mongoose = require('mongoose'); // mongoose database

// Get all addresses
export const getAddresses = async (req, res) => {
   try {
      const addresses = await AddressModel.find({ userId: req.userData._id, isDeleted: false });
      return res.status(200).json({ status:true, data: addresses });
   } catch (error) {
      return res.status(500).json({ status:false, error: 'Error fetching addresses' });
   }
};

// Get all addresses for a specific user
export const getUserAddresses = async (req, res) => {
   try {

      const id = req.params.id; // Get userId from req.params
      const addresses = await AddressModel.findById(id)

      if (!addresses) {
         return res.status(404).json({ message: 'No addresses found for this user' });
      }

      return res.status(200).json({
         status:true,
         message:"Addressed fetch successfully",
         data: addresses
      });
   } catch (error) {
      return res.status(500).json({ status:false, error: 'Error fetching addresses' });
   }
};


export const createAddress = async (req, res) => {
   try {
      const { lat, long, address, houseNo, buildingName, landmarkName, addressLabel, remark } = req.body;
      const newAddress = new AddressModel({
         userId: req.userData._id,
         location: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)],
         },
         address,
         houseNo,
         buildingName,
         landmarkName,
         addressLabel,
         remark,
      });
      await newAddress.save();

      return res.status(201).json({ status:true, message: 'Address created successfully', data: newAddress });
   } catch (error) {
      console.log(error);
      return res.status(500).json({ status:false, error: 'Error creating address' });
   }
};

export const updateAddress = async (req, res) => {
   try {
      const { addressId, lat, long, address, houseNo, buildingName, landmarkName, addressLabel, remark } = req.body;

      const location = {
         type: 'Point',
         coordinates: [parseFloat(long), parseFloat(lat)], 
      };

      const updatedAddress = await AddressModel.findByIdAndUpdate(
         addressId,
         {
            $set: {
               location,  
               address,
               houseNo,
               buildingName,
               landmarkName,
               addressLabel,
               remark,
            },
         },
         { new: true } 
      );

      if (!updatedAddress) {
         return res.status(404).json({ success: false, message: 'Address not found' });
      }
      return res.status(200).json({ success: true, message: 'Address updated successfully', data: updatedAddress });
   } catch (error) {
      return res.status(500).json({ error: 'Error updating address' });
   }
};

export const deleteAddress = async (req, res) => {
   try {
      const { addressId } = req.body;
      const deletedAddress = await AddressModel.findOneAndUpdate(
         { _id: addressId, userId: req.userData._id },
         { isDeleted: true },
         { new: true }
      );
      if (!deletedAddress) return res.status(404).json({ message: 'Address not found' });

      return res.status(200).json({ message: 'Address deleted successfully', data: {} });
   } catch (error) {
      return res.status(500).json({ error: 'Error deleting address' });
   }
};
