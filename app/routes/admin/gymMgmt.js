import { Router } from "express";
const router = Router();
import * as gymMgmt from '../../controllers/admin/gymMgmt'
import { verifyAdminToken } from "../../middlewares/authentication";
import { celebrate } from "celebrate";

/****************************************
*************** SPRINT 7 ****************
*****************************************/

router.route("/GymListPending").get(verifyAdminToken, gymMgmt.GymListPending);
router.route("/gymListAccepted").get(verifyAdminToken, gymMgmt.gymListAccepted);
router.route("/packageList/:gymId").get(verifyAdminToken, gymMgmt.packageList);
router.route("/gymStats/:gymId").get(verifyAdminToken, gymMgmt.gymStats);
router.route("/gymListRejected").get(verifyAdminToken, gymMgmt.gymListRejected);
router.route("/updateGymStatus").patch(verifyAdminToken, gymMgmt.updateGymStatus);
router.route("/blockUnblockGym").patch(verifyAdminToken, gymMgmt.blockUnblockGym);
router.route("/gymSubscriptions").get(verifyAdminToken, gymMgmt.gymSubscriptions);
router.route("/subscriptionReview/:subscriptionId").get(verifyAdminToken, gymMgmt.subscriptionReview);

export default router;
