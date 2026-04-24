import { Router } from "express";
const router = Router();
import * as supplement from '../../controllers/admin/supplement'
import { verifyAdminToken } from "../../middlewares/authentication";

router.route("/list/pending").get(verifyAdminToken, supplement.getPendingSupplementSellers);
router.route("/list/approved").get(verifyAdminToken, supplement.getApprovedSupplementSellers);
router.route("/list/reject").get(verifyAdminToken, supplement.getRejectedSupplementSellers);
router.route("/blockUnblock").patch(verifyAdminToken, supplement.blockUnblockSeller);
//
router.route("/acceptReject").post(verifyAdminToken, supplement.acceptReject);

router.route("/updateStatus").patch(verifyAdminToken, supplement.updateStatus);
router.route("/listOrders").get(verifyAdminToken, supplement.orderList);
router.route("/orderDriverDetails/:id").get(verifyAdminToken, supplement.getDriverDetails);
export default router;
