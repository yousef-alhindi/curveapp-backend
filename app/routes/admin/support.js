import { Router } from "express";
const router = Router();
import * as support from '../../controllers/admin/support'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route("/").get( verifyAdminToken, support.Supportlist);
router.route("/").put( verifyAdminToken, support.supportChangeStatus);

export default router;
