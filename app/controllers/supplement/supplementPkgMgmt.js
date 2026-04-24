import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { SupplementModel } from '../../models/supplement/supplement';
import { SupplementPkgModel } from '../../models/supplement/supplementPkg.model';
import mongoose from 'mongoose';

export const addSupplementPkg = async (req, res) => {
    try{
      let { name , price , gender, products, description, type,image } = req.body;
      let {_id} = req.supplementData;

      const requiredFields = ['name', 'price', 'gender', 'description', 'products','type'];

      const missingFields = requiredFields.filter(field => !req.body[field] || (req.body[field].length < 1) );

      if (missingFields.length > 0) {
         return res.status(409).json({ message: `Missing Fields: ${missingFields.join(', ')}` });
      }

      let lowerCaseName = name.toLowerCase();
      let existedSupplementPkg = await SupplementPkgModel.findOne({supplementSeller:_id, name : lowerCaseName, isDeleted : false}).lean();
      if(existedSupplementPkg){
         return res.status(409).json({ message: `Supplement Package Already Existed` });
      }else{
         let createSupplementPkg = await SupplementPkgModel.create({
            supplementSeller:_id,
            name : lowerCaseName,
            price,
            gender,
            products,  // includes supplement id and stock id
            description,
            type,
            image
         })

         if(createSupplementPkg){
            return res.status(201).json({ status: true, message:" Supplement Package Added", data: createSupplementPkg});
         }else{
            return res.status(500).json({ message: 'Something Went wrong while adding Supplement' });
         }
      }

    }catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSupplementList = async (req,res)=>{
  try{
     let {_id} = req.supplementData;
     let {type} = req.query;

       let query ={}

       if (type && type.length > 0) {
           query ={
               ...query,
               type: { $regex: `^${type}`, $options: 'i' } 
           }
       }

     let supplements =  await SupplementModel.find({...query,supplementSeller:new mongoose.Types.ObjectId(_id),isDeleted:false})
     .sort({createdAt:-1})

     let data = {
        supplements
     }

     return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);

  }catch(error){
     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
  }
}

// export const supplementPkgList = async (req,res) =>{
//     try{
//         let {_id} = req.supplementData;
//         let {page = 1, limit = 10, search = '' } = req.query

//         limit = parseInt(limit);
//         page = parseInt(page);
//         let skipIndex = (page - 1) * limit;
//         let params = { supplementSeller: _id , isDeleted: false };

//         if (search != '' || search != undefined || search != null) {
//             params.name = { $regex: '.*' + search + '.*', $options: 'i' }
//         }
//         let count = await SupplementPkgModel.countDocuments(params);
//         let SupplementPkgList = await SupplementPkgModel.find(params)
//         .skip(skipIndex)
//         .limit(limit)
//         .lean();

//         if (SupplementPkgList.length > 0) {
//             const promises = SupplementPkgList.map(pkg => {
//                 return Promise.all(pkg.products.map(async (product) => {
//                     let productData = await SupplementModel.findOne({_id: product._id}).lean();
//                     if (!productData) {
//                         //return res.status(409).json({ message: '`Wrong supplement id' });
//                     }
        
//                     let filteredProductData = {
//                         name: productData.name,
//                         brandName: productData.brandName,
//                         description: productData.description,
//                         images: productData.images,
//                     };
        
//                     filteredProductData.stock = productData.stock.find(data => data._id.toString() === product.stockId.toString());
//                     product.productData = filteredProductData;
//                 }));
//             });
//             await Promise.all(promises);
//         }
        
//         let data =  { count, SupplementPkgList }
//         return res.status(201).json({ status: true, message:" Supplement Package Added", data:data});
//     }catch(error){
//       return res.status(500).json({ message: 'Internal server error' });
//     }
// }

export const supplementPkgList = async (req, res) => {
  try {
      let { _id } = req.supplementData;
      let { page = 1, limit = 10, search = '' } = req.query;

      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { supplementSeller: _id, isDeleted: false };

      if (search) {
          params.name = { $regex: '.*' + search + '.*', $options: 'i' };
      }

      let count = await SupplementPkgModel.countDocuments(params);
      let SupplementPkgList = await SupplementPkgModel.find(params)
          .skip(skipIndex)
          .limit(limit)
          .lean();

      if (SupplementPkgList.length > 0) {
          const promises = SupplementPkgList.map(pkg => {
              return Promise.all(pkg.products.map(async (product) => {
                  try {
                      let productData = await SupplementModel.findOne({ _id: product._id }).lean();
                      if (!productData) {
                          res.status(409).json({ message: '`Wrong supplement id' });
                          console.error(`Product not found for ID: ${product._id}`);
                          return; 
                      }

                      let filteredProductData = {
                          name: productData.name,
                          brandName: productData.brandName,
                          description: productData.description,
                          images: productData.images,
                      };

                      filteredProductData.stock = productData.stock.find(data => data._id.toString() === product.stockId.toString());
                      product.productData = filteredProductData;
                  } catch (err) {
                      console.error(`Error fetching product data for ID: ${product._id}`, err);
                  }
              }));
          });
          await Promise.all(promises);
      }

      let data = { count, SupplementPkgList };
      return res.status(200).json({ status: true, message: "Supplement Package Retrieved", data: data });
  } catch (error) {
      console.error("Error in supplementPkgList API:", error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};

export const viewSupplementPkg = async (req,res) =>{
    try{
        let {supplementPkgId} = req.params; 
       let supplementPkg = await SupplementPkgModel.findById(supplementPkgId).lean();
       await Promise.all(supplementPkg.products.map(async(product)=>{
        let productData = await SupplementModel.findOne({_id:product._id}).lean();
        if (!productData) {
         return res.status(409).json({ message: `Wrong supplement id` });
        }

        let filteredProductData = {
            name: productData.name,
            brandName: productData.brandName,
            description: productData.description,
            images: productData.images,
        };
        filteredProductData.stock = productData.stock.find(data => data._id.toString() === product.stockId.toString());
        product.productData = filteredProductData;
       }))
       if(!supplementPkg){
         return res.status(409).json({ message: `Invalid Supplement Id` });
       }else{
         return res.status(200).json({ status: true, message:" Supplement Package", data:supplementPkg});
       }
    }catch(error){
      return res.status(500).json({ message: 'Internal server error' });
    }
}

export const editSupplementPkg = async (req,res) =>{
    try{
       let {supplementPkgId,name , price , gender, products, description,type,image} = req.body;
       
       
       if (!supplementPkgId) {
        return res.status(400).json({ message: 'Supplement Package ID is required' });
      }

      if (name && typeof name !== 'string') {
          return res.status(400).json({ message: 'Name must be a string' });
      }

      if (price && (typeof price !== 'number' || price <= 0)) {
          return res.status(400).json({ message: 'Price must be a positive number' });
      }

      if (products && (!Array.isArray(products) || products.length === 0)) {
        return res.status(400).json({ message: 'Products must be a non-empty array' });
      }

      if (description && typeof description !== 'string') {
          return res.status(400).json({ message: 'Description must be a string' });
      }

      if (type && typeof type !== 'string') {
        return res.status(400).json({ message: 'type must be a string' });
    }

       let existedSupplementPkg = await SupplementPkgModel.findById(supplementPkgId).lean();


       if(!existedSupplementPkg){
         return res.status(409).json({ message: `Invalid Supplement Package Id` });
       }
       if(name){
          let lowerCaseName = name.toLowerCase();
          let supplementPkg = await SupplementPkgModel.findOne({_id:{$ne:existedSupplementPkg._id},name : lowerCaseName}).lean();
          if(supplementPkg){
            return res.status(409).json({ message: `Supplement Already Added with this name` });
          }
          existedSupplementPkg.name = name ? lowerCaseName :  existedSupplementPkg.name
       }
       existedSupplementPkg.price = price ? price :  existedSupplementPkg.price
       existedSupplementPkg.gender = gender ? gender :  existedSupplementPkg.gender
       existedSupplementPkg.products = products ? products :existedSupplementPkg.products
       existedSupplementPkg.description = description ? description :  existedSupplementPkg.description
       existedSupplementPkg.type = type ? type :  existedSupplementPkg.type
       existedSupplementPkg.image = image ? image :  existedSupplementPkg.image
 
       let updatedSupplementPkg = await SupplementPkgModel.findByIdAndUpdate(
        existedSupplementPkg._id,
        {$set:existedSupplementPkg},
        {new:true}
       );
       
       if (updatedSupplementPkg) {
         return res.status(200).json({ status: true, message:"edited Supplement Package", data:existedSupplementPkg});
       } else {
         return res.status(500).json({ message: `Something went wrong while updating the stock in existing Supplement Package` });
       }
 
    }catch(error){
      return res.status(500).json({ message: 'Internal server error' });
    }
}

export const deleteSupplementPkg = async (req,res)=>{
    try{
       let {supPkgId} = req.params
 
       let deleteSupplementPkg = await SupplementPkgModel.findByIdAndUpdate(
        supPkgId,
          {$set:{isDeleted:true}},
          {new:true}
       )

       return res.status(200).json({ status: true, message:"Supplement Deleted Successfully", data:supPkgId});
    }catch(error){
      return res.status(500).json({ message: 'Internal server error' });
    }
 }

export const blockSupplementPkg = async (req,res) =>{
    try{
       let {supplementPkgId,isBlocked} = req.body;
 
       let blockSupplementPkg = await SupplementPkgModel.findByIdAndUpdate(
        supplementPkgId,
          {$set:{isBlocked:isBlocked}},
          {new:true}
       )
 
       if(!blockSupplementPkg){
         return res.status(409).json({ message: 'Invalid Supplement Package Id' });
       }else{
         if(blockSupplementPkg.isBlocked){
            return res.status(200).json({ status: true, message:"Supplement Package blocked Successfully", data:blockSupplementPkg});
         }else{
            return res.status(200).json({ status: true, message:"Supplement Package unBlocked Successfully", data:blockSupplementPkg});
         }
       }
    }catch(error){
      return res.status(500).json({ message: 'Internal server error' });
    }
 }