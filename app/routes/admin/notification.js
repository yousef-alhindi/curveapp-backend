import { Router } from "express";
const router = Router();
import * as notification from '../../controllers/admin/notification'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/send").post(verifyAdminToken, notification.notificationSend);
router.route("/list").get(verifyAdminToken, notification.notificationList);
router.route("/getAllUser").get(verifyAdminToken, notification.getAllUser);
router.route("/getAllRestaurant").get(verifyAdminToken, notification.getAllRestaurant);
router.route("/getAllSupplementSeller").get(verifyAdminToken, notification.getAllSupplementSeller);
router.route("/getAllGym").get(verifyAdminToken, notification.getAllGym);
router.route("/getAllDelivery").get(verifyAdminToken, notification.getAllDelivery);


export default router;