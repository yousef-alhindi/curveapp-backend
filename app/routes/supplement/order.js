import { Router } from 'express';
const router = Router();
import * as order from '../../controllers/supplement/order'
import { verifySupplementToken } from "../../middlewares/authentication";

router.route("/list").get(verifySupplementToken, order.orderList);
router.route('/updateStatus/:orderId').patch(verifySupplementToken, order.updateSatus);
// router.route("/allFoodRating").get(verifySupplementToken, order.getAllFoodRating);
// router.route('/foodOrderManagement').get(verifySupplementToken, order.foodOrderManagement)
// router.route('/getSingleOrderRating').get(verifySupplementToken, order.getSingleOrderRating)

export default router;