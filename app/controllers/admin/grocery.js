import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { GroceryModel } from '../../models/grocery/grocery.model';
import { GroceryCategoryModel } from '../../models/admin/groceryCategory.model';
import { GrocerySubCategoryModel } from '../../models/admin/grocerySubCategory.model';
import mongoose from 'mongoose';

export const getResListPending = async (req, res) => {
    try {
        const getAllRest = await commonService.getAll(GroceryModel, {
            restaurantStatus: 0, isBankDetailsUpdated
                : true
        });
        if (getAllRest) {
            sendSuccessResponse(res, getAllRest, success.LIST_FETCH, HttpStatus.OK);
            return;
        } else {
            return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getResListAccepted = async (req, res) => {
    try {
        const getAllRest = await commonService.getAll(GroceryModel, { restaurantStatus: 1 });
        if (getAllRest) {
            sendSuccessResponse(res, getAllRest, success.LIST_FETCH, HttpStatus.OK);
            return;
        } else {
            return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getResListRejected = async (req, res) => {
    try {
        const getAllRest = await commonService.getAll(GroceryModel, { restaurantStatus: 2 });
        if (getAllRest) {
            sendSuccessResponse(res, getAllRest, success.LIST_FETCH, HttpStatus.OK);
            return;
        } else {
            return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
        }
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const updateResStatus = async (req, res) => {
    try {
        const { id, restaurantStatus, rejected_reason } = req.body;
        const checkUser = await commonService.findById(GroceryModel, { _id: id }, {});
        if (!checkUser) {
            return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
        }
        let data = {
            restaurantStatus: restaurantStatus,
            rejected_reason: rejected_reason ? rejected_reason : '',
        };

        if (restaurantStatus === 2) {
            data.isBankDetailsUpdated = false;
            data.isDocumentsUploaded = false;
        }
        const updated = await commonService.findOneAndUpdate(GroceryModel, checkUser._id, data);
        if (updated) {
            return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
        }
        return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const blockUnblockUser = async (req, res) => {
    try {
        const { id, isBlocked } = req.body;
        const checkUser = await commonService.findById(GroceryModel, { _id: id }, {});
        if (!checkUser) {
            return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
        }
        const data = {
            isBlocked: isBlocked,
        };
        const updated = await commonService.findOneAndUpdate(GroceryModel, checkUser._id, data);
        if (updated) {
            return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
        }
        return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const addCategory = async (req, res) => {
    try {
        const { name, icon } = req.body;
        const existing = await GroceryCategoryModel.findOne({ name });
        if (existing) {
            return sendErrorResponse(res, "Category already exist with this name", HttpStatus.BAD_REQUEST);
        }
        const category = new GroceryCategoryModel({ name, icon });
        const saved = await category.save();
        return sendSuccessResponse(res, saved, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const editCategory = async (req, res) => {
    try {
        const { id, name, icon } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, "Invalid category ID", HttpStatus.BAD_REQUEST);
        }

        const existing = await GroceryCategoryModel.findOne({ _id: { $ne: id }, name: new RegExp(`^${name}$`, "i") });

        if (existing) {
            return sendErrorResponse(res, "Category already exists with this name", HttpStatus.BAD_REQUEST);
        }

        const category = await GroceryCategoryModel.findByIdAndUpdate(id, { name, icon }, { new: true });

        if (!category) {
            return sendErrorResponse(res, "Category not found", HttpStatus.NOT_FOUND);
        }

        return sendSuccessResponse(res, category, "Category updated", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

export const getCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const categories = await GroceryCategoryModel.find()
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalCategories = await GroceryCategoryModel.countDocuments();

        return sendSuccessResponse(res, {
            categories,
            totalPages: Math.ceil(totalCategories / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalCategories
        }, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

export const addSubCategory = async (req, res) => {
    try {
        const { name, icon, category } = req.body;
        const cat = await GroceryCategoryModel.findById(category);
        if (!cat) {
            return sendErrorResponse(res, "Category not found", HttpStatus.NOT_FOUND);
        }
        const existing = await GroceryCategoryModel.findOne({ name, category });
        if (existing) {
            return sendErrorResponse(res, "Sub-Category already exist", HttpStatus.BAD_REQUEST);
        }
        const subCategory = new GrocerySubCategoryModel({ name, icon, category });
        const saved = await subCategory.save();
        return sendSuccessResponse(res, saved, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getSubCategoriesByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query; // Default: page 1, limit 10

        const category = await GroceryCategoryModel.findById(id);
        if (!category) {
            return sendErrorResponse(res, "Category not found", HttpStatus.NOT_FOUND);
        }

        const subCategories = await GrocerySubCategoryModel.find({ category: id })
            .populate("category")
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalSubCategories = await GrocerySubCategoryModel.countDocuments({ category: id });

        return sendSuccessResponse(res, {
            subCategories,
            totalPages: Math.ceil(totalSubCategories / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalSubCategories
        }, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

export const editSubCategory = async (req, res) => {
    try {
        const { id, name, icon } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(res, "Invalid sub-category ID", HttpStatus.BAD_REQUEST);
        }

        const subCat = await GrocerySubCategoryModel.findById(id);
        if (!subCat) {
            return sendErrorResponse(res, "Sub-Category not found", HttpStatus.NOT_FOUND);
        }

        if (name !== subCat.name) {
            const existing = await GrocerySubCategoryModel.findOne({
                _id: { $ne: id },
                category: subCat.category,
                name: new RegExp(`^${name}$`, "i")
            });

            if (existing) {
                return sendErrorResponse(res, "Sub-Category already exists with this name", HttpStatus.BAD_REQUEST);
            }
        }

        const updatedSubCategory = await GrocerySubCategoryModel.findByIdAndUpdate(id, { name, icon }, { new: true });

        return sendSuccessResponse(res, updatedSubCategory, "Sub-Category updated", HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

