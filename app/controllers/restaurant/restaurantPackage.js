import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { RestaurantPackageModel } from '../../models/restaurant/restaurantPackage';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { PackageFoodModel } from '../../models/admin/foodPackage.model'
import { Offer_Order_Model } from '../../models/restaurant/offerOrder.model';
import { mongoose } from 'mongoose';
import { populate } from 'dotenv';
import PackageOrderModel from '../../models/user/packageOrder.model';
import AdminPackageOrderModel from '../../models/user/adminPackageOrder.model';
import { REST_PACK_RATING_MODEL } from '../../models/user/restPackageRating.model';
import { notificationModel } from "../../models/admin/notification.model.js"

const crypto = require('crypto');


export const createPackage = async (req, res) => {
    try {
        let { name, goal, categories, durations, description, termsAndCondition } = req.body;
        let { accesstoken } = req.headers;

        if (!goal) {
            return sendErrorResponse(res, 'please send goal', HttpStatus.BAD_REQUEST);
        }
        if (!durations) {
            return sendErrorResponse(res, 'please send duration', HttpStatus.BAD_REQUEST);
        }
        if (!name) {
            return sendErrorResponse(res, 'please send name', HttpStatus.BAD_REQUEST);
        }


        let rest = await RestaurantModel.findOne({ accessToken: accesstoken }, { _id: 1 });

        let existedPackage = await RestaurantPackageModel.findOne({ name: name, restId: rest._id })
        if (existedPackage) {
            return sendErrorResponse(res, 'Package Name already exists', HttpStatus.CONFLICT);
        }

        if (durations.length > 2) {
            return sendErrorResponse(res, 'Durations can not be more that 2 (WEEKLY / MONTHLY)', HttpStatus.CONFLICT);
        }

        if (durations.length > 1 && (durations[0].duration === durations[1].duration)) {
            return sendErrorResponse(res, 'Duration can not be same (WEEKLY / MONTHLY)', HttpStatus.CONFLICT);
        }
        function generatePackageId(length = 8) {
            return crypto.randomBytes(length)
                .toString('base64')
                .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
                .substring(0, length);         // Ensure it's exactly 8 characters
        }

        // Function to check if the packageId exists in the database
        async function isPackageIdUnique(packageId) {
            const existingRestPackage = await RestaurantPackageModel.findOne({ packageId });
            const existingAdminPackage = await PackageFoodModel.findOne({ packageId });
            return !existingRestPackage && !existingAdminPackage;  // Returns true if packageId is unique
        }

        // Generate unique packageId by checking in the database
        async function generateUniquePackageId() {
            let packageId;
            let isUnique = false;

            // Loop until we find a unique packageId
            while (!isUnique) {
                packageId = generatePackageId();
                isUnique = await isPackageIdUnique(packageId);
            }

            return packageId;
        }

        let data = {
            packageId: await generateUniquePackageId(),
            restId: rest._id,
            ...req.body
        }

        const createPackage = await commonService.create(RestaurantPackageModel, data);

        const notification = new notificationModel({
            notification_type: 1,
            title: "new package created successfully",
            description: "new package created successfully",
            sendTo: 1
        });
        await notification.save();

        return sendSuccessResponse(res, createPackage, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getPackages = async (req, res) => {
    try {
        let { page = 1, pageSize = 10, from, to, search, duration, goal, tab, offerId } = req.query;

        let { accesstoken } = req.headers;
        let rest = await RestaurantModel.findOne({ accessToken: accesstoken }, { _id: 1 });

        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query = {}

        if (search && search.length > 0) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: `^${search}`, $options: 'i' } },  // Matches name starting with search
                    { packageId: { $regex: `^${search}`, $options: 'i' } } // Matches packageId starting with search
                ]
            }
        }

        if (duration && duration.length > 0) {
            if (tab == 1) {
                query['durations.duration'] = duration
            }
            if (tab == 2) {
                query.duration = duration
            }
        }
        if (goal && goal.length > 0) {
            query.goal = goal
        }
        if ((from && from.length > 1) || (to && to.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist

            if (from && from.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(from) } });
            }

            if (to && to.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(to) } });
            }
        }
        let totalRestFoodPackages = 0;
        let restPackagesData;
        let totalAdminFoodPackages = 0;
        let adminPackagesData;
        if (tab == 1) { //restFoodPackage
            totalRestFoodPackages = await RestaurantPackageModel.countDocuments({ ...query, restId: rest._id, isDeleted: false });
            restPackagesData = await RestaurantPackageModel.find({ ...query, restId: rest._id, isDeleted: false })
                .sort({ createdAt: -1 })
                .skip(skip) // Skip documents for pagination
                .limit(pageSize); // Limit the number of documents per page
        }
        if (tab == 2) {  //adminFoodPackage

            totalAdminFoodPackages = await PackageFoodModel.countDocuments({ ...query, restaurants: { $elemMatch: { _id: rest._id } }, isDeleted: false });
            adminPackagesData = await PackageFoodModel.find({ ...query, restaurants: { $elemMatch: { _id: rest._id } }, isDeleted: false })
                .sort({ createdAt: -1 })
                .skip(skip) // Skip documents for pagination
                .limit(pageSize) // Limit the number of documents per page
            // After fetching, filtering the restaurants array
            adminPackagesData = adminPackagesData.map(pack => {
                const matchingRestaurant = pack.restaurants.find(restaurant => restaurant._id.equals(rest._id));
                return {
                    ...pack.toObject(),
                    restaurants: matchingRestaurant // Add the single restaurant object
                };
            });

            // if(offerId && offerId.length>0){

            //     let restaurants = new Set();
            //     await Promise.all(adminPackagesData.map(async(pack)=>{
            //     adminPackagesData = await PackageFoodModel.find({...query,restaurants: { $elemMatch: { _id: rest._id }  },isDeleted:false})
            //         restaurants.add(pack.restaurants.map(rest=>rest._id));//adding restaurant _id in new Set restaurants
            //     }))

            //     let offers = await Offer_Order_Model.find({
            //         restId:{$in : arrayFrom(restaurants)},
            //         offerId:new mongoose.Types.ObjectId(offerId),
            //         isActive:true,
            //         packageExpired: { $gte: new Date().getTime() }
            //     },{bannerId:1,offerId:1});
            //     console.log("offers...",offers)
            //     //now need to filter out adminPackagesData.restaurants whos _id not presented in offers 
            //     // and those adminPackagesData array is empty then need to remove those packages from adminPackagesData
            // }
        }

        const response = {
            totalPackages: tab == 1 ? totalRestFoodPackages : totalAdminFoodPackages,      // Total number of orders
            currentPage: page, // Current page number
            totalPages: Math.ceil(tab == 1 ? totalRestFoodPackages : totalAdminFoodPackages / pageSize), // Total pages
            pageSize,          // Items per page
            data: tab == 1 ? restPackagesData : adminPackagesData            // Fetched data for the current page
        };
        res.json({ status: true, message: 'Restaurant Packages Fetched Successfully', data: response });

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const packageStatusUpdate = async (req, res) => {
    try {
        let { status, packageId } = req.query;

        let existedPackage = await RestaurantPackageModel.findOne({ _id: new mongoose.Types.ObjectId(packageId) }, { _id: 1 })

        if (!existedPackage) {
            return sendErrorResponse(res, 'Package not existed on this packageId', HttpStatus.CONFLICT);
        }
        let updatePackageStatus = await RestaurantPackageModel.findOneAndUpdate(
            { _id: existedPackage._id },
            { $set: { status: status } },
            { new: true }
        );
        if (updatePackageStatus) {
            res.json({ status: true, message: 'Restaurant Package status Updated Successfully', data: updatePackageStatus });
        } else {
            res.json({ status: false, message: 'ERROR : Restaurant Package Not Updated', data: {} });
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const updatePackage = async (req, res) => {
    try {
        let { name, goal, categories, durations, description, termsAndCondition, packageId, image } = req.body;

        let existedPackageData = await RestaurantPackageModel.findOne({ _id: new mongoose.Types.ObjectId(packageId) }, { _id: 1 })

        if (!existedPackageData) {
            return sendErrorResponse(res, 'Package not existed on this packageId', HttpStatus.CONFLICT);
        }

        let existedPackageName = await RestaurantPackageModel.findOne({ name: name, _id: { $ne: existedPackageData._id } })

        if (existedPackageName) {
            return sendErrorResponse(res, 'Package Name already exists', HttpStatus.CONFLICT);
        }

        if (durations.length > 2) {
            return sendErrorResponse(res, 'Durations can not be more that 2 (WEEKLY / MONTHLY)', HttpStatus.CONFLICT);
        }

        if (durations.length > 1 && (durations[0].duration === durations[1].duration)) {
            return sendErrorResponse(res, 'Duration can not same (WEEKLY / MONTHLY)', HttpStatus.CONFLICT);
        }

        let setData = {}

        if (name) {
            setData.name = name
        }
        if (goal) {
            setData.goal = goal
        }
        if (categories) {
            setData.categories = categories
        }
        if (description) {
            setData.description = description
        }
        if (durations) {
            setData.durations = durations
        }
        if (termsAndCondition) {
            setData.termsAndCondition = termsAndCondition
        }
        if (image) {
            setData.image = image
        }

        let updatePackageStatus = await RestaurantPackageModel.findOneAndUpdate(
            { _id: existedPackageData._id },
            { $set: setData },
            { new: true }
        );

        if (updatePackageStatus) {
            res.json({ status: true, message: 'Restaurant Package Updated Successfully', data: updatePackageStatus });
        } else {
            res.json({ status: false, message: 'ERROR : Restaurant Package Not Updated', data: {} });
        }

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const deletePackage = async (req, res) => {
    try {
        let { packageId } = req.query;
        let existedPackage = await RestaurantPackageModel.findOne({ _id: new mongoose.Types.ObjectId(packageId) }, { _id: 1 })

        if (!existedPackage) {
            return sendErrorResponse(res, 'Package not existed on this packageId', HttpStatus.CONFLICT);
        }
        let updatePackageStatus = await RestaurantPackageModel.findOneAndUpdate(
            { _id: existedPackage._id },
            { $set: { isDeleted: true } },
            { new: true }
        );
        if (updatePackageStatus) {
            res.json({ status: true, message: 'Restaurant Package Deleted Successfully', data: updatePackageStatus });
        } else {
            res.json({ status: false, message: 'ERROR : Restaurant Package Not Deleted', data: {} });
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const addItems = async (req, res) => {
    try {
        const { categoryId, packageId, itemName, calories, carbs, protein, fat, price, description, type, substitute, image } = req.body;

        if (!packageId || packageId.length < 1) {
            return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT);
        }

        if (!categoryId || categoryId.length < 1) {
            return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT);
        }

        if (!itemName || itemName.length < 1) {
            return sendErrorResponse(res, 'Item Name required', HttpStatus.CONFLICT);
        }
        if (!price || price.length < 1) {
            return sendErrorResponse(res, 'Price Required', HttpStatus.CONFLICT);
        }

        let existedPackage = await RestaurantPackageModel.findById(packageId);
        if (!existedPackage) {
            return sendErrorResponse(res, 'Package Not Found', HttpStatus.NOT_FOUND);
        }

        const categoryIndex = existedPackage.categories.findIndex(item => item._id.toString() === categoryId);

        if (categoryIndex === -1) {
            return sendErrorResponse(res, 'Category Not Found in Package', HttpStatus.NOT_FOUND);
        }

        let setData = {
            itemName: itemName || "",
            calories: calories || "",
            carbs: carbs || "",
            protein: protein || "",
            fat: fat || "",
            price: price || "",
            description: description || "",
            type: type || "",
            image: image || ""
        };

        let substituteBoolean = substitute === 'true';
        if (substituteBoolean == false) {
            existedPackage.categories[categoryIndex].totalItems.push(setData); // totalItems
        } else if (substituteBoolean == true) {
            existedPackage.categories[categoryIndex].substituteItems.push(setData); // substituteItems
        }

        let totalItemsCalories = 0, SubstituteItemsCalories = 0;
        existedPackage.categories.map((category) => {
            category.totalItems.length > 0 && category.totalItems.map((item) => {
                totalItemsCalories = totalItemsCalories + Number(item.calories);
            })
            category.substituteItems.length > 0 && category.substituteItems.map((item) => {
                SubstituteItemsCalories = SubstituteItemsCalories + Number(item.calories);
            })
        })

        existedPackage.totalItemsCalories = totalItemsCalories;
        existedPackage.SubstituteItemsCalories = SubstituteItemsCalories;

        const updatedPackage = await RestaurantPackageModel.updateOne(
            { _id: new mongoose.Types.ObjectId(packageId) },
            { $set: existedPackage },
            { new: true }
        );

        return sendSuccessResponse(res, updatedPackage, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getItems = async (req, res) => {
    try {
        const { packageId, categoryId, search, substitute } = req.query;

        if (!packageId || packageId.length < 1) {
            return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT);
        }

        if (!categoryId || categoryId.length < 1) {
            return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT);
        }

        let substituteBoolean = substitute === 'true';

        let packageData;
        if (substituteBoolean == false) {

            packageData = await RestaurantPackageModel.findOne(
                {
                    '_id': new mongoose.Types.ObjectId(packageId),
                    'categories._id': new mongoose.Types.ObjectId(categoryId)
                },
                {
                    categories: {
                        $elemMatch: {
                            _id: new mongoose.Types.ObjectId(categoryId)
                        }
                    },
                    'categories.totalItems': 1
                }
            )
                .lean();
        } else if (substituteBoolean == true) {
            packageData = await RestaurantPackageModel.findOne(
                {
                    '_id': new mongoose.Types.ObjectId(packageId),
                    'categories._id': new mongoose.Types.ObjectId(categoryId)
                },
                {
                    categories: {
                        $elemMatch: {
                            _id: new mongoose.Types.ObjectId(categoryId)
                        }
                    },
                    'categories.substituteItems': 1
                }
            )
                .lean();

        }

        let data = substituteBoolean == true ? packageData.categories[0].substituteItems : packageData.categories[0].totalItems || []

        if (search && search.length > 0) {
            data = data.filter(item => item.itemName && item.itemName.toLowerCase().startsWith(search.toLowerCase()));
        }


        return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const updateItems = async (req, res) => {
    try {

        const { categoryId, packageId, itemId, itemName, calories, carbs, protein, fat, price, description, type, substitute, image } = req.body;

        if (!packageId || packageId.length < 1) {
            return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT);
        }

        if (!categoryId || categoryId.length < 1) {
            return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT);
        }

        if (!itemId || itemId.length < 1) {
            return sendErrorResponse(res, 'ItemId required', HttpStatus.CONFLICT);
        }

        let existedPackage = await RestaurantPackageModel.findById(packageId);
        if (!existedPackage) {
            return sendErrorResponse(res, 'Package Not Found', HttpStatus.NOT_FOUND);
        }

        const categoryIndex = existedPackage.categories.findIndex(item => item._id.toString() === categoryId);

        if (categoryIndex === -1) {
            return sendErrorResponse(res, 'Category Not Found in Package', HttpStatus.NOT_FOUND);
        }

        let substituteBoolean = substitute === 'true';
        if (substituteBoolean == false) {
            const itemIndex = existedPackage.categories[categoryIndex].totalItems.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return sendErrorResponse(res, 'Item Not Found in Package', HttpStatus.NOT_FOUND);
            }
            let setData = existedPackage.categories[categoryIndex].totalItems[itemIndex];

            if (itemName) { setData.itemName = itemName }
            if (calories) { setData.calories = calories }
            if (carbs) { setData.carbs = carbs }
            if (protein) { setData.protein = protein }
            if (fat) { setData.fat = fat }
            if (price) { setData.price = price }
            if (description) { setData.description = description }
            if (type) { setData.type = type }
            if (image) { setData.image = image }

            existedPackage.categories[categoryIndex].totalItems[itemIndex] = setData; // totalItems
        } else if (substituteBoolean == true) {
            const sustituteIndex = existedPackage.categories[categoryIndex].substituteItems.findIndex(item => item._id.toString() === itemId);
            if (sustituteIndex === -1) {
                return sendErrorResponse(res, ' Substitute Item Not Found in Package', HttpStatus.NOT_FOUND);
            }

            let setData = existedPackage.categories[categoryIndex].substituteItems[sustituteIndex];

            if (itemName) { setData.itemName = itemName }
            if (calories) { setData.calories = calories }
            if (carbs) { setData.carbs = carbs }
            if (protein) { setData.protein = protein }
            if (fat) { setData.fat = fat }
            if (price) { setData.price = price }
            if (description) { setData.description = description }
            if (type) { setData.type = type }

            existedPackage.categories[categoryIndex].substituteItems[sustituteIndex] = setData; // substituteItems
        }

        let totalItemsCalories = 0, SubstituteItemsCalories = 0;
        existedPackage.categories.map((category) => {
            category.totalItems.length > 0 && category.totalItems.map((item) => {
                totalItemsCalories = totalItemsCalories + Number(item.calories);
            })
            category.substituteItems.length > 0 && category.substituteItems.map((item) => {
                SubstituteItemsCalories = SubstituteItemsCalories + Number(item.calories);
            })
        })
        existedPackage.totalItemsCalories = totalItemsCalories;
        existedPackage.SubstituteItemsCalories = SubstituteItemsCalories;

        const updatedPackage = await RestaurantPackageModel.updateOne(
            { _id: new mongoose.Types.ObjectId(packageId) },
            { $set: existedPackage },
            { new: true }
        );

        return sendSuccessResponse(res, updatedPackage, success.SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const deleteItem = async (req, res) => {
    try {
        const { categoryId, packageId, itemId, substitute } = req.query

        if (!packageId && packageId.length < 1) {
            return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT);
        }

        if (!categoryId && categoryId.length < 1) {
            return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT);
        }

        if (!itemId && itemId.length < 1) {
            return sendErrorResponse(res, 'ItemId required', HttpStatus.CONFLICT);
        }

        let existedPackage = await RestaurantPackageModel.findById(packageId);
        if (!existedPackage) {
            return sendErrorResponse(res, 'Package Not Found', HttpStatus.NOT_FOUND);
        }

        const categoryIndex = existedPackage.categories.findIndex(item => item._id.toString() === categoryId);

        if (categoryIndex === -1) {
            return sendErrorResponse(res, 'Category Not Found in Package', HttpStatus.NOT_FOUND);
        }

        let substituteBoolean = substitute === 'true';
        if (substituteBoolean == false) {
            const itemIndex = existedPackage.categories[categoryIndex].totalItems.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return sendErrorResponse(res, 'Item Not Found in Package', HttpStatus.NOT_FOUND);
            }
            // Remove the item from the totalItems array
            existedPackage.categories[categoryIndex].totalItems.splice(itemIndex, 1);
        } else if (substituteBoolean == true) {
            const sustituteIndex = existedPackage.categories[categoryIndex].substituteItems.findIndex(item => item._id.toString() === itemId);
            if (sustituteIndex === -1) {
                return sendErrorResponse(res, ' Substitute Item Not Found in Package', HttpStatus.NOT_FOUND);
            }
            // Remove the item from the totalItems array
            existedPackage.categories[categoryIndex].substituteItems.splice(sustituteIndex, 1);

        }

        let totalItemsCalories = 0, SubstituteItemsCalories = 0;
        existedPackage.categories.map((category) => {
            category.totalItems.length > 0 && category.totalItems.map((item) => {
                totalItemsCalories = totalItemsCalories + Number(item.calories);
            })
            category.substituteItems.length > 0 && category.substituteItems.map((item) => {
                SubstituteItemsCalories = SubstituteItemsCalories + Number(item.calories);
            })
        })

        existedPackage.totalItemsCalories = totalItemsCalories;
        existedPackage.SubstituteItemsCalories = SubstituteItemsCalories;

        const updatedPackage = await RestaurantPackageModel.updateOne(
            { _id: new mongoose.Types.ObjectId(packageId) },
            { $set: existedPackage },
            { new: true }
        );

        return sendSuccessResponse(res, updatedPackage, success.SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const updateAdminPackageStatus = async (req, res) => {
    try {
        const { adminPackageId, status, restId } = req.body;

        if (!adminPackageId || adminPackageId.length < 1) {
            return sendErrorResponse(res, 'Admin Package Id required', HttpStatus.CONFLICT);
        }

        if (!restId || restId.length < 1) {
            return sendErrorResponse(res, 'restId required', HttpStatus.CONFLICT);
        }

        const updateAdminPackage = await PackageFoodModel.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(adminPackageId),
                'restaurants._id': new mongoose.Types.ObjectId(restId) // Match the specific restaurant by restId
            },
            {
                $set: {
                    'restaurants.$.status': status // Update the status of the matched restaurant
                }
            },
            { new: true } // This option returns the modified document
        );

        if (!updateAdminPackage) {
            return res.status(404).json({ message: 'Package not found or restaurant does not exist.' });
        }

        return res.status(200).json({ message: 'Restaurant status updated successfully.', updatedPackage: updateAdminPackage });

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const addAdminPackageItems = async (req, res) => {
    try {
        const { categoryId, restId, packageId, itemName, calories, carbs, protein, fat, price, description, type, substitute, image } = req.body;

        if (!packageId || packageId.length < 1) { return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT); }
        if (!restId || restId.length < 1) { return sendErrorResponse(res, 'restaurant Id required', HttpStatus.CONFLICT); }
        if (!categoryId || categoryId.length < 1) { return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT); }
        if (!itemName || itemName.length < 1) { return sendErrorResponse(res, 'Item Name required', HttpStatus.CONFLICT); }
        if (!price || price.length < 1) { return sendErrorResponse(res, 'Price Required', HttpStatus.CONFLICT); }

        let existedPackage = await PackageFoodModel.findById(packageId);
        if (!existedPackage) { return sendErrorResponse(res, 'Package Not Found', HttpStatus.NOT_FOUND); }

        const restaurantIndex = existedPackage.restaurants.findIndex(item => item._id.toString() === restId);
        if (restaurantIndex === -1) { return sendErrorResponse(res, 'Restaurant Not Found in Package', HttpStatus.NOT_FOUND); }

        const categoryIndex = existedPackage.restaurants[restaurantIndex].categories.findIndex(item => item._id.toString() === categoryId);
        if (categoryIndex === -1) { return sendErrorResponse(res, 'Category Not Found in Package', HttpStatus.NOT_FOUND); }

        let setData = {
            itemName: itemName || "",
            calories: calories || "",
            carbs: carbs || "",
            protein: protein || "",
            fat: fat || "",
            price: price || "",
            description: description || "",
            type: type || "",
            image: image || ""
        };

        let substituteBoolean = substitute === 'true';
        if (substituteBoolean == false) {
            existedPackage.restaurants[restaurantIndex].categories[categoryIndex].totalItems.push(setData); // totalItems
        } else if (substituteBoolean == true) {
            existedPackage.restaurants[restaurantIndex].categories[categoryIndex].substituteItems.push(setData); // substituteItems
        }

        const updatedPackage = await PackageFoodModel.updateOne(
            { _id: new mongoose.Types.ObjectId(packageId) },
            { $set: existedPackage },
            { new: true }
        );

        return sendSuccessResponse(res, updatedPackage, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getAdminPackageItems = async (req, res) => {
    try {
        const { packageId, restId, categoryId, search, substitute } = req.query;

        if (!packageId || packageId.length < 1) { return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT); }
        if (!restId || restId.length < 1) { return sendErrorResponse(res, 'restaurant Id required', HttpStatus.CONFLICT); }
        if (!categoryId || categoryId.length < 1) { return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT); }

        let substituteBoolean = substitute === 'true';

        let packageData = await PackageFoodModel.findOne(
            {
                '_id': new mongoose.Types.ObjectId(packageId),
                'restaurants': {
                    $elemMatch: {
                        _id: new mongoose.Types.ObjectId(restId),
                        categories: {
                            $elemMatch: { _id: new mongoose.Types.ObjectId(categoryId) }
                        }
                    }
                }
            },
            {
                restaurants: {
                    $elemMatch: {
                        _id: new mongoose.Types.ObjectId(restId),
                    }
                }
            }
        )
            .lean();

        if (packageData) {
            packageData.restaurants[0].categories = packageData.restaurants[0].categories.filter(cat => cat._id.toString() === categoryId)
        }

        let data = substituteBoolean == true ? packageData.restaurants[0].categories[0].substituteItems : packageData.restaurants[0].categories[0].totalItems || []
        if (search && search.length > 0) {
            data = data.filter(item => item.itemName && item.itemName.toLowerCase().startsWith(search.toLowerCase()));
        }

        return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const updateAdminPackageItems = async (req, res) => {
    try {

        const { categoryId, restId, packageId, itemId, itemName, calories, carbs, protein, fat, price, description, type, substitute, image } = req.body;

        if (!packageId || packageId.length < 1) { return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT); }
        if (!restId || restId.length < 1) { return sendErrorResponse(res, 'restaurant Id required', HttpStatus.CONFLICT); }
        if (!categoryId || categoryId.length < 1) { return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT); }
        if (!itemId || itemId.length < 1) { return sendErrorResponse(res, 'ItemId required', HttpStatus.CONFLICT); }

        let existedPackage = await PackageFoodModel.findById(packageId);
        if (!existedPackage) { return sendErrorResponse(res, 'Package Not Found', HttpStatus.NOT_FOUND); }

        const restaurantIndex = existedPackage.restaurants.findIndex(item => item._id.toString() === restId);
        if (restaurantIndex === -1) { return sendErrorResponse(res, 'Restaurant Not Found in Package', HttpStatus.NOT_FOUND); }

        const categoryIndex = existedPackage.restaurants[restaurantIndex].categories.findIndex(item => item._id.toString() === categoryId);
        if (categoryIndex === -1) { return sendErrorResponse(res, 'Category Not Found in Package', HttpStatus.NOT_FOUND); }

        let substituteBoolean = substitute === 'true';
        if (substituteBoolean == false) {
            const itemIndex = existedPackage.restaurants[restaurantIndex].categories[categoryIndex].totalItems.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) { return sendErrorResponse(res, 'Item Not Found in Package', HttpStatus.NOT_FOUND); }

            let setData = existedPackage.restaurants[restaurantIndex].categories[categoryIndex].totalItems[itemIndex];

            if (itemName) { setData.itemName = itemName }
            if (calories) { setData.calories = calories }
            if (carbs) { setData.carbs = carbs }
            if (protein) { setData.protein = protein }
            if (fat) { setData.fat = fat }
            if (price) { setData.price = price }
            if (description) { setData.description = description }
            if (type) { setData.type = type }
            if (image) { setData.image = image }

            existedPackage.restaurants[restaurantIndex].categories[categoryIndex].totalItems[itemIndex] = setData; // totalItems
        } else if (substituteBoolean == true) {
            const sustituteIndex = existedPackage.restaurants[restaurantIndex].categories[categoryIndex].substituteItems.findIndex(item => item._id.toString() === itemId);
            if (sustituteIndex === -1) { return sendErrorResponse(res, ' Substitute Item Not Found in Package', HttpStatus.NOT_FOUND); }

            let setData = existedPackage.restaurants[restaurantIndex].categories[categoryIndex].substituteItems[sustituteIndex];

            if (itemName) { setData.itemName = itemName }
            if (calories) { setData.calories = calories }
            if (carbs) { setData.carbs = carbs }
            if (protein) { setData.protein = protein }
            if (fat) { setData.fat = fat }
            if (price) { setData.price = price }
            if (description) { setData.description = description }
            if (type) { setData.type = type }

            existedPackage.restaurants[restaurantIndex].categories[categoryIndex].substituteItems[sustituteIndex] = setData; // substituteItems
        }

        const updatedPackage = await PackageFoodModel.updateOne(
            { _id: new mongoose.Types.ObjectId(packageId) },
            { $set: existedPackage },
            { new: true }
        );

        return sendSuccessResponse(res, updatedPackage, success.SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const deleteAdminPackageItem = async (req, res) => {
    try {
        const { categoryId, restId, packageId, itemId, substitute } = req.query

        if (!packageId && packageId.length < 1) { return sendErrorResponse(res, 'packageId required', HttpStatus.CONFLICT); }
        if (!restId || restId.length < 1) { return sendErrorResponse(res, 'restaurant Id required', HttpStatus.CONFLICT); }
        if (!categoryId && categoryId.length < 1) { return sendErrorResponse(res, 'categoryId required', HttpStatus.CONFLICT); }
        if (!itemId && itemId.length < 1) { return sendErrorResponse(res, 'ItemId required', HttpStatus.CONFLICT); }

        let existedPackage = await PackageFoodModel.findById(packageId);
        if (!existedPackage) { return sendErrorResponse(res, 'Package Not Found', HttpStatus.NOT_FOUND); }

        const restaurantIndex = existedPackage.restaurants.findIndex(item => item._id.toString() === restId);
        if (restaurantIndex === -1) { return sendErrorResponse(res, 'Restaurant Not Found in Package', HttpStatus.NOT_FOUND); }

        const categoryIndex = existedPackage.restaurants[restaurantIndex].categories.findIndex(item => item._id.toString() === categoryId);
        if (categoryIndex === -1) { return sendErrorResponse(res, 'Category Not Found in Package', HttpStatus.NOT_FOUND); }

        let substituteBoolean = substitute === 'true';
        if (substituteBoolean == false) {
            const itemIndex = existedPackage.restaurants[restaurantIndex].categories[categoryIndex].totalItems.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) { return sendErrorResponse(res, 'Item Not Found in Package', HttpStatus.NOT_FOUND); }
            // Remove the item from the totalItems array
            existedPackage.restaurants[restaurantIndex].categories[categoryIndex].totalItems.splice(itemIndex, 1);
        } else if (substituteBoolean == true) {
            const sustituteIndex = existedPackage.restaurants[restaurantIndex].categories[categoryIndex].substituteItems.findIndex(item => item._id.toString() === itemId);
            if (sustituteIndex === -1) { return sendErrorResponse(res, ' Substitute Item Not Found in Package', HttpStatus.NOT_FOUND); }
            // Remove the item from the totalItems array
            existedPackage.restaurants[restaurantIndex].categories[categoryIndex].substituteItems.splice(sustituteIndex, 1);

        }

        const updatedPackage = await PackageFoodModel.updateOne(
            { _id: new mongoose.Types.ObjectId(packageId) },
            { $set: existedPackage },
            { new: true }
        );

        return sendSuccessResponse(res, updatedPackage, success.SUCCESS, HttpStatus.OK);

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

// export const getRestaurantspackagesOrders = async(req,res)=>{
//     try{
//         let {page = 1, pageSize = 10,from,to,search,tab} = req.query

//           // Convert page and pageSize to numbers, in case they are passed as strings
//           page = parseInt(page);
//           pageSize = parseInt(pageSize);

//           // Calculate the number of documents to skip
//           const skip = (page - 1) * pageSize;

//           let query ={}

//           if (search && search.length > 0) {
//               query ={
//                   ...query,
//                   orderId: { $regex: `^${search}`, $options: 'i' } 
//                 //   $or: [
//                 //       { name: { $regex: `^${search}`, $options: 'i' } },  // Matches name starting with search
//                 //       { packageId: { $regex: `^${search}`, $options: 'i' } } // Matches packageId starting with search
//                 //   ]
//               }
//           }

//         if ((from && from.length > 1) || (to && to.length > 1)) {
//             query.$and = query.$and || []; // Initialize $and if it doesn't exist

//             if (from && from.length > 1) {
//                 query.$and.push({ createdAt: { $gte: Number(from) } });
//             }

//             if (to && to.length > 1) {
//                 query.$and.push({ createdAt: { $lte: Number(to) } });
//             }
//         }

//         if(tab === 'Active'){
//             query.expired = false
//         }else if(tab === 'Expired'){
//             query.expired = true
//         }
//         let RestPackageOrdersCount = await PackageOrderModel.countDocuments({...query});
//         let restPackageOrders = await PackageOrderModel.find({...query},
//             {orderId:1,userId:1,addressId:1,restaurentCartId:1,createdAt:1,startDate:1,time:1,totalAmount:1,dates:1,packageDetails:1}
//         )
//         .sort({createdAt:-1})
//         .skip(skip) // Skip documents for pagination
//         .limit(pageSize) // Limit the number of documents per page
//         .populate({
//             path:'userId',
//             select:'countryCode mobileNumber fullName'
//         })
//         .populate({
//             path:'addressId',
//             select:'address houseNo buildingName landmarkName'
//         })
//         .populate({
//             path: 'restaurentCartId',
//             populate:{
//                 path:'packageId',
//                 select : 'goal name description termsAndCondition durations' 
//             },
//             populate: {
//                path: 'restId',
//                select: 'resName profileType'
//             },
//             select: 'restId duration packageId'
//          })

//          let response = [];
//          restPackageOrders.map((data) => {
//             const packageId = data?.restaurentCartId?.packageId;
//             const durations = packageId?.durations;

//             let duration = durations && durations.find(duration => duration.duration === data.restaurentCartId.duration);

//             response.push({
//                 orderId : data.orderId,
//                 packageDetails : {
//                     goal : packageId?.goal || 'N/A',
//                     name : packageId?.name || 'N/A',
//                     price : duration?.packagePrice || 0,
//                     purchaseDate : data.createdAt,
//                     packageStartOn : data.startDate,
//                     description : packageId?.description || 'N/A',
//                     termsAndCondition : packageId?.termsAndCondition || 'N/A',
//                 },
//                 customerDetails :{
//                     countryCode : data.userId?.countryCode || 'N/A',
//                     name : data.userId?.fullName || 'N/A',
//                     contactNumber : data.userId?.mobileNumber || 'N/A',
//                     address : data.addressId || {},
//                 },
//                 purchaseDateTime : data.createdAt,
//                 amount : data.totalAmount,
//                 menu : data.packageDetails,
//                 dates : data.dates,
//                 expiredOn : data.dates?.[data.dates.length - 1] || 'N/A',
//             })
//         })

//          let data = {
//             totalorders : RestPackageOrdersCount,
//             orders : response
//          }

//          return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);


//     }catch(error){
//         console.log("error",error)
//         return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//     }
// }

export const getRestaurantspackagesOrders = async (req, res) => {
    try {
        let { page = 1, pageSize = 10, from, to, search, tab } = req.query
        const restaurantData = req.restaurantData;
        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query = {}

        if (search && search.length > 0) {
            query = {
                ...query,
                orderId: { $regex: `^${search}`, $options: 'i' }
                //   $or: [
                //       { name: { $regex: `^${search}`, $options: 'i' } },  // Matches name starting with search
                //       { packageId: { $regex: `^${search}`, $options: 'i' } } // Matches packageId starting with search
                //   ]
            }
        }

        if ((from && from.length > 1) || (to && to.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist

            if (from && from.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(from) } });
            }

            if (to && to.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(to) } });
            }
        }

        if (tab === 'Active') {
            query.expired = false
        } else if (tab === 'Expired') {
            query.expired = true
        }

        let RestPackageOrdersCount = await PackageOrderModel.countDocuments(query);
        let restPackageOrders = await PackageOrderModel.find(query,
            { orderId: 1, userId: 1, addressId: 1, restaurentCartId: 1, createdAt: 1, startDate: 1, time: 1, totalAmount: 1, dates: 1, packageDetails: 1, suspended: 1, suspendReason: 1 }
        )
            .sort({ createdAt: -1 })
            .skip(skip) // Skip documents for pagination
            .limit(pageSize) // Limit the number of documents per page
            .populate({
                path: 'userId',
                select: 'countryCode mobileNumber fullName'
            })
            .populate({
                path: 'addressId',
                select: 'address houseNo buildingName landmarkName'
            })
            .populate({
                path: 'restaurentCartId',
                populate: [
                    {
                        path: 'restId',
                        select: '_id resName profileType'
                    },
                    {
                        path: 'packageId',
                        select: 'goal name description termsAndCondition durations'
                    }],
                select: 'restId duration packageId'
            })

        let filteredOrders = restPackageOrders.filter(
            (data) => data?.restaurentCartId?.restId?._id?.toString() === restaurantData._id.toString()
        );

        let response = [];
        filteredOrders.forEach((data) => {
            const packageId = data?.restaurentCartId?.packageId;
            const durations = packageId?.durations;

            let duration = durations && durations.find((duration) => duration.duration === data.restaurentCartId.duration);

            response.push({
                _id: data._id,
                orderId: data.orderId,
                restId: data.restaurentCartId.restId._id,
                packageDetails: {
                    goal: packageId?.goal || 'N/A',
                    name: packageId?.name || 'N/A',
                    price: duration?.packagePrice || 0,
                    purchaseDate: data.createdAt,
                    packageStartOn: data.startDate,
                    description: packageId?.description || 'N/A',
                    termsAndCondition: packageId?.termsAndCondition || 'N/A',
                },
                customerDetails: {
                    countryCode: data.userId?.countryCode || 'N/A',
                    name: data.userId?.fullName || 'N/A',
                    contactNumber: data.userId?.mobileNumber || 'N/A',
                    address: data.addressId || {},
                },
                purchaseDateTime: data.createdAt,
                amount: data.totalAmount,
                menu: data.packageDetails,
                dates: data.dates,
                expiredOn: data.dates?.[data.dates.length - 1] || 'N/A',
                suspended: data?.suspended || false,
                suspendReason: data?.suspendReason || ""
            });
        });

        let data = {
            totalorders: filteredOrders.length,
            orders: response,
        };

        return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);


    } catch (error) {
        console.log("error", error)
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getAdminpackagesOrders = async (req, res) => {
    try {
        let { page = 1, pageSize = 10, from, to, search, tab } = req.query
        const restaurantData = req.restaurantData;
        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query = {}

        if (search && search.length > 0) {
            query = {
                ...query,
                orderId: { $regex: `^${search}`, $options: 'i' }
            }
        }

        if ((from && from.length > 1) || (to && to.length > 1)) {
            query.$and = query.$and || []; // Initialize $and if it doesn't exist

            if (from && from.length > 1) {
                query.$and.push({ createdAt: { $gte: Number(from) } });
            }

            if (to && to.length > 1) {
                query.$and.push({ createdAt: { $lte: Number(to) } });
            }
        }

        if (tab === 'Active') {
            query.packagesExpired = false
        } else if (tab === 'Expired') {
            query.packagesExpired = true
        }
        let adminPackageOrdersCount = await AdminPackageOrderModel.countDocuments({ ...query });
        let adminPackageOrders = await AdminPackageOrderModel.find({ ...query },
            { orderId: 1, userId: 1, addressId: 1, cartId: 1, createdAt: 1, totalAmount: 1, restaurants: 1 }
        )
            .sort({ createdAt: -1 })
            .skip(skip) // Skip documents for pagination
            .limit(pageSize) // Limit the number of documents per page
            .populate({
                path: 'userId',
                select: 'countryCode mobileNumber fullName'
            })
            .populate({
                path: 'addressId',
                select: 'address houseNo buildingName landmarkName'
            })
            .populate({
                path: 'cartId',
                populate: {
                    path: 'packageId',
                    select: 'goal name description termsAndCondition duration price'
                },
                select: "packageId"
            }).lean()

        let filteredOrders = adminPackageOrders.filter((data) =>
            data?.restaurants?.some((rest) => rest?._id?.toString() === restaurantData._id.toString())
        );

        //  let response = [];
        // await Promise.all(
        //     adminPackageOrders.map(async(data)=>{

        //         await Promise.all(data.restaurants.length>0 && data.restaurants.map(async(rest,index)=>{
        //             let restData = await RestaurantModel.findOne({_id:new mongoose.Types.ObjectId(rest._id)},{_id:0,resName:1,ownerName:1})
        //             data.restaurants[index].restData = restData
        //             data.restaurants[index].expiredOn = rest.dates[ rest.dates.length-1]
        //          }))

        //         response.push({
        //             orderId : data.orderId,
        //             packageDetails : {
        //                 goal : data.cartId.packageId.goal,
        //                 name : data.cartId.packageId.name,
        //                 price : data.cartId.packageId.price,
        //                 purchaseDate : data.createdAt,
        //                 description : data.cartId.packageId.description,
        //                 termsAndCondition : data.cartId.packageId.termsAndCondition,
        //             },
        //             customerDetails :{
        //                 countryCode : data.userId.countryCode,
        //                 name : data.userId.fullName,
        //                 contactNumber : data.userId.fullName,
        //                 address : data.addressId
        //             },
        //             purchaseDateTime : data.createdAt,
        //             amount : data.totalAmount,
        //             restuarantsAndDates : data.restaurants,
        //             // expiredOn : data.dates[ data.dates.length-1]
        //         })
        //      })
        // )

        let response = [];
        await Promise.all(
            filteredOrders.map(async (data) => {

                let suspended = false;
                let suspendReason = '';
                await Promise.all(
                    data.restaurants.length > 0 &&
                    data.restaurants.map(async (rest, index) => {
                        let restData = await RestaurantModel.findOne(
                            { _id: new mongoose.Types.ObjectId(rest._id) },
                            { _id: 0, resName: 1, ownerName: 1 }
                        );
                        data.restaurants[index].restData = restData;
                        data.restaurants[index].expiredOn = rest.dates[rest.dates.length - 1];

                        if (rest._id.toString() === restaurantData._id.toString()) {
                            suspended = rest.suspended;
                            suspendReason = rest.suspendReason;
                        }
                    })
                );

                response.push({
                    _id: data._id,
                    orderId: data.orderId,
                    packageDetails: {
                        goal: data.cartId.packageId.goal,
                        name: data.cartId.packageId.name,
                        price: data.cartId.packageId.price,
                        purchaseDate: data.createdAt,
                        description: data.cartId.packageId.description,
                        termsAndCondition: data.cartId.packageId.termsAndCondition,
                    },
                    customerDetails: {
                        countryCode: data.userId.countryCode,
                        name: data.userId.fullName,
                        contactNumber: data.userId.mobileNumber,
                        address: data.addressId,
                    },
                    purchaseDateTime: data.createdAt,
                    amount: data.totalAmount,
                    restaurantsAndDates: data.restaurants,
                    suspended: suspended,
                    suspendReason: suspendReason
                });
            })
        );

        //  let data = {
        //     totalorders : adminPackageOrdersCount,
        //     orders : response
        //  }

        let data = {
            totalorders: filteredOrders.length,
            orders: response,
        };


        return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);


    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const updateRestPackStatus = async (req, res) => {
    try {
        let { orderId, suspended, suspendReason } = req.body
        let date = null;
        if (suspended === true) {
            date = new Date().getTime()
        }

        let packageOrder = await PackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId) })
        // console.log("packageOrder....",packageOrder)
        if (suspended === false) {
            const suspendedDate = packageOrder.suspendedDate;
            const currentDate = new Date(1737616915000);
            const currentTime = currentDate.getTime();
            // const startDate = new Date(currentDate.setHours(0, 0, 0, 0)).getTime(); // 12:00 am
            // const endDate = new Date(currentDate.setHours(23, 59, 59, 999)).getTime();  //11:59:59 PM

            let statusOneCount = 0;
            if (currentTime >= packageOrder.dates[0].date) {
                packageOrder.dates.filter((dateObj) => {
                    const date = dateObj.date;
                    if (date >= suspendedDate && date <= currentTime) {
                        if (dateObj.status === 1) {   // Check if the status is 1, then increment the count
                            statusOneCount++;
                            dateObj.status = 0; // Update status
                        }
                    }
                });
            }

            // if (statusOneCount > 0) {
            //     const lastDateObj = packageOrder.dates[packageOrder.dates.length - 1];
            //     const lastDateTimestamp = lastDateObj.date;

            //     for (let i = 1; i <= statusOneCount; i++) {
            //         const newDate = new Date(lastDateTimestamp);
            //         newDate.setDate(newDate.getDate() + i);
            //         packageOrder.dates.push({
            //             date: newDate.getTime()
            //         });
            //     }
            // }

            if (statusOneCount > 0) {
                let currentTimeGreater = false;
                let lastDateObj = null;
                let lastDateTimestamp = null;
                if (currentTime <= packageOrder.dates[packageOrder.dates.length - 1].date) {
                    lastDateObj = packageOrder.dates[packageOrder.dates.length - 1];
                    lastDateTimestamp = lastDateObj.date;
                }
                if (currentTime > packageOrder.dates[packageOrder.dates.length - 1].date) {
                    lastDateTimestamp = currentTime;
                    currentTimeGreater = true
                }

                if (currentTimeGreater === true) {
                    const lastDate = new Date(packageOrder.dates[packageOrder.dates.length - 1].date);
                    const diffTime = currentTime - lastDate.getTime();
                    const skippedDays = Math.floor(diffTime / (1000 * 3600 * 24)); // Convert to days
                    for (let i = 1; i <= skippedDays; i++) {
                        lastDate.setDate(lastDate.getDate() + 1);
                        packageOrder.dates.push({
                            date: lastDate.getTime(),
                            status: 0
                        });
                    }
                }
                for (let i = 1; i <= statusOneCount; i++) {
                    const newDate = new Date(lastDateTimestamp);
                    newDate.setDate(newDate.getDate() + i);
                    packageOrder.dates.push({
                        date: newDate.getTime()
                    });
                }
            }

        }

        packageOrder.suspended = suspended;
        packageOrder.suspendReason = suspendReason;
        packageOrder.suspendedDate = date


        let updateOrder = await PackageOrderModel.findByIdAndUpdate(
            orderId,
            { $set: packageOrder },
            { new: true }
        )

        if (suspended === true) {
            return sendSuccessResponse(res, updateOrder, 'Order is Suspended', HttpStatus.OK);
        } else {
            return sendSuccessResponse(res, updateOrder, 'Order is Active ', HttpStatus.OK);
        }

    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const updateAdminPackStatus = async (req, res) => {
    try {
        let { orderId, restId, suspended, suspendReason } = req.body;

        let date = null;
        if (suspended === true) {
            date = new Date().getTime()
        }

        let order = await AdminPackageOrderModel.findOne({ _id: new mongoose.Types.ObjectId(orderId) });
        order.restaurants.map((rest) => {
            if (rest._id.toString() === restId) {

                if (suspended === false) {
                    const suspendedDate = rest.suspendedDate;
                    const currentDate = new Date();
                    const currentTime = currentDate.getTime();
                    // const startDate = new Date(currentDate.setHours(0, 0, 0, 0)).getTime(); // 12:00 am
                    // const endDate = new Date(currentDate.setHours(23, 59, 59, 999)).getTime();  //11:59:59 PM

                    let statusOneCount = 0;
                    if (currentTime >= rest.dates[0].date) {
                        rest.dates.filter((dateObj) => {
                            const date = dateObj.date;
                            if (date >= suspendedDate && date <= currentTime) {
                                if (dateObj.status === 1) {   // Check if the status is 1, then increment the count
                                    statusOneCount++;
                                    dateObj.status = 0; // Update status
                                }
                            }
                        });
                    }

                    if (statusOneCount > 0) {
                        let currentTimeGreater = false;
                        let lastDateObj = null;
                        let lastDateTimestamp = null;
                        if (currentTime <= rest.dates[rest.dates.length - 1].date) {
                            lastDateObj = rest.dates[rest.dates.length - 1];
                            lastDateTimestamp = lastDateObj.date;
                        }
                        if (currentTime > rest.dates[rest.dates.length - 1].date) {
                            lastDateTimestamp = currentTime;
                            currentTimeGreater = true
                        }

                        if (currentTimeGreater === true) {
                            const lastDate = new Date(rest.dates[rest.dates.length - 1].date);
                            const diffTime = currentTime - lastDate.getTime();
                            const skippedDays = Math.floor(diffTime / (1000 * 3600 * 24)); // Convert to days
                            // Now add the skipped dates to the rest.dates array
                            for (let i = 1; i <= skippedDays; i++) {
                                lastDate.setDate(lastDate.getDate() + 1);
                                rest.dates.push({
                                    date: lastDate.getTime(),
                                    status: 0
                                });
                            }
                        }
                        for (let i = 1; i <= statusOneCount; i++) {
                            const newDate = new Date(lastDateTimestamp);
                            newDate.setDate(newDate.getDate() + i);
                            rest.dates.push({
                                date: newDate.getTime()
                            });
                        }
                    }

                }

                rest.suspended = suspended;
                rest.suspendReason = suspendReason;
                rest.suspendedDate = date
            }
        })
        let updateOrder = await AdminPackageOrderModel.findByIdAndUpdate(
            order._id,
            { $set: order },
            { new: true }
        )

        if (suspended === true) {
            return sendSuccessResponse(res, updateOrder, 'Order is Suspended', HttpStatus.OK);
        } else {
            return sendSuccessResponse(res, updateOrder, 'Order is Active ', HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}



//rest package rating 

export const restPackRating = async (req, res) => {
    try {
        let resId = req?.restaurantData?._id;

        let { page = 1, pageSize = 10, search } = req.query;

        // Convert page and pageSize to numbers, in case they are passed as strings
        page = parseInt(page);
        pageSize = parseInt(pageSize);

        // Calculate the number of documents to skip
        const skip = (page - 1) * pageSize;

        let query = {};
        if (search && search.length > 0) {
            // Add search for orderId after populating the orderId
            query = {
                ...query,
                // orderId will be populated with the full order object, so we can apply the regex to the orderId field inside the object
                'orderId.orderId': { $regex: `^${search}`, $options: 'i' }
            };
        }

        // Step 1: Fetch all ratings to calculate the average rating
        let allRatings = await REST_PACK_RATING_MODEL.find({ ...query, restId: resId }, {
            star: 1
        });

        // Step 2: Calculate the total sum of ratings and the total count
        let totalRatingsCount = allRatings.length;
        let totalStars = allRatings.reduce((sum, rating) => sum + rating.star, 0);

        // Calculate the average rating
        let avgRating = totalRatingsCount > 0 ? totalStars / totalRatingsCount : 0; // Avoid division by zero

        // Step 3: Fetch the paginated ratings
        let restaurantRatings = await REST_PACK_RATING_MODEL.find({ ...query, restId: resId }, {
            userId: 1,
            orderId: 1,
            createdAt: 1,
            star: 1,
            review: 1,
            restId: 1,
            status: 1
        })
            .populate({ path: 'userId', select: 'fullName' })
            .populate({ path: 'orderId', select: 'orderId' })  // Populate the orderId field
            .populate({ path: 'restId', select: 'resName' })
            .sort({ createdAt: -1 })
            .skip(skip) // Skip documents for pagination
            .limit(pageSize); // Limit the number of documents per page

        // Step 4: Return the response with the average rating and paginated data
        let data = {
            totalRatingsCount,
            avgRating,  // Include the average rating
            page,
            pageSize,
            restaurantRatings
        };

        return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

