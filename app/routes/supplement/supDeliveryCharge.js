import { Router } from "express";
import * as delivery from '../../controllers/supplement/supDelivery';
import { verifyRestaurantToken } from "../../middlewares/authentication";
import { verifySupplementToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
*************** SPRINT 6 ****************
*****************************************/

router.route('/addEdit').post( verifySupplementToken, delivery.createEdit);
router.route('/list').get( verifySupplementToken, delivery.supDeliverylist);


export default router;
