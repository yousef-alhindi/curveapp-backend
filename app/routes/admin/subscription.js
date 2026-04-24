import { Router } from "express";
const router = Router();
import * as subscription from '../../controllers/admin/subscription'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/").get( verifyAdminToken, subscription.getList);
router.route("/").post( verifyAdminToken, subscription.create);
router.route("/").put( verifyAdminToken, subscription.edit);
router.route("/:id").delete( verifyAdminToken, subscription.deleteSubscription);


export default router;
