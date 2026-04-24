import { Router } from "express";
const router = Router();
import * as commission from '../../controllers/admin/commision'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/").get( verifyAdminToken, commission.getCommission);
router.route("/").post( verifyAdminToken, commission.addupdateCommission);

export default router;
