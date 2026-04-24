import { Router } from "express";
const router = Router();
import * as dashboard from '../../controllers/admin/dashboard'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/").post( verifyAdminToken, dashboard.dashboard);

export default router;