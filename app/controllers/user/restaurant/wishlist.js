import mongoose from "mongoose";
import { sendErrorResponse, sendSuccessResponse } from "../../../responses/response";
import * as commonService from '../../../services/common/common.service';
import { WISHLIST_MODEL } from "../../../models/user/wishlist.model";
import { RestaurantModel } from "../../../models/restaurant/restaurant.model";


export const addAndRemoveWishlistRestaurentController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return sendErrorResponse(res, "Id is invalid", 400);
        }

        if (!req.userData?._id) {
            return sendErrorResponse(res, "Please provide access token to add in wishlist.", 404);
        }

        const restResp = await commonService.findOne(RestaurantModel, { _id: id });
        if (!restResp) {
            return sendErrorResponse(res, "Restaurant not found.", 404);
        }

        const alreadySaved = await commonService.findOne(WISHLIST_MODEL, {
            restId: id,
            userId: req.userData._id,
        });
        if (!!alreadySaved) {
            await commonService.findOneAndDelete(WISHLIST_MODEL, { _id: alreadySaved._id });
            return sendSuccessResponse(res, {}, "Restaurant removed successfully");
        }

        await commonService.create(WISHLIST_MODEL, {
            restId: id,
            userId: req.userData._id,
        });

        sendSuccessResponse(res, {}, "Restaurant added successfully");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};

export const listWishlistRestaurentController = async (req, res) => {
    try {
        if (!req.userData?._id) {
            return sendErrorResponse(res, "Please provide access token to fetch wishlists.", 404);
        }

        const restResp = await WISHLIST_MODEL.find({ userId: req.userData._id ,restId:{$exists:true}}).populate({
            path: 'restId',
            populate: [
                { path: 'resCategory', model: 'Cuisine' },
            ]
        });

        let list = []
        // for (let d of restResp.map(d => d.restId)) {
        //     d = JSON.parse(JSON.stringify(d))
        //     let isWishlist = await WISHLIST_MODEL.findOne({
        //         userId: new mongoose.Types.ObjectId(req.userData?._id),
        //         restId: new mongoose.Types.ObjectId(d._id),
        //     });

        //     list.push({ ...d, isWishlist: !!isWishlist  })
        // }

        if (restResp) {
            const filteredRestIds = restResp
                .map(d => d.restId) 
                .filter(restId => restId !== null);
        
            for (let d of filteredRestIds) {
                d = JSON.parse(JSON.stringify(d)); // Deep copy of d
                let isWishlist = await WISHLIST_MODEL.findOne({
                    userId: new mongoose.Types.ObjectId(req.userData?._id),
                    restId: new mongoose.Types.ObjectId(d._id),
                });
        
                list.push({ ...d, isWishlist: !!isWishlist });
            }
        }
        sendSuccessResponse(res, list, "Wishlist fetch successfully");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};

export const getWishlistPackageRest = async (req,res) =>{
    try{
        if (!req.userData?._id) {
            return sendErrorResponse(res, "Please provide access token to fetch wishlists.", 404);
        }

        const restResp = await WISHLIST_MODEL.find({ userId: req.userData._id,restId:{$exists:true} }).populate({
            path: 'restId',
            populate: [
                { path: 'resCategory', model: 'Cuisine' },
            ]
        });

        let list = []
        for (let d of restResp.map(d => d.restId)) {
            d = JSON.parse(JSON.stringify(d))
            let isWishlist = await WISHLIST_MODEL.findOne({
                userId: new mongoose.Types.ObjectId(req.userData?._id),
                restId: new mongoose.Types.ObjectId(d._id),
            });

            list.push({ ...d, isWishlist: !!isWishlist  })
        }

        sendSuccessResponse(res, list, "Wishlist fetch successfully");
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
}

