import { Router } from "express";
import { verifyGymToken } from '../../middlewares/authentication';
import * as ratings from '../../controllers/gym/ratings';
const router = Router();

router.route('/').get(verifyGymToken, ratings.gymRatings);
router.route('/:id').delete(verifyGymToken, ratings.deleteRating);

export default router;