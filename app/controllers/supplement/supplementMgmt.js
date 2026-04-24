import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { SupplementModel } from '../../models/supplement/supplement';
import mongoose from 'mongoose';

export const addSupplement = async (req, res) => {
    try{
      let { type, name , brandName, stock , description , images } = req.body;
      //stock = [{size , quantity, mrp, sellingPrice}]
      let {_id} = req.supplementData;

      const requiredFields = ['type', 'name', 'brandName', 'stock'];

      const missingFields = requiredFields.filter(field => !req.body[field] || (req.body[field].length < 1) );

      if (missingFields.length > 0) {
      return sendErrorResponse(res, `Missing Fields: ${missingFields.join(', ')}`, HttpStatus.CONFLICT);
      }

      const seenSizes = new Set();

      for (let item of stock) {
         if (seenSizes.has(item.size)) {
            throw new Error(`Duplicate size found: ${item.size}`);
         }
         seenSizes.add(item.size);
      }

      console.log("No duplicate sizes found.");

      let lowerCaseName = name.toLowerCase();
      let lowerCasebBrandName = brandName.toLowerCase();
      let existedSupplement = await SupplementModel.findOne({supplementSeller :_id, name : lowerCaseName, brandName : lowerCasebBrandName}).lean();
      if(existedSupplement){
         // const sizeExists = existedSupplement.stock.some(item => item.size === req.body.size);
         // if(!sizeExists){
         //    existedSupplement.stock.push({size,quantity,mrp,sellingPrice})
         //    let updateSupplement = await existedSupplement.save();
         //    if(updateSupplement){
         //       return sendSuccessResponse(res, existedSupplement, success.SUCCESS, HttpStatus.OK)
         //    }else{
         //       return sendErrorResponse(res, `Something Went wrong while adding stock in existing Supplement`, HttpStatus.SOMETHING_WRONG);
         //    }
         // }else{
         //    return sendErrorResponse(res, `Supplement Already Added with size ${size}`, HttpStatus.CONFLICT);
         // }
         return sendErrorResponse(res, `Supplement Already Added with this name and brand name`, HttpStatus.CONFLICT);
      }else{
         let createSupplement = await SupplementModel.create({
            supplementSeller:_id,
            type,
            name : lowerCaseName,
            brandName : lowerCasebBrandName,
            stock :stock,
            description,
            images
         })

         if(createSupplement){
            return sendSuccessResponse(res, createSupplement, success.SUCCESS, HttpStatus.OK)
         }else{
            return sendErrorResponse(res, `Something Went wrong while adding Supplement`, HttpStatus.SOMETHING_WRONG);
         }
      }

    }catch (error) {
       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
 };

export const editSupplement = async (req,res) =>{
   try{
      let {supplementId,type, name , brandName, stock, description , images , isBlocked} = req.body;
      //stock = [{size , quantity, mrp, sellingPrice}]
      let existedSupplement = await SupplementModel.findById(supplementId).lean();
      if(!existedSupplement){
         return sendErrorResponse(res, `Invalid Supplement Id`, HttpStatus.CONFLICT);
      }
      if(name || brandName){
         const requiredFields = ['name', 'brandName'];
         const missingFields = requiredFields.filter(field => !req.body[field] || (req.body[field].length < 1) );
         if (missingFields.length > 0) {
         return sendErrorResponse(res, `Missing Fields: ${missingFields.join(', ')}`, HttpStatus.CONFLICT);
         }

         let lowerCaseName = name.toLowerCase();
         let lowerCasebBrandName = brandName.toLowerCase();
         let supplement = await SupplementModel.findOne({_id:{$ne:existedSupplement._id} ,name : lowerCaseName, brandName : lowerCasebBrandName}).lean();
         if(supplement){
            return sendErrorResponse(res, `Supplement Already Added with this name and brand Name`, HttpStatus.CONFLICT);
         }
         existedSupplement.name = name ? lowerCaseName :  existedSupplement.name
         existedSupplement.brandName = brandName ? lowerCasebBrandName :existedSupplement.brandName
      }
      existedSupplement.type = type ? type : existedSupplement.type ;
      existedSupplement.description = description ? description :  existedSupplement.description;
      existedSupplement.images = images ? images :existedSupplement.images;
      existedSupplement.isBlocked = isBlocked ? isBlocked :existedSupplement.isBlocked;

      const seenSizes = new Set();

      for (let item of stock) {
        if (seenSizes.has(item.size)) {
          throw new Error(`Duplicate size found: ${item.size}`);
        }
        seenSizes.add(item.size);
      }
      console.log("No duplicate sizes found.");
      existedSupplement.stock = stock ? stock :existedSupplement.stock;

      let updateSupplement = await SupplementModel.findByIdAndUpdate(
         existedSupplement._id,
         {$set:existedSupplement},
         {new:true}
      );
        
      if (updateSupplement) {
         return sendSuccessResponse(res, updateSupplement, success.UPDATED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, `Something went wrong while updating Supplement`, HttpStatus.SOMETHING_WRONG);
      }

   }catch(error){
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const viewSupplement = async (req,res) =>{
   try{
      let {supplementId} = req.params;

      let supplement = await SupplementModel.findById(supplementId).lean();
      if(!supplement){
         return sendErrorResponse(res, `Invalid Supplement Id`, HttpStatus.CONFLICT);
      }else{
         return sendSuccessResponse(res, supplement, success.SUCCESS, HttpStatus.OK);
      }
   }catch(error){
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const BlockSupplementStock = async (req, res) => {
   try {
      let { supplementId, stockId, isActive } = req.body;

      let supplement = await SupplementModel.findById(supplementId).lean();
      
      if (!supplement) {
         return sendErrorResponse(res, `Invalid Supplement Id`, HttpStatus.CONFLICT);
      } else {
         let updatedSupplement = await SupplementModel.findByIdAndUpdate(
            supplementId,
            {
               $set: {
                  "stock.$[elem].isActive": isActive,  // Update isActive for the matching stock item
               }
            },
            {
               arrayFilters: [{ "elem._id": stockId }],  // Apply the update to the stock item where the _id matches stockId
               new: true
            }
         );

         if (!updatedSupplement) {
            return sendErrorResponse(res, `Failed to block/unBlock supplement stock`, HttpStatus.SOMETHING_WRONG);
         }
         return sendSuccessResponse(res, updatedSupplement, success.SUCCESS, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getSupplementList = async (req,res)=>{
   try{
      let {_id} = req.supplementData;
      let {page = 1, pageSize = 10,search} = req.query;

        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query ={}

        if (search && search.length > 0) {
            query ={
                ...query,
                name: { $regex: `^${search}`, $options: 'i' } 
            }
        }

      let totalSupplemmentsCount =  await SupplementModel.countDocuments({...query,supplementSeller:new mongoose.Types.ObjectId(_id),isDeleted:false});
      let supplements =  await SupplementModel.find({...query,supplementSeller:new mongoose.Types.ObjectId(_id),isDeleted:false})
      .sort({createdAt:-1})
      .skip(skip) // Skip documents for pagination
      .limit(pageSize) // Limit the number of documents per page

      let data = {
         totalSupplemmentsCount,
         supplements
      }

      return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);

   }catch(error){
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const deleteSupplementList = async (req,res)=>{
   try{
      let {supId} = req.params

      let deleteSupplement = await SupplementModel.findByIdAndUpdate(
         supId,
         {$set:{isDeleted:true}},
         {new:true}
      )

      return sendSuccessResponse(res,supId , "Supplement Deleted Successfully", HttpStatus.OK);
   }catch(error){
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const blockSupplement = async (req,res) =>{
   try{
      let {supplementId,isBlocked} = req.body;

      let blockSupplement = await SupplementModel.findByIdAndUpdate(
         supplementId,
         {$set:{isBlocked:isBlocked}},
         {new:true}
      )

      return sendSuccessResponse(res,blockSupplement , "Supplement updated Successfully", HttpStatus.OK);
   }catch(error){
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}