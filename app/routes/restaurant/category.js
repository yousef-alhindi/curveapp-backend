import { Router } from 'express';
import * as category from '../../controllers/restaurant/restaurantCategory';
import { verifyRestaurantToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

router.route('/add').post(verifyRestaurantToken, category.createCategory);
router.route('/edit').put(verifyRestaurantToken, category.editCategory);
router.route('/delete').put(verifyRestaurantToken, category.deleteCategory);
router.route('/list').get(verifyRestaurantToken, category.CategoryList);
router.route('/cuisine/list').get(verifyRestaurantToken, category.CategoryCuisineList);

export default router;
