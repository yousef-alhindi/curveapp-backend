import { Router } from 'express';
const router = Router();
import * as order from '../../controllers/restaurant/order'
import { verifyRestaurantToken } from "../../middlewares/authentication";

/****************************************
 *************** SPRINT 4 ****************
 *****************************************/

 router.route("/list/:restID").get( verifyRestaurantToken, order.orderList);
 router.route('/updateStatus/:orderId').patch(verifyRestaurantToken, order.updateSatus);
 router.route("/allFoodRating").get( verifyRestaurantToken, order.getAllFoodRating);
 router.route('/foodOrderManagement').get(verifyRestaurantToken,order.foodOrderManagement)
 router.route('/getSingleOrderRating').get(verifyRestaurantToken,order.getSingleOrderRating)

 export default router;