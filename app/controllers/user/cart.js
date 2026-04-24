import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success } from '../../responses/messages';
import { Restaurant_Cart_Model } from '../../models/user/restaurantCart.model';
import * as commonService from '../../services/common/common.service';
import { menuItemModel } from '../../models/restaurant/menuItem.model';
import { CustomiseItemModel } from '../../models/restaurant/customiseItem.model';
import { ServiceType } from '../../constants/service.constants';
import { DeliveryFare_Model } from '../../models/admin/deliveryFare.model';
import { getKmRange } from '../../utils/helper';
import { Offer_Order_Model } from '../../models/restaurant/offerOrder.model';
import { Food_Pack_Cart_Model } from '../../models/user/restFoodPackCart.model';
import { AdminFoodPackCartModel } from '../../models/user/adminFoodPackCart.model';
import { RestaurantPackageModel } from '../../models/restaurant/restaurantPackage';
import { PackageFoodModel } from '../../models/admin/foodPackage.model';
import UserModel from '../../models/user/user.model';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

export const addTocart = async (req, res) => {
    try {
        let { itemId, customize, quantity, instructions = "", type = 1 , deliveryOption} = req.body;
        if (!quantity) {
            return sendErrorResponse(res, "Please enter a valid quantity", HttpStatus.BAD_REQUEST);
        }

        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const itemResp = await commonService.findById(menuItemModel, itemId);
        if (!itemResp) {
            return sendErrorResponse(res, "Item ID is invalid", HttpStatus.BAD_REQUEST);
        }

        customize = [...new Set(customize)]
        let customizeItemAmount = 0
        for (let c of customize) {
            const customizeResp = await commonService.findOne(CustomiseItemModel, { _id: new mongoose.Types.ObjectId(c), menuId: new ObjectId(itemId) });
            if (!customizeResp) {
                return sendErrorResponse(res, `Customize ID is invalid - ${c}`, HttpStatus.BAD_REQUEST);
            }
            customizeItemAmount += customizeResp.price
        }

        const itemPrice = Number(itemResp.price);
        const totalItemAmount = (itemPrice * Number(quantity)) + (Number(quantity) * Number(customizeItemAmount));


        let cart = await Restaurant_Cart_Model.findOne({ userId: req.userData._id, restId: itemResp.restId , status:1});

        if (cart) {
            let itemIndex = cart.items.findIndex(item => item.itemId.toString() == itemId.toString() && JSON.stringify(customize) == JSON.stringify(item.customize) && instructions.trim() == item?.instructions.trim());

            if (itemIndex > -1) {
                let totalQuantity = Number(cart.items[itemIndex].quantity + quantity)
                if (type == 2) {
                    if (cart.items[itemIndex].quantity == 1) {
                        return sendErrorResponse(res, `Please use cart delete api instead of add api `, HttpStatus.BAD_REQUEST);
                    }

                    totalQuantity = Number(cart.items[itemIndex].quantity - quantity)
                }

                cart.items[itemIndex].quantity =  totalQuantity
                cart.items[itemIndex].customize = customize;
                cart.items[itemIndex].isCustomize  = customize.length>0?true:false
                cart.items[itemIndex].amount = (itemPrice * totalQuantity) + (totalQuantity * Number(customizeItemAmount));;
                cart.items[itemIndex].instructions = instructions.trim()
                cart.deliveryOption = deliveryOption;
            } else {
                cart.items.push({
                    itemId: new ObjectId(itemId),
                    quantity: Number(quantity),
                    customize: customize,
                    amount: totalItemAmount,
                    instructions: instructions.trim(),
                    isCustomize: customize.length>0?true:false
                });
                cart.deliveryOption=deliveryOption;
            }

            // Recalculate cart amount
            cart.amount = cart.items.reduce((total, item) => total + item.amount, 0);

            const updatedCart = await cart.save();
            return sendSuccessResponse(res, updatedCart, success.UPDATED, HttpStatus.OK);
        } else {
            const createdResp = await commonService.create(Restaurant_Cart_Model, {
                userId: req.userData._id,
                restId: itemResp.restId,
                items: [{
                    itemId: new ObjectId(itemId),
                    quantity: Number(quantity),
                    customize: customize,
                    amount: totalItemAmount,
                    isCustomize: customize.length>0?true:false,
                    instructions: instructions.trim(),
                }],
                deliveryOption : deliveryOption, //takeAway: 0,  delivery: 1
                amount: totalItemAmount,
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime()
            });
            return sendSuccessResponse(res, createdResp, success.SUCCESS, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const customizeCartItems = async(req,res)=>{
    try{
        let {cartId,itemId,customize ,customizationId,instructions = ""} = req.body;

        let cart = await Restaurant_Cart_Model.findOne({ _id:new mongoose.Types.ObjectId(cartId), status:1});
        if(!cart){
            return sendErrorResponse(res, `Cart ID is invalid - ${cartId}`, HttpStatus.BAD_REQUEST);
        }

        const itemExistedInCart = cart.items.find((item)=>item._id.toString()===customizationId)
        if(!itemExistedInCart){
            return sendErrorResponse(res, `customization ID is invalid - ${customizationId}`, HttpStatus.BAD_REQUEST);
        }

        const itemResp = await commonService.findById(menuItemModel, itemId,{price:1});
        if(!itemResp){
            return sendErrorResponse(res, `Item ID is invalid - ${itemId}`, HttpStatus.BAD_REQUEST);
        }
        customize = [...new Set(customize)]

        let customizeItemAmount = 0
        for (let c of customize) {

            const customizeResp = await commonService.findOne(CustomiseItemModel, { _id: new mongoose.Types.ObjectId(c), menuId: new ObjectId(itemId) });
            if (!customizeResp) {
                return sendErrorResponse(res, `Customize ID is invalid - ${c}`, HttpStatus.BAD_REQUEST);
            }
            customizeItemAmount += customizeResp.price
        }

        const itemPrice = Number(itemResp.price);
        const totalItemAmount = (itemPrice * Number(itemExistedInCart.quantity)) + (Number(itemExistedInCart.quantity) * Number(customizeItemAmount));
        let totalAmount  = 0
        cart.items.map((item,index)=>{
            if(item._id.toString()===customizationId){
                cart.items[index].customize = customize;
                cart.items[index].isCustomize  =   cart.items[index].customize.length>0?true:false
                cart.items[index].amount = totalItemAmount
                cart.items[index].instructions = instructions.trim()
            }

            totalAmount = totalAmount+item.amount;
            if((cart.items.length-1)===index){
                cart.amount = totalAmount
            }

        })

        const updateCart = await cart.save();

        if(updateCart){
            return sendSuccessResponse(res, updateCart, success.SUCCESS, HttpStatus.OK);
        }else{
            return sendErrorResponse(res, `Error in Customization Cart`, HttpStatus.BAD_REQUEST);
        }

        
    }catch(error){
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const removeTocart = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return sendErrorResponse(res, "ID is invalid", HttpStatus.BAD_REQUEST);
        }

        let carts = await Restaurant_Cart_Model.find({ userId: req.userData._id });

        if (!carts.length) {
            return sendErrorResponse(res, "Cart not found", HttpStatus.NOT_FOUND);
        }

        let notFound = true
        for (let cart of carts) {
            let itemIndex = cart.items.findIndex(item => item._id.toString() == id.toString());

            if (itemIndex === -1) {
                continue
            }

            notFound = false
            cart.items.splice(itemIndex, 1);

            let totalAmount = 0;
            for (let item of cart.items) {
                const currentItem = await commonService.findById(menuItemModel, item.itemId);
                let itemAmount = currentItem.price * item.quantity;

                for (let c of item.customize) {
                    const customizeResp = await commonService.findOne(CustomiseItemModel, { _id: c });
                    if (customizeResp) {
                        itemAmount += customizeResp.price;
                    }
                }

                totalAmount += itemAmount;
            }

            cart.amount = totalAmount;

            if (cart.items.length === 0) {
                await Restaurant_Cart_Model.deleteOne({ _id: cart._id });
                return sendSuccessResponse(res, {}, "Cart is empty and has been deleted", HttpStatus.OK);
            } else {
                await cart.save();
                return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK);
            }
        }
        if (notFound) {
            return sendErrorResponse(res, "Item ID is invalid", HttpStatus.NOT_FOUND);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const cartList = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const result = await Restaurant_Cart_Model.aggregate([
            {
                $match: {
                    userId: req.userData._id,
                    status:1
                },
            },
            {
                $unwind: '$items',
            },
            {
                $lookup: {
                    from: 'Restaurant',
                    localField: 'restId',
                    foreignField: '_id',
                    as: 'restaurant',
                },
            },
            {
                $unwind: '$restaurant',
            },
            {
                $lookup: {
                    from: 'Cuisine',
                    localField: 'restaurant.resCategory',
                    foreignField: '_id',
                    as: 'restaurant.resCategory',
                },
            },
            {
                $addFields: {
                    'restaurant.resCategory': {
                        $cond: {
                            if: { $isArray: '$restaurant.resCategory' },
                            then: '$restaurant.resCategory',
                            else: [],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'MenuItem',
                    localField: 'items.itemId',
                    foreignField: '_id',
                    as: 'itemDetails',
                },
            },
            {
                $unwind: {
                    path: '$itemDetails',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'CustomiseItem',
                    localField: 'items.customize',
                    foreignField: '_id',
                    as: 'customizeDetails',
                },
            },
            {
                $addFields: {
                    'items.customizeDetails': {
                        $map: {
                            input: {
                                $cond: {
                                    if: { $isArray: '$customizeDetails' },
                                    then: '$customizeDetails',
                                    else: [],
                                },
                            },
                            as: 'customize',
                            in: {
                                $cond: {
                                    if: { $in: ['$$customize._id', '$items.customize'] },
                                    then: '$$customize',
                                    else: null,
                                },
                            },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$_id',
                    userId: { $first: '$userId' },
                    restaurant: { $first: '$restaurant' },
                    items: {
                        $push: {
                            _id: '$items._id',
                            itemId: '$items.itemId',
                            isCustomize: '$items.isCustomize',
                            quantity: '$items.quantity',
                            amount: '$items.amount',
                            instructions: '$items.instructions',
                            itemDetails: '$itemDetails',
                            customize: '$items.customize',
                            customizeDetails: {
                                $filter: {
                                    input: '$items.customizeDetails',
                                    as: 'customizeDetail',
                                    cond: { $ne: ['$$customizeDetail', null] },
                                },
                            },
                        },
                    },
                    amount: { $first: '$amount' },
                    status: { $first: '$status' },
                    deliveryOption: { $first: '$deliveryOption' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
            {
                $project: {
                    _id: 1,
                    restaurant: 1,
                    userId: 1,
                    amount: 1,
                    status: 1,
                    deliveryOption:1,
                    createdAt: 1,
                    updatedAt: 1,
                    items: 1,
                },
            },
        ]);


        return sendSuccessResponse(res, result, success.SUCCESS);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const cartViewByRestaurant = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const { restId } = req.params;
        if (!mongoose.isValidObjectId(restId)) {
            return sendErrorResponse(res, "restId is invalid", 400);
        }


        const result = await Restaurant_Cart_Model.aggregate([
            {
                $match: {
                    userId: req.userData._id,
                    restId: new ObjectId(restId),
                    status:1
                },
            },
            {
                $lookup: {
                    from: 'Restaurant',
                    localField: 'restId',
                    foreignField: '_id',
                    as: 'restaurant',
                },
            },
            {
                $unwind: '$restaurant',
            },
            {
                $unwind: '$items',
            },
            {
                $group: {
                    _id: '$restId',
                    restId: { $first: '$restId' },
                    restName: { $first: '$restaurant.resName' },
                    totalAmount: { $first: '$amount' },
                    totalItems: { $sum: 1 },
                    deliveryOption: { $first: '$deliveryOption' },
                },
            },
            {
                $project: {
                    _id: 1,
                    restId: 1,
                    restName: 1,
                    totalAmount: 1,
                    totalItems: 1,
                    deliveryOption:1
                },
            },
        ]);
        const data = result.length ? result[0] : {
            "_id": "",
            "restId": "",
            "restName": "",
            "totalAmount": 0,
            "totalItems": 0
        }
        return sendSuccessResponse(res, data, success.SUCCESS);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const cartListByRestaurant = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const { restId } = req.params;
        if (!mongoose.isValidObjectId(restId)) {
            return sendErrorResponse(res, "restId is invalid", 400);
        }

        const result = await Restaurant_Cart_Model.aggregate([
            {
                $match: {
                    userId: req.userData._id,
                    restId: new mongoose.Types.ObjectId(restId),
                    status:1
                },
            },
            {
                $unwind: '$items',
            },
            {
                $lookup: {
                    from: 'Restaurant',
                    localField: 'restId',
                    foreignField: '_id',
                    as: 'restaurant',
                },
            },
            {
                $unwind: '$restaurant',
            },
            {
                $lookup: {
                    from: 'Cuisine',
                    localField: 'restaurant.resCategory',
                    foreignField: '_id',
                    as: 'restaurant.resCategory',
                },
            },
            {
                $addFields: {
                    'restaurant.resCategory': {
                        $cond: {
                            if: { $isArray: '$restaurant.resCategory' },
                            then: '$restaurant.resCategory',
                            else: [],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'MenuItem',
                    localField: 'items.itemId',
                    foreignField: '_id',
                    as: 'itemDetails',
                },
            },
            {
                $unwind: {
                    path: '$itemDetails',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'CustomiseItem',
                    localField: 'items.customize',
                    foreignField: '_id',
                    as: 'customizeDetails',
                },
            },
            {
                $addFields: {
                    'items.customizeDetails': {
                        $map: {
                            input: {
                                $cond: {
                                    if: { $isArray: '$customizeDetails' },
                                    then: '$customizeDetails',
                                    else: [],
                                },
                            },
                            as: 'customize',
                            in: {
                                $cond: {
                                    if: { $in: ['$$customize._id', '$items.customize'] },
                                    then: '$$customize',
                                    else: null,
                                },
                            },
                        },
                    },
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $group: {
                    _id: '$_id',
                    userId: { $first: '$userId' },
                    restaurant: { $first: '$restaurant' },
                    items: {
                        $push: {
                            _id: '$items._id',
                            itemId: '$items.itemId',
                            quantity: '$items.quantity',
                            amount: '$items.amount',
                            itemDetails: '$itemDetails',
                            instructions: '$items.instructions',
                            customize: '$items.customize',
                            customizeDetails: {
                                $filter: {
                                    input: '$items.customizeDetails',
                                    as: 'customizeDetail',
                                    cond: { $ne: ['$$customizeDetail', null] },
                                },
                            },
                        },
                    },
                    amount: { $first: '$amount' },
                    status: { $first: '$status' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
            {
                $project: {
                    _id: 1,
                    restaurant: 1,
                    userId: 1,
                    amount: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    items: 1,
                },
            },
        ]);

        const data = result.length ? result[0] : {}
        return sendSuccessResponse(res, data, success.SUCCESS);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const removeCartByRestaurant = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'token is required', HttpStatus.BAD_GATEWAY);
        }

        const { restId ,cartId} = req.params;
        if (!mongoose.isValidObjectId(restId)) {
            return sendErrorResponse(res, "restId is invalid", 400);
        }

        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        await Restaurant_Cart_Model.deleteOne({ userId: req.userData._id, restId: new ObjectId(restId), _id:new mongoose.Types.ObjectId(cartId) });
        return sendSuccessResponse(res, {}, success.DELETED_SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const addToCartWithCustomizeItem = async (req, res) => {
    try {
        let { itemId, customize, quantity, instructions = ""  } = req.body;
        if (!quantity) {
            return sendErrorResponse(res, "Quantity is required", HttpStatus.BAD_REQUEST);
        }

        const itemResp = await commonService.findById(menuItemModel, itemId);
        if (!itemResp) {
            return sendErrorResponse(res, "Item ID is invalid", HttpStatus.BAD_REQUEST);
        }

        customize = [...new Set(customize)]
        let customizeItemAmount = 0
        for (let c of customize) {
            const customizeResp = await commonService.findOne(CustomiseItemModel, { _id: new ObjectId(c), menuId: new ObjectId(itemId) });
            if (!customizeResp) {
                return sendErrorResponse(res, `Customize ID is invalid - ${c}`, HttpStatus.BAD_REQUEST);
            }
            customizeItemAmount += customizeResp.price
        }

        const itemPrice = Number(itemResp.price);
        const totalItemAmount = (itemPrice * Number(quantity)) + customizeItemAmount;

        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        let cart = await Restaurant_Cart_Model.findOne({ userId: req.userData._id, restId: itemResp.restId });

        if (cart) {
            let itemIndex = cart.items.findIndex(item => item.itemId.toString() === itemId.toString() && JSON.stringify(item.customize) === JSON.stringify(customize) && instructions.trim() == item?.instructions.trim());

            if (itemIndex > -1) {
                let totalAmount = (itemPrice * Number(cart.items[itemIndex].quantity + quantity)) + customizeItemAmount;
                cart.items[itemIndex].quantity = Number(cart.items[itemIndex].quantity + quantity);
                cart.items[itemIndex].customize = customize;
                cart.items[itemIndex].amount = totalAmount;
                cart.items[itemIndex].instructions = instructions.trim();
            } else {
                cart.items.push({
                    itemId: new ObjectId(itemId),
                    quantity: Number(quantity),
                    customize: customize,
                    amount: totalItemAmount,
                    isCustomize: true,
                    instructions: instructions.trim(),
                });
            }

            cart.amount = cart.items.reduce((total, item) => total + item.amount, 0);

            const updatedCart = await cart.save();
            return sendSuccessResponse(res, updatedCart, success.UPDATED, HttpStatus.OK);
        } else {
            return sendErrorResponse(res, "Cart not found", HttpStatus.BAD_REQUEST);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getItemsListByItem = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'token is required', HttpStatus.BAD_GATEWAY);
        }

        const { id ,restId} = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return sendErrorResponse(res, "id is invalid", 400);
        }

        const result = await Restaurant_Cart_Model.aggregate([
            {
                $match: {
                    userId: req.userData._id,
                    'items.itemId': new mongoose.Types.ObjectId(id),
                    status:1,
                    restId : new mongoose.Types.ObjectId(restId)
                },
            },
            {
                $unwind: '$items',
            },
            {
                $match: {
                    'items.itemId': new mongoose.Types.ObjectId(id),
                },
            },
            {
                $lookup: {
                    from: 'MenuItem',
                    localField: 'items.itemId',
                    foreignField: '_id',
                    as: 'itemDetails',
                },
            },
            {
                $unwind: {
                    path: '$itemDetails',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'CustomiseItem',
                    localField: 'items.customize',
                    foreignField: '_id',
                    as: 'customizeDetails',
                },
            },
            {
                $addFields: {
                    'items.customizeDetails': {
                        $map: {
                            input: {
                                $cond: {
                                    if: { $isArray: '$customizeDetails' },
                                    then: '$customizeDetails',
                                    else: [],
                                },
                            },
                            as: 'customize',
                            in: {
                                $cond: {
                                    if: { $in: ['$$customize._id', '$items.customize'] },
                                    then: '$$customize',
                                    else: null,
                                },
                            },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$_id',
                    userId: { $first: '$userId' },
                    items: {
                        $push: {
                            _id: '$items._id',
                            itemId: '$items.itemId',
                            quantity: '$items.quantity',
                            instructions: '$items.instructions',
                            amount: '$items.amount',
                            itemDetails: '$itemDetails',
                            customize: '$items.customize',
                            customizeDetails: {
                                $filter: {
                                    input: '$items.customizeDetails',
                                    as: 'customizeDetail',
                                    cond: { $ne: ['$$customizeDetail', null] },
                                },
                            },
                        },
                    },
                    amount: { $first: '$amount' },
                    status: { $first: '$status' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    amount: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    items: 1,
                },
            },
        ]);
        let resp = result.length ? result[0]?.items : []
        return sendSuccessResponse(res, resp, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getDeliveryFare = async (req, res)=>{

    try{
        const {addressCoordinates , restaurantCoordinates} = req.body;

        if (!addressCoordinates || ((addressCoordinates && addressCoordinates.length!=2 )|| addressCoordinates.includes(null))) {
            return sendErrorResponse(res, 'addressCoordinates required', HttpStatus.BAD_GATEWAY);
        }

        if (!restaurantCoordinates || ((restaurantCoordinates && restaurantCoordinates.length!=2) ||  restaurantCoordinates.includes(null))) {
            return sendErrorResponse(res, 'restaurantCoordinates required', HttpStatus.BAD_GATEWAY);
        }
        const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER ,status:true});

        const kmRange = getKmRange(
            addressCoordinates[0],
            addressCoordinates[1],
            restaurantCoordinates[0],
            restaurantCoordinates[1]
       )

        const deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + kmRange * (deliveryFareResp?.perKmFare || 1);

        // Estimate delivery time (you can adjust the speed based on your context)
        const averageSpeedKmh = 30; // Average speed in kilometers per hour
        const estimatedDeliveryTimeInMintutes = kmRange / averageSpeedKmh * 60; // Delivery time in minutes
    
        return res.status(201).json({ status: true, message:" Delivery Amount & Delivery Time", data: { deliveryAmount ,estimatedDeliveryTimeInMintutes }});
    }catch(error){
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getDiscountAmount = async (req,res) =>{

    try{
        const {restId,promoCodeId,totalAmount} = req.body;

        if (!restId || restId==="" || restId===null) {
            return sendErrorResponse(res, 'restId required', HttpStatus.BAD_GATEWAY);
        }
        if (!promoCodeId || promoCodeId==="" || promoCodeId===null) {
            return sendErrorResponse(res, 'promoCodeId required', HttpStatus.BAD_GATEWAY);
        }
        if (!totalAmount || totalAmount===null) {
            return sendErrorResponse(res, 'totalAmount required', HttpStatus.BAD_GATEWAY);
        }

        const offerOrders = await Offer_Order_Model.find({ restId: restId }).populate('offerId');
        if (offerOrders.length === 0 && promoCodeId!==null && promoCodeId!=="") {
           return res.status(404).json({ message: 'No offer orders found for this restaurant' });
        }
    
        const specificOfferOrders = offerOrders.find(
           (offerOrder) => offerOrder.offerId._id.toString() === promoCodeId //e.g.:  "66da2f3abb6eabf3cfaf999b"
        );
        if (!specificOfferOrders && promoCodeId!==null && promoCodeId!=="") {
           return res.status(404).json({ message: 'Promo code is invalid or not applicable' });
        }
    
        let discount ;
        if(promoCodeId!==null && promoCodeId!==""){
            const discountType = specificOfferOrders.offerId.discountType;
            if (discountType === 0) {
                // No Discount
                discount = 0; 
            } else if (discountType === 1) {
               // Flat discount
               discount = specificOfferOrders.offerId.flatDiscountValue;
            } else if (discountType === 2) {
               // Percentage discount
               discount =(totalAmount * specificOfferOrders.offerId.percentDiscountValue) / 100;
               discount = Math.min(discount, specificOfferOrders.offerId.discountUpto);
            }
         }
    
         return res.status(201).json({ status: true, message:`Discount on this promocode ${specificOfferOrders.offerId.promoCode}` ,data: {discount:discount }});
    }catch(error){
        res.status(500).json({ message: 'Internal server error' });
    }

}


//................For restaurant food package.....

export const addTocartFoodPack = async (req,res) =>{
    try {
        let { packageId,durationId,restId} = req.body;
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        let packageResp , packagePrice, duration, cart;
            packageResp = await commonService.findById(RestaurantPackageModel, packageId);
            if (!packageResp) {
                return sendErrorResponse(res, "PackageId is invalid", HttpStatus.BAD_REQUEST);
            }
            let durationData ;
            packageResp.durations.map((duration) => {
                if(duration._id.toString() === durationId){
                    durationData = duration
                }
            });

            if(!durationData){
                return sendErrorResponse(res, "duration ID is invalid", HttpStatus.BAD_REQUEST);
            }
            packagePrice = Number(durationData.packagePrice);
            duration = durationData.duration;
           cart = await Food_Pack_Cart_Model.findOne({ userId: req.userData._id, restId: packageResp.restId , status:1});

        if (cart) {

            cart.packageId =packageResp._id;
            cart.duration =duration
            cart.amount = packagePrice

            const updatedCart = await cart.save();
            return sendSuccessResponse(res, updatedCart, success.UPDATED, HttpStatus.OK);
        } else {
            const createdResp = await commonService.create(Food_Pack_Cart_Model, {
                userId: req.userData._id,
                restId: packageId && packageId.length>1 && packageResp.restId,
                packageId :packageResp._id,
                duration : duration, 
                amount : packagePrice,
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime()
            });
            return sendSuccessResponse(res, createdResp, success.SUCCESS, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getSingleRestCart = async (req,res) =>{
    try {
        let {restId} = req.query;
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        let cartData = await Food_Pack_Cart_Model.findOne({restId:new mongoose.Types.ObjectId(restId),userId:req.userData._id,status:1,isDeleted:false})
        if(cartData){
            return sendSuccessResponse(res, cartData, success.SUCCESS, HttpStatus.OK);
        }else{
            return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const foodPackCartList = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const result = await Food_Pack_Cart_Model.aggregate([
            {
                $match: {
                    userId: req.userData._id,
                    status:1,
                    isDeleted:false
                },
            },
            {
                $lookup: {
                    from: 'Restaurant',
                    localField: 'restId',
                    foreignField: '_id',
                    as: 'restaurant',
                },
            },
            {
                $unwind: '$restaurant',
            },
            {
                $lookup: {
                    from: 'restaurantPackage',
                    localField: 'packageId',
                    foreignField: '_id',
                    as: 'restaurantPackage',
                },
            },
            {
                $unwind: '$restaurantPackage',
            },
            {
                $lookup: {
                    from: 'Cuisine',
                    localField: 'restaurant.resCategory',
                    foreignField: '_id',
                    as: 'restaurant.resCategory',
                },
            },
            {
                $addFields: {
                    'restaurant.resCategory': {
                        $cond: {
                            if: { $isArray: '$restaurant.resCategory' },
                            then: '$restaurant.resCategory',
                            else: [],
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$_id',
                    userId: { $first: '$userId' },
                    restaurant: { $first: '$restaurant' },
                    restaurantPackage: { $first: '$restaurantPackage' },
                    packageId : {$first : '$packageId'},
                    amount: { $first: '$amount' },
                    status: { $first: '$status' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
            {
                $project: {
                    _id: 1,
                    restaurant: 1,
                    restaurantPackage:1,
                    packageId: 1,
                    userId: 1,
                    amount: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1
                },
            },
        ]);

        await Promise.all(result.map(async(item,index)=>{
            let resPackage = await RestaurantPackageModel.findOne({_id:item.packageId});
            if(resPackage){
                result[index].packageName = resPackage.name
            }
        }))

        return sendSuccessResponse(res, result, success.SUCCESS);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const foodPackCartViewByRestaurant = async (req, res) =>{
     try {
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const { restId } = req.params;
        if (!mongoose.isValidObjectId(restId)) {
            return sendErrorResponse(res, "restId is invalid", 400);
        }

        const result = await Food_Pack_Cart_Model.findOne(
            {  userId: req.userData._id,
                restId: new ObjectId(restId),
                status:1,
                isDeleted:false
            }
        ).populate({
            path:"restId",
            select:"location addressDetails resName ownerName active documents"
        }).populate({
            path:"packageId",
            select :"packageId name description termsAndCondition image durations"
        })

        result.packageId.durations = result.packageId.durations.length>0 && result.packageId.durations.filter((duration)=>result.duration===duration.duration)
        return sendSuccessResponse(res, result, success.SUCCESS);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const removeFoodPackCartByRestaurant = async (req,res) =>{
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'token is required', HttpStatus.BAD_GATEWAY);
        }

        const { restId ,cartId} = req.params;
        if (!mongoose.isValidObjectId(restId)) {
            return sendErrorResponse(res, "restId is invalid", 400);
        }

        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        await Food_Pack_Cart_Model.deleteOne({ userId: req.userData._id, restId: new ObjectId(restId), _id:new mongoose.Types.ObjectId(cartId) });
        return sendSuccessResponse(res, {}, success.DELETED_SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const editFoodPackageCart = async (req,res) =>{
    try {
        let { packageId,durationId,cartId} = req.body;
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        let cartExisted = await Food_Pack_Cart_Model.findOne({_id:new mongoose.Types.ObjectId(cartId),status:1,userId: req.userData._id});
        if(!cartExisted){
            return sendErrorResponse(res, "CartId is invalid", HttpStatus.BAD_REQUEST);
        }
        let packageResp , packagePrice, duration;
        packageResp = await commonService.findById(RestaurantPackageModel, packageId);
        if (!packageResp) {
            return sendErrorResponse(res, "PackageId is invalid", HttpStatus.BAD_REQUEST);
        }
        let durationData ;
        packageResp.durations.map((duration) => {
            if(duration._id.toString() === durationId){
                durationData = duration
            }
        });

        if(!durationData){
            return sendErrorResponse(res, "duration ID is invalid", HttpStatus.BAD_REQUEST);
        }
        packagePrice = Number(durationData.packagePrice);
        duration = durationData.duration;

        let setData = {
            packageId :packageResp._id,
            duration :duration,
            amount :packagePrice    
        }

        let updateCart = await Food_Pack_Cart_Model.findByIdAndUpdate(
            cartId,
            {$set:setData},
            {new:true}
        )

        return sendSuccessResponse(res, updateCart, success.UPDATED, HttpStatus.OK);
       
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getFoodPackageDeliveryFare = async (req, res)=>{

    try{
        const {addressCoordinates , restaurantCoordinates, duration} = req.body;

        if (!addressCoordinates || ((addressCoordinates && addressCoordinates.length!=2 )|| addressCoordinates.includes(null))) {
            return sendErrorResponse(res, 'addressCoordinates required', HttpStatus.BAD_GATEWAY);
        }

        if (!restaurantCoordinates || ((restaurantCoordinates && restaurantCoordinates.length!=2) ||  restaurantCoordinates.includes(null))) {
            return sendErrorResponse(res, 'restaurantCoordinates required', HttpStatus.BAD_GATEWAY);
        }
        const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER ,status:true});

        const kmRange = getKmRange(
            addressCoordinates[0],
            addressCoordinates[1],
            restaurantCoordinates[0],
            restaurantCoordinates[1]
       )

        let deliveryAmount = Number(deliveryFareResp?.baseFare || 0) + kmRange * (deliveryFareResp?.perKmFare || 1);

        if (duration === 1) { // WEEKLY: 1, MONTHLY: 2
           deliveryAmount = deliveryAmount * 7;
       }else if(duration===2){
           deliveryAmount = deliveryAmount * 30;
        }
    
        return res.status(201).json({ status: true, message:" Delivery Amount ", data: { deliveryAmount }});
    }catch(error){
        res.status(500).json({ message: 'Internal server error' });
    }
}


//................For Admin food package.....

export const addTocartAdminFoodPack = async (req,res) =>{
    try {
        let { packageId,restId,add=true} = req.body;
        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        let packagePrice, cart;
        let packageResp = await commonService.findById(PackageFoodModel, packageId);
        if (!packageResp) {return sendErrorResponse(res, "PackageId is invalid", HttpStatus.BAD_REQUEST);}

        packagePrice = Number(packageResp.price);
        cart = await AdminFoodPackCartModel.findOne({ userId: req.userData._id, packageId:packageResp._id, status:1});
        if (cart) {
            if(add===true && cart.restaurants.length===packageResp.upTo){
                return sendErrorResponse(res, `Cannot add more than ${packageResp.upTo} restaurants`, HttpStatus.CONFLICT);
            }
            //.......adding restuarant in package..........
            else if(add===true && cart.restaurants.length<packageResp.upTo){
                let existedRest = cart.restaurants.find(rest=>rest._id.toString()===restId)
                if(existedRest){return sendErrorResponse(res, "Restaurant Already added in this package", HttpStatus.CONFLICT)}

                cart.restaurants = [
                    ...cart.restaurants,
                    {
                    _id : new mongoose.Types.ObjectId(restId),
                    amount : packagePrice,
                    }
                ];
                cart.totalAmount = cart.totalAmount+packagePrice
                const updatedCart = await cart.save();
                return sendSuccessResponse(res, updatedCart, "Restaurant added to package cart", HttpStatus.OK);
            }
             //.......removing restuarant in package..........
            if(add===false && cart.restaurants.length>1){
                cart.restaurants = cart.restaurants.filter(rest=>rest._id.toString()!==restId)
                cart.totalAmount = cart.totalAmount-packagePrice
                const updatedCart = await cart.save();
                return sendSuccessResponse(res, updatedCart, "Restaurant removed from package cart", HttpStatus.OK);
            }
             //.......deleteing package..........
            else if(add===false && cart.restaurants.length===1){
                const updatedCart = await cart.deleteOne();
                return sendSuccessResponse(res, updatedCart, "Package removed from package cart", HttpStatus.OK);
            }
        } else {
            let restaurants = [{
                _id : new mongoose.Types.ObjectId(restId),
                amount : packagePrice,
            }];
            const createdResp = await commonService.create(AdminFoodPackCartModel, {
                userId: req.userData._id,
                restaurants: restaurants,
                packageId :packageResp._id, 
                totalAmount : packagePrice,
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime()
            });
            return sendSuccessResponse(res, createdResp, success.SUCCESS, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getSingleAdminPackCart = async (req,res) =>{
    try {
        let {packageId} = req.query;
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }
        let cartData = await AdminFoodPackCartModel.findOne({
            packageId:new mongoose.Types.ObjectId(packageId),
            userId:req.userData._id,
            status:1,
            isDeleted:false
        })
        .populate({
            path:'packageId',
            select :'packageId goal duration price termAndCondition name description image upTo'
        })
        .populate({
            path:'restaurants._id',
            select :'countryCode mobileNumber profileImage profileType resCategory resName ownerName email addressDetails active documents'
        }
        )
        if(cartData){
            return sendSuccessResponse(res, cartData, success.SUCCESS, HttpStatus.OK);
        }else{
            return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const AdminPackCartList = async (req, res) => {
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        const result = await AdminFoodPackCartModel.aggregate([
            {
                $match: {
                    userId: req.userData._id,
                    status:1,
                    isDeleted:false
                },
            },
            {
                $lookup: {
                    from: 'foodPackage',
                    localField: 'packageId',
                    foreignField: '_id',
                    as: 'adminPackage',
                },
            },
            {
                $unwind: '$adminPackage',
            },
            {
                $group: {
                    _id: '$_id',
                    userId: { $first: '$userId' },
                    restaurants: { $first: '$restaurants' },
                    adminPackage : {$first : '$adminPackage'},
                    totalAmount: { $first: '$totalAmount' },
                    status: { $first: '$status' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
            {
                $project: {
                    _id: 1,
                    restaurants: 1,
                    adminPackage:1,
                    userId: 1,
                    totalAmount: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1
                },
            },
        ]);

        await Promise.all(result.map(async(item,index)=>{
            result[index].totalRestaurants = item.restaurants.length;
        }))
        return sendSuccessResponse(res, result, success.SUCCESS);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const removeAdminPackCartFromList = async (req,res) =>{
    try {
        if (!req.userData) {
            return sendErrorResponse(res, 'token is required', HttpStatus.BAD_GATEWAY);
        }

        const { packageId ,cartId} = req.params;
        if (!mongoose.isValidObjectId(packageId)) {
            return sendErrorResponse(res, "packageId is invalid", 400);
        }

        if (!req?.userData) {
            return sendErrorResponse(res, 'Session Expired, Please Login Again', 401);
        }

        await AdminFoodPackCartModel.deleteOne({ userId: req.userData._id, packageId: new ObjectId(packageId), _id:new mongoose.Types.ObjectId(cartId) });
        return sendSuccessResponse(res, {}, success.DELETED_SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getAdminPackageDeliveryFare = async (req, res)=>{

    try{
        const {addressCoordinates , restaurants, duration} = req.body;

        if (!addressCoordinates || ((addressCoordinates && addressCoordinates.length!=2 )|| addressCoordinates.includes(null))) {
            return sendErrorResponse(res, 'addressCoordinates required', HttpStatus.BAD_GATEWAY);
        }

        if (!restaurants || restaurants.length<0) {
            return sendErrorResponse(res, 'restaurantCoordinates required', HttpStatus.BAD_GATEWAY);
        }
        const deliveryFareResp = await DeliveryFare_Model.findOne({ service: ServiceType.USER ,status:true});
        let deliveryAmount = 0;

        await Promise.all(restaurants.map(async(restaurant,index)=>{
            const rest = await RestaurantModel.findById(restaurant);
            if (!rest) {
               return res.status(404).json({ message: 'Restaurant not found' });
            }
            // Calculate total Amount
            deliveryAmount = deliveryAmount +
            (Number(deliveryFareResp?.baseFare || 0) +
            getKmRange(
                addressCoordinates[0],
                addressCoordinates[1],
               rest.location.coordinates[0],
               rest.location.coordinates[1]
            ) *
            (deliveryFareResp.perKmFare || 1));
        
        }));
        return res.status(201).json({ status: true, message:" Delivery Amount ", data: { deliveryAmount }});
    }catch(error){
        res.status(500).json({ message: 'Internal server error' });
    }
}



