import { Router } from "express";
import * as customise from '../../controllers/restaurant/customiseItem';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/add').post( verifyRestaurantToken, customise.createCustomiseItem);
router.route('/edit').put( verifyRestaurantToken, customise.editCustomiseItem);
router.route('/delete').put( verifyRestaurantToken, customise.deleteCustomiseItem);
router.route('/list').get( verifyRestaurantToken, customise.getCustomiseList);
router.route('/changeStatus').put( verifyRestaurantToken, customise.changeStatus);


export default router;
