import { Router } from "express";
import * as menu from '../../controllers/restaurant/menuItem';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/add').post( verifyRestaurantToken, menu.createMenuItem);
router.route('/edit').put( verifyRestaurantToken, menu.editMenuItem);
router.route('/delete').put( verifyRestaurantToken, menu.deleteMenuItem);
router.route('/list').get( verifyRestaurantToken, menu.getMenuList);
router.route('/changeStatus').put( verifyRestaurantToken, menu.changeMenuStatus);


export default router;
