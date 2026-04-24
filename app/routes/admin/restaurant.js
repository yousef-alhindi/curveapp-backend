import { Router } from "express";
const router = Router();
import * as restaurant from '../../controllers/admin/restaurant'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/list/pending").get(verifyAdminToken, restaurant.getResListPending);
router.route("/list/accept").get(verifyAdminToken, restaurant.getResListAccepted);
router.route("/list/reject").get(verifyAdminToken, restaurant.getResListRejected);
router.route("/updateStatus").patch(verifyAdminToken, restaurant.updateResStatus);
router.route("/").patch(verifyAdminToken, restaurant.blockUnblockUser);

export default router;
