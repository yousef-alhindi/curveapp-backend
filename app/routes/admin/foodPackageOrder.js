import { Router } from "express";
const router = Router();
import * as foodPackageOrder from '../../controllers/admin/foodPackageOrder'
import { verifyAdminToken } from "../../middlewares/authentication";
import { foodPackageValidation } from "../../validations/admin/foodPackage.validation";
import { celebrate } from "celebrate";

/****************************************
*************** SPRINT 6 ****************
*****************************************/

router.route("/getFoodPackageOrders").get(verifyAdminToken, foodPackageOrder.getFoodPackageOrders);

export default router;
