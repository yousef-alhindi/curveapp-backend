import { sendErrorResponse, sendSuccessResponse } from "../../responses/response";
import HttpStatus from "http-status-codes";
import { LOYALTY_POINT_MODEL } from "../../models/admin/loyalityPoint.model";

export const createLoyaltyPoints = async (req,res)=>{
    try{
        const response = await LOYALTY_POINT_MODEL.create(req.body);
        return sendSuccessResponse(res, response, 'Loyalty Points Created Successfully!', HttpStatus.OK);
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getLoyaltyPoints = async (req,res)=>{
    try{
        const response = await LOYALTY_POINT_MODEL.find();
        return sendSuccessResponse(res, response, 'Loyalty Points fetched Successfully!', HttpStatus.OK);
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const updateLoyaltyPoints = async (req,res)=>{
    try{
        const {id} = req.params;
        const response = await LOYALTY_POINT_MODEL.findByIdAndUpdate(id,req.body,{new: true})

        if (!response) {
            return sendErrorResponse(res, 'Loyalty Point not found', HttpStatus.NOT_FOUND);
        }
        return sendSuccessResponse(res, response, 'Loyalty Points Updated Successfully!', HttpStatus.OK);
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}