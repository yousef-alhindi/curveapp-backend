import { Router } from 'express';
const router = Router();
import * as category_controller from '../../controllers/admin/category';
import category_validation from '../../validations/admin/category.validation';
import { verifyAdminToken } from '../../middlewares/authentication';
import { celebrate, Segments } from 'celebrate';

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

router
   .route('/list')
   .get(
      verifyAdminToken,
      celebrate({ [Segments.QUERY]: category_validation.GET_CATEGORY_LIST }),
      category_controller.categoryList
   );

router
   .route('/categoryList')
   .get(
      verifyAdminToken,
      //celebrate({ [Segments.QUERY]: category_validation.GET_CATEGORY_LIST }),
      category_controller.categoryListByVariable
   );

router
   .route('/')
   .post(
      verifyAdminToken,
      celebrate({ body: category_validation.CREATE_CATEGORY }),
      category_controller.createCategory
   );

router
   .route('/:id')
   .put(
      verifyAdminToken,
      celebrate({ body: category_validation.EDIT_CATEGORY }),
      category_controller.editCategory
   );

router
   .route('/status/:id')
   .put(
      verifyAdminToken,
      celebrate({ body: category_validation.EDIT_CATEGORY_STATUS }),
      category_controller.editCategoryStatus
   );

router
   .route('/position/:id')
   .put(
      verifyAdminToken,
      //celebrate({ body: category_validation.EDIT_CATEGORY_POSITION }),
      category_controller.editCategoryPosition
   );

router.route('/:id').delete(verifyAdminToken, category_controller.deleteCategory);

export default router;
