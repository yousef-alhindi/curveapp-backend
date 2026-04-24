import { Router } from "express";
const router = Router();
import * as order from "../../controllers/delivery/order"
import { verifyDeliveryToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 4 ***************
*****************************************/

//router.route("/orderDeliveryRequest").post(verifyDeliveryToken , order.orderDeliveryRequest);
router.route("/getPendingOrders/:deliverBoyId").get(verifyDeliveryToken, order.getPendingOrders)
router.route("/acceptOrderDelivery/:deliveryId").post(verifyDeliveryToken, order.acceptOrder)
router.route("/rejectOrderDelivery/:deliveryId").post(verifyDeliveryToken, order.rejectOrder)
router.route("/orderPickup/:deliveryId/:deliveryBoyId").post(verifyDeliveryToken, order.orderPickup)
router.route("/orderDelivered/:deliveryId/:deliveryBoyId").post(verifyDeliveryToken, order.orderDelivered)
router.route("/getOrderDetails/:deliveryId").get(verifyDeliveryToken, order.deliveryDetails)
router.route("/getdashboardData").get(verifyDeliveryToken, order.dashboardData)

// --------------------- SPRINT 6 ----------------------
router.route("/myEarnings").post(verifyDeliveryToken, order.myEarnings)
router.route("/getRatingsAndReviewList").get(verifyDeliveryToken, order.getOrderRatings)
router.route("/getOrdersList").get(verifyDeliveryToken, order.getOrdersList)

export default router;
