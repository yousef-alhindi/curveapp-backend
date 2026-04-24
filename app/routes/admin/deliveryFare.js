import { Router } from "express";
const router = Router();
import * as deliveryFare from '../../controllers/admin/deliveryFare'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/").get( verifyAdminToken, deliveryFare.deliveryFareList);
router.route("/").post( verifyAdminToken, deliveryFare.addupdateDeliveryFare);

export default router;
