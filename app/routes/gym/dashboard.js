import { Router } from "express";
import { verifyGymToken } from '../../middlewares/authentication';
import * as dashboard from '../../controllers/gym/dashboard';
const router = Router();

router.route('/').get( dashboard.getGymDashboardData);

export default router;