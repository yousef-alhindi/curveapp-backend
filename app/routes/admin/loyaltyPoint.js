import { Router } from 'express';

import { verifyAdminToken } from '../../middlewares/authentication';
import { celebrate, Segments } from 'celebrate';
import { loyaltyPointValidation } from '../../validations/admin/loyaltyPoints.validation';
import { createLoyaltyPoints, updateLoyaltyPoints,getLoyaltyPoints } from '../../controllers/admin/loyaltyPoints';

const router = Router();

router.route('/').post(celebrate({ body: loyaltyPointValidation.CREATE_LOYALTY_POINTS }),verifyAdminToken, createLoyaltyPoints)
router.route('/').get(verifyAdminToken, getLoyaltyPoints)
router.route('/:id').patch(celebrate({ body: loyaltyPointValidation.UPDATE_LOYALTY_POINTS }),verifyAdminToken, updateLoyaltyPoints)



export default router;
