import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { GroceryProductModel } from '../../models/grocery/product.model';
import { GroceryCategoryModel } from '../../models/admin/groceryCategory.model';
import { GrocerySubCategoryModel } from '../../models/admin/grocerySubCategory.model';
import { success } from '../../responses/messages';
import mongoose from 'mongoose';


export const getCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let matchStage = {};

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: parseInt(startDate),
                $lte: parseInt(endDate)
            };
        }

        const categories = await GroceryCategoryModel.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "GrocerySubCategory",
                    localField: "_id",
                    foreignField: "category",
                    as: "subCategories"
                }
            },
            {
                $addFields: {
                    totalSubcategories: { $size: "$subCategories" }
                }
            },
            {
                $project: {
                    subCategories: 0
                }
            },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        const totalCategories = await GroceryCategoryModel.countDocuments();

        return sendSuccessResponse(
            res,
            {
                categories,
                totalPages: Math.ceil(totalCategories / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalCategories
            },
            success.SUCCESS,
            HttpStatus.OK
        );
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};


export const getSubCategoriesByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, search, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const seller = req?.restaurantData || { _id: "679b5b382092c011f1d152c7" };
        if (!seller) {
            return sendErrorResponse(res, "Seller data is missing", HttpStatus.BAD_REQUEST);
        }

        const category = await GroceryCategoryModel.findById(id);
        if (!category) {
            return sendErrorResponse(res, "Category not found", HttpStatus.NOT_FOUND);
        }

        const matchStage = { category: new mongoose.Types.ObjectId(id) }

        if (search) {
            matchStage.name = new RegExp(search, 'i')
        }

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: parseInt(startDate),
                $lte: parseInt(endDate)
            };
        }

        const subCategories = await GrocerySubCategoryModel.aggregate([
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: "GroceryProduct",
                    let: { subCategoryId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$subCategoryId", "$$subCategoryId"] },
                                        { $eq: ["$sellerId", new mongoose.Types.ObjectId(seller._id)] },
                                        { $eq: ["$isDeleted", false] },
                                    ]
                                }
                            }
                        },
                        {
                            $count: "totalProducts"
                        }
                    ],
                    as: "productCount"
                }
            },
            {
                $addFields: {
                    totalProducts: { $ifNull: [{ $arrayElemAt: ["$productCount.totalProducts", 0] }, 0] }
                }
            },
            {
                $project: {
                    productCount: 0
                }
            },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        const totalSubCategories = await GrocerySubCategoryModel.countDocuments({ category: id });

        return sendSuccessResponse(res, {
            subCategories,
            totalPages: Math.ceil(totalSubCategories / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalSubCategories
        }, "Subcategories List", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};


export const addProduct = async (req, res) => {
    try {
        let {
            categoryId,
            subCategoryId,
            name,
            brand,
            countryOrigin,
            description,
            images,
            variants
        } = req.body;

        const seller = req?.restaurantData || { _id: "679b5b382092c011f1d152c7" };
        if (!seller) {
            return sendErrorResponse(res, "Seller data is missing", HttpStatus.BAD_REQUEST);
        }

        const requiredFields = { categoryId, subCategoryId, images, name, brand, variants };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                return sendErrorResponse(res, `${key} is required`, HttpStatus.BAD_REQUEST);
            }
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return sendErrorResponse(res, "Invalid categoryId", HttpStatus.BAD_REQUEST);
        }
        if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
            return sendErrorResponse(res, "Invalid subCategoryId", HttpStatus.BAD_REQUEST);
        }

        const cat = await GroceryCategoryModel.findById(categoryId);
        if (!cat) {
            return sendErrorResponse(res, "Category not found", HttpStatus.NOT_FOUND);
        }

        const subcat = await GrocerySubCategoryModel.findOne({ _id: subCategoryId, category: cat._id });
        if (!subcat) {
            return sendErrorResponse(res, "Sub-Category not found", HttpStatus.NOT_FOUND);
        }

        const newProduct = await GroceryProductModel.create({
            sellerId: seller._id,
            categoryId,
            subCategoryId,
            name,
            brand,
            countryOrigin,
            description,
            images,
            variants
        });

        return sendSuccessResponse(res, newProduct, "Product added successfully", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

export const editProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        let {
            categoryId,
            subCategoryId,
            name,
            brand,
            countryOrigin,
            description,
            images,
            variants,
            isActive,
            isDeleted
        } = req.body;

        const seller = req?.restaurantData || { _id: "679b5b382092c011f1d152c7" };
        if (!seller) {
            return sendErrorResponse(res, "Seller data is missing", HttpStatus.BAD_REQUEST);
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return sendErrorResponse(res, "Invalid productId", HttpStatus.BAD_REQUEST);
        }

        const product = await GroceryProductModel.findOne({ _id: productId, sellerId: seller._id });
        if (!product) {
            return sendErrorResponse(res, "Product not found", HttpStatus.NOT_FOUND);
        }

        if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
            return sendErrorResponse(res, "Invalid categoryId", HttpStatus.BAD_REQUEST);
        }

        if (subCategoryId && !mongoose.Types.ObjectId.isValid(subCategoryId)) {
            return sendErrorResponse(res, "Invalid subCategoryId", HttpStatus.BAD_REQUEST);
        }

        if (categoryId) {
            const cat = await GroceryCategoryModel.findById(categoryId);
            if (!cat) {
                return sendErrorResponse(res, "Category not found", HttpStatus.NOT_FOUND);
            }
        }

        if (subCategoryId) {
            const subcat = await GrocerySubCategoryModel.findOne({ _id: subCategoryId, category: categoryId });
            if (!subcat) {
                return sendErrorResponse(res, "Sub-Category not found", HttpStatus.NOT_FOUND);
            }
        }

        const updatedProduct = await GroceryProductModel.findByIdAndUpdate(
            productId,
            {
                $set: {
                    ...(categoryId && { categoryId }),
                    ...(subCategoryId && { subCategoryId }),
                    ...(name && { name }),
                    ...(brand && { brand }),
                    ...(countryOrigin && { countryOrigin }),
                    ...(description && { description }),
                    ...(images && { images }),
                    ...(variants && { variants }),
                    ...(isActive && { isActive }),
                    ...(isDeleted && { isDeleted })
                }
            },
            { new: true }
        );

        return sendSuccessResponse(res, updatedProduct, "Product updated successfully", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

export const getProductsBySubcategory = async (req, res) => {
    try {
        const { subCategoryId } = req.params;
        const { search = "", page = 1, limit = 10, startDate, endDate } = req.query;

        const seller = req?.restaurantData || { _id: "679b5b382092c011f1d152c7" };
        if (!seller) {
            return sendErrorResponse(res, "Seller data is missing", HttpStatus.BAD_REQUEST);
        }

        if (subCategoryId && !mongoose.Types.ObjectId.isValid(subCategoryId)) {
            return sendErrorResponse(res, "Invalid subCategoryId", HttpStatus.BAD_REQUEST);
        }

        const subcat = await GrocerySubCategoryModel.findOne({ _id: subCategoryId });
        if (!subcat) {
            return sendErrorResponse(res, "Sub-Category not found", HttpStatus.NOT_FOUND);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let filter = {
            isDeleted: false,
            subCategoryId,
            sellerId: seller._id,
        };

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: parseInt(startDate),
                $lte: parseInt(endDate)
            };
        }

        const products = await GroceryProductModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalProducts = await GroceryProductModel.countDocuments(filter);

        return sendSuccessResponse(
            res,
            {
                products,
                totalPages: Math.ceil(totalProducts / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalProducts
            },
            "Products fetched successfully",
            HttpStatus.OK
        );
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};






