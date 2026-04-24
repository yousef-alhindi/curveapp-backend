import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { CategoryModel } from '../../models/admin/category.models';


// export const categoryList = async (req, res) => {
//    try {
//       const { page, limit, fromDate, toDate, searchQuery, variableCategory, serviceType, status } =
//          req.query;
//       let matchStage = { isDeleted: false };
//       let earlyLookupStage = [];

//       if (fromDate && toDate) {
//          matchStage.createdAt = {
//             $gte: new Date(Number(fromDate)),
//             $lte: new Date(Number(toDate)),
//          };
//       }

//       // service based Filtering
//       if (serviceType) {
//          matchStage.service = serviceType;
//       }
//       //....
//        if (variableCategory) {
//           matchStage.category = variableCategory;
//        }
//       //....

//       // Handle Search Query
//       if (searchQuery) {
//          matchStage.$or = [{ categoryName: { $regex: searchQuery, $options: 'i' } }];
//       }

//       //   Status
//       if (status) {
//          matchStage.status = Number(status);
//       }

//       const resp = await commonService.listAggregation({
//          model: CategoryModel,
//          page,
//          limit,
//          searchQuery,
//          matchStage,
//          earlyLookupStage,
//       });

//       if (resp) {
//          sendSuccessResponse(res, resp, success.LIST_FETCH, HttpStatus.OK);
//          return;
//       } else {
//          return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
//       }
//    } catch (error) {
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//    }
// };
export const categoryList = async (req, res) => {
   try {
      const { page, limit, fromDate, toDate, searchQuery, variableCategory, serviceType, status } = req.query;
      let matchStage = { isDeleted: false };
      let earlyLookupStage = [];

      // Date filter
      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }

      // Service + Category logic
      if (variableCategory) {
         matchStage.$or = [
            { service: 'All' },
            { category: variableCategory }
         ];
      } else if (serviceType) {
         matchStage.service = serviceType;
      }


      // Search filter
      if (searchQuery) {
         matchStage.$or = matchStage.$or || [];
         matchStage.$or.push({ categoryName: { $regex: searchQuery, $options: 'i' } });
      }

      // Status filter
      if (status) {
         matchStage.status = Number(status);
      }

      // Run aggregation
      const resp = await commonService.listAggregation({
         model: CategoryModel,
         page,
         limit,
         searchQuery,
         matchStage,
         earlyLookupStage,
      });

      if (resp) {
         sendSuccessResponse(res, resp, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const categoryListByVariable = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 10,
         fromDate,
         toDate,
         searchQuery,
         variableCategory,
         status,
         categoryType
      } = req.query;

      let matchStage = { isDeleted: false };
      let earlyLookupStage = [];

      if (!variableCategory) {
         return sendErrorResponse(res, "variableCategory is required", HttpStatus.BAD_REQUEST);
      }

      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }

      if (categoryType) {
         matchStage.categoryType = Number(categoryType);
      }

      matchStage.category = variableCategory; // e.g., "Gym"

      if (searchQuery) {
         matchStage.$or = [
            { categoryName: { $regex: searchQuery, $options: "i" } }
         ];
      }

      if (status) {
         matchStage.status = Number(status);
      }

      const resp = await commonService.listAggregation({
         model: CategoryModel,
         page,
         limit,
         matchStage,
         earlyLookupStage,
      });

      if (resp && resp.data?.length > 0) {
         sendSuccessResponse(res, resp, success.LIST_FETCH, HttpStatus.OK);
      } else {
         sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }

   } catch (err) {
      console.error("Error in categoryListByVariable:", err);
      return sendErrorResponse(res, err.message, HttpStatus.SOMETHING_WRONG);
   }
};


// export const createCategory = async (req, res) => {
//    try {
//       const createData = req.body;
//       let data = await commonService.findOne(CategoryModel, {
//          categoryName: createData.categoryName,
//          category: createData.category,
//          sectionType: 2
//       });
//       if (data) {
//          return sendErrorResponse(res, 'Category Name is already exist', HttpStatus.FORBIDDEN);
//       }

//       let highestPosition = await CategoryModel.findOne({ service: createData.service }).sort({ position: -1 }).select('position').exec();

//       let maxPosition = highestPosition ? highestPosition.position : null; // This will give you the maximum position or null if there are no documents

//       createData.position = maxPosition + 1;

//       const addCat = await commonService.create(CategoryModel, createData);
//       if (!addCat) {
//          return sendErrorResponse(res, "Category can't be created.", HttpStatus.FORBIDDEN);
//       }
//       return sendSuccessResponse(res, addCat, success.SUCCESS, HttpStatus.OK);
//    } catch (error) {
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//    }
// };
export const createCategoryOLD = async (req, res) => {
   try {
      const createData = req.body;

      const existingCategory = await commonService.findOne(CategoryModel, {
         categoryName: createData.categoryName,
         category: createData.category,
         sectionType: 2
      });

      if (existingCategory) {
         return sendErrorResponse(res, 'Category Name already exists', HttpStatus.FORBIDDEN);
      }

      const highestPosition = await CategoryModel.findOne({ category: createData.category })
         .sort({ position: -1 })
         .select('position')
         .exec();

       const maxPosition = highestPosition ? highestPosition.position : 0;
       createData.position = maxPosition + 1;
      // let newPosition;

      // if (!highestPosition) {
      //    newPosition = 8;
      // } else {
      //    newPosition = Math.max(highestPosition.position + 1, 8);
      // }
      // createData.position = newPosition;

      const addCat = await commonService.create(CategoryModel, createData);
      if (!addCat) {
         return sendErrorResponse(res, "Category can't be created.", HttpStatus.FORBIDDEN);
      }
      return sendSuccessResponse(res, addCat, success.SUCCESS, HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
export const createCategory = async (req, res) => {
   try {
      const createData = req.body;

      const existingCategory = await commonService.findOne(CategoryModel, {
         categoryName: createData.categoryName,
         category: createData.category,
         sectionType: 2,
         isDeleted: false
      });

      if (existingCategory) {
         return sendErrorResponse(res, 'Category Name already exists', HttpStatus.FORBIDDEN);
      }

      let positionField;

      switch (createData.category) {
         case 'Food':
            positionField = 'foodPosition';
            break;
         case 'Package':
            positionField = 'packagePosition';
            break;
         case 'Gym':
            positionField = 'gymPosition';
            break;
         case 'Supplement':
            positionField = 'supplementPosition';
            break;
         default:
            return sendErrorResponse(res, 'Invalid Category Type', HttpStatus.BAD_REQUEST);
      }

      // GLOBAL highest position
      const highestPosition = await CategoryModel.findOne({
         //[positionField]: { $exists: true }
         //sectionType: 2,
         isDeleted: false,
         [positionField]: { $gt: 0 }
      })
      .sort({ [positionField]: -1 })
      .select(positionField)
      .lean();

      const maxPosition = highestPosition ? highestPosition[positionField] : 0;

      createData[positionField] = maxPosition + 1;

      const addCat = await commonService.create(CategoryModel, createData);

      if (!addCat) {
         return sendErrorResponse(res, "Category can't be created.", HttpStatus.FORBIDDEN);
      }

      return sendSuccessResponse(res, addCat, success.SUCCESS, HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};


// export const editCategory = async (req, res) => {
//    try {
//       const { id } = req.params;
//       let updateData = req.body;

//       const categoryToUpdate = await commonService.findOne(CategoryModel, { _id: id });
//       if (!categoryToUpdate) {
//          return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
//       }

//       // If position is being updated, check for a conflict
//       if (updateData.position !== undefined && updateData.position !== categoryToUpdate.position) {
//          // Find another category with the same service and the new position
//          const conflictingCategory = await commonService.findOne(CategoryModel, {
//             service: categoryToUpdate.service,
//             position: updateData.position,
//          });

//          if (conflictingCategory) {
//             // Swap positions
//             await commonService.findOneAndUpdate(
//                CategoryModel,
//                conflictingCategory._id,
//                { position: categoryToUpdate.position }
//             );
//          }
//       }

//       const updatedCategory = await commonService.findOneAndUpdate(
//          CategoryModel,
//          categoryToUpdate._id,
//          updateData
//       );

//       if (!updatedCategory) {
//          return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
//       } else {
//          sendSuccessResponse(res, updatedCategory, success.SUCCESS, HttpStatus.OK);
//       }
//    } catch (error) {
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//    }
// };
export const editCategory = async (req, res) => {
   try {
      const { id } = req.params;
      let updateData = req.body;

      const categoryToUpdate = await commonService.findOne(CategoryModel, { _id: id });
      if (!categoryToUpdate) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }

      // Handle position change logic
      if (updateData.position !== undefined && updateData.position !== categoryToUpdate.position) {
         const conflictingCategory = await commonService.findOne(CategoryModel, {
            category: categoryToUpdate.category,
            position: updateData.position,
         });

         if (conflictingCategory) {
            // Swap positions
            await commonService.findOneAndUpdate(
               CategoryModel,
               conflictingCategory._id,
               { position: categoryToUpdate.position }
            );
         }
      }

      const updatedCategory = await commonService.findOneAndUpdate(
         CategoryModel,
         categoryToUpdate._id,
         updateData
      );

      if (!updatedCategory) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }

      return sendSuccessResponse(res, updatedCategory, success.SUCCESS, HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const editCategoryStatus = async (req, res) => {
   try {
      const { id } = req.params;
      let { status } = req.body;
      const checkEditCat = await commonService.findOne(CategoryModel, { _id: id });
      if (!checkEditCat) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }
      const update = await commonService.findOneAndUpdate(CategoryModel, checkEditCat._id, {
         status,
      });
      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      } else {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const editCategoryPositionOLD = async (req, res) => {
   try {
      const { id } = req.params;
      let { position } = req.body;

      const checkCat = await commonService.findOne(CategoryModel, { _id: id });
      if (!checkCat) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }
      const oldPosition = checkCat.position;

      // Find a category with the same position under the same service
      const checkPositionCat = await commonService.findOne(CategoryModel, {
         position,
         service: checkCat.service, // Ensure same service
      });

      // If another category has the same position, swap their positions
      if (checkPositionCat) {
         await commonService.findOneAndUpdate(CategoryModel, checkPositionCat._id, {
            position: oldPosition,
         });
      }
      const updatedData = await commonService.findOneAndUpdate(CategoryModel, checkCat._id, {
         position,
      });

      if (!updatedData) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      } else {
         sendSuccessResponse(res, updatedData, success.SUCCESS, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const editCategoryPosition = async (req, res) => {
   try {
      const { id } = req.params;
      const data = req.body;

      const checkCat = await CategoryModel.findById(id);
      if (!checkCat) {
         return sendErrorResponse(res, "Category not found", 404);
      }

      let positionField;
      let newPosition;

      // Decide position field from request
      if (data.foodPosition !== undefined) {
         positionField = "foodPosition";
         newPosition = data.foodPosition;
      }
      else if (data.gymPosition !== undefined) {
         positionField = "gymPosition";
         newPosition = data.gymPosition;
      }
      else if (data.packagePosition !== undefined) {
         positionField = "packagePosition";
         newPosition = data.packagePosition;
      }
      else if (data.supplementPosition !== undefined) {
         positionField = "supplementPosition";
         newPosition = data.supplementPosition;
      }
      else {
         return sendErrorResponse(res, "Position field required", 400);
      }

      const oldPosition = checkCat[positionField];

      //  GLOBAL SWAP 
      const checkPositionCat = await CategoryModel.findOne({
         _id: { $ne: id },
         [positionField]: newPosition
      });

      // Swap if found
      if (checkPositionCat) {
         await CategoryModel.findByIdAndUpdate(checkPositionCat._id, {
            [positionField]: oldPosition
         });
      }

      const updatedData = await CategoryModel.findByIdAndUpdate(
         id,
         { [positionField]: newPosition },
         { new: true }
      );

      return sendSuccessResponse(res, updatedData, "SUCCESS", 200);

   } catch (error) {
      return sendErrorResponse(res, error.message, 500);
   }
};
//

// export const deleteCategory = async (req, res) => {
//    try {
//       const { id } = req.params;
//       const checkCat = await commonService.findOne(CategoryModel, { _id: id });
//       if (!checkCat) {
//          sendErrorResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
//          return;
//       }
//       if (checkCat.sectionType === 1) {
//          sendErrorResponse(res, {}, `Fixed Categories cannot be deleted.`, HttpStatus.CONFLICT);
//       }
//       const update = await commonService.findOneAndUpdate(CategoryModel, checkCat._id, { isDeleted: true });

//       // Shift positions of other categories
//       await CategoryModel.updateMany(
//          { position: { $gt: update.position }, isDeleted: false },
//          { $inc: { position: -1 } }
//       );

//       // Optionally, you can clear the position field of the deleted category
//       await CategoryModel.findByIdAndUpdate(checkCat._id, { position: 0 }); // or set it to a default value

//       if (update) {
//          sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
//          return;
//       }
//       return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
//    } catch (error) {
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//    }
// };
export const deleteCategory = async (req, res) => {
   try {
      const { id } = req.params;

      // 1️Find category
      const doc = await CategoryModel.findById(id);

      if (!doc) {
         return sendErrorResponse(res, "Category not found", 404);
      }

      // 2️.Prevent deleting fixed categories
      if (doc.sectionType === 1) {
         return sendErrorResponse(res, "Fixed categories cannot be deleted", 409);
      }

      // 3 Decide which position field to modify
      const { type } = req.query; 
      const positionMap = {
         food: "foodPosition",
         gym: "gymPosition",
         package: "packagePosition",
         supplement: "supplementPosition"
      };

      const positionField = positionMap[type?.toLowerCase()];

      if (!positionField) {
         return sendErrorResponse(res, "Invalid category type", 400);
      }

      const deletedPosition = doc[positionField];

      if (!deletedPosition || deletedPosition === 0) {
         return sendErrorResponse(res, "Invalid position value", 400);
      }

      // 4️ SHIFT OTHER POSITIONS FIRST
      await CategoryModel.updateMany(
         {
            isDeleted: false,
            [positionField]: { $gt: deletedPosition }
         },
         {
            $inc: { [positionField]: -1 }
         }
      );

      // 5️ Soft delete and clear that position
      await CategoryModel.findByIdAndUpdate(id, { isDeleted: true, [positionField]: 0});

      return sendSuccessResponse(res,{},"Category deleted successfully",200);

   } catch (error) {
      return sendErrorResponse(res, error.message, 500);
   }
};



