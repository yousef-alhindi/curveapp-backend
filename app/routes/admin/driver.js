import { Router } from "express";
const router = Router();
import * as driver from '../../controllers/admin/driver'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route("/pendingList").get( verifyAdminToken, driver.getDriverListPending);
router.route("/acceptList").get( verifyAdminToken, driver.getDriverListAccepted);
router.route("/rejectList").get( verifyAdminToken, driver.getDriverListRejected);
router.route("/changeStatus").put( verifyAdminToken, driver.blockUnblockUser);
router.route("/reject").put( verifyAdminToken, driver.updateDriverStatus);


export default router;
