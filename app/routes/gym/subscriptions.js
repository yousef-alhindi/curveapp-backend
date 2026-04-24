import { Router } from "express";
import { verifyGymToken } from '../../middlewares/authentication';
import * as subscriptions from '../../controllers/gym/subscriptions';
const router = Router();

router.route('/').get(verifyGymToken, subscriptions.gymSubscriptions);
router.route('/:id').get(verifyGymToken, subscriptions.gymSubscriptionDetails);

export default router;
