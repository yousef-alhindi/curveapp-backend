import { Router } from 'express';
import * as category from '../../controllers/restaurant/restaurantPackageCategory';
import { verifyRestaurantToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

router.route('/add').post(verifyRestaurantToken, category.createCategory);
router.route('/edit').put(verifyRestaurantToken, category.editCategory);
router.route('/delete').put(verifyRestaurantToken, category.deleteCategory);
router.route('/list').get(verifyRestaurantToken, category.CategoryList);
router.route('/statusUpdate').put(verifyRestaurantToken, category.statusUpdate);

export default router;
