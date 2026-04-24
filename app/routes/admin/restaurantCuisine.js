import { Router } from 'express';
const router = Router();
import * as resCuisine from '../../controllers/admin/restaurantCuisine';
import { verifyAdminToken } from '../../middlewares/authentication';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

router.route('/').get(verifyAdminToken, resCuisine.getResCatList);
router.route('/').post(verifyAdminToken, resCuisine.create);
router.route('/').put(verifyAdminToken, resCuisine.edit);
router.route('/:id').delete(verifyAdminToken, resCuisine.deleteResCat);

export default router;
