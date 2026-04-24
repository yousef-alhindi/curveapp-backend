import { Router } from "express";
const router = Router();
import * as foodPackage from '../../controllers/admin/foodPackage'
import { verifyAdminToken } from "../../middlewares/authentication";
import { foodPackageValidation } from "../../validations/admin/foodPackage.validation";
import { celebrate } from "celebrate";

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route("/add").post(celebrate({body: foodPackageValidation.CREATE_PACKAGE}),verifyAdminToken, foodPackage.create);
router.route("/edit").put( celebrate({body: foodPackageValidation.EDIT_PACKAGE}),verifyAdminToken, foodPackage.edit);
router.route("/delete").put(celebrate({body: foodPackageValidation.DELETE_PACKAGE}), verifyAdminToken, foodPackage.deleteFoodPackage);
router.route("/list").get( verifyAdminToken, foodPackage.foodPackageList);
router.route("/restaurant/list").get(celebrate({query: foodPackageValidation.RESTUARANT_LIST}), verifyAdminToken, foodPackage.foodPackagewithRestaurant);
router.route("/category/list").get(celebrate({query: foodPackageValidation.CATEGORY_LIST}), verifyAdminToken, foodPackage.foodPackagewithCategory);
router.route("/packageDetail").get(verifyAdminToken, foodPackage.packageDetail)
// router.route("/menu/list").get( verifyAdminToken, foodPackage.foodPackagewithMenu);
// router.route("/customize/list").get( verifyAdminToken, foodPackage.foodPackagewithCustomize);






export default router;
