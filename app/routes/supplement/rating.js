import { Router } from 'express';
const router = Router();
import * as rating from '../../controllers/supplement/rating'
import { verifySupplementToken } from "../../middlewares/authentication";

router.route("/").get(verifySupplementToken, rating.allRatings);
router.route('/:ratingId').get(verifySupplementToken, rating.getById);
router.route('/deleteRating/:ratingId').delete(verifySupplementToken, rating.deleteRating);
// router.route("/allFoodRating").get(verifySupplementToken, order.getAllFoodRating);
// router.route('/foodOrderManagement').get(verifySupplementToken, order.foodOrderManagement)
// router.route('/getSingleOrderRating').get(verifySupplementToken, order.getSingleOrderRating)

export default router;