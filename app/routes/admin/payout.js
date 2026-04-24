import { Router } from 'express';
import {
   getAllRestuarantPayoutHistory,
   payoutToRestuarantByAdmin,
   payoutToRestuarantByAdminByRestuarantId,
   
   payoutToDriverByAdmin,
   getAllDriverPayoutHistory,
   payoutToRestuarantByAdminByDriverId,

   payoutToSupplementByAdmin,
   getAllSupplementPayoutHistory,
   payoutToSupplementByAdminBySupplementId,

   getAllGymPayoutHistory,
   payoutToGymByAdminByGymId,
   payoutToGymByAdmin,

   
} from '../../controllers/admin/payout';


import { verifyAdminToken } from '../../middlewares/authentication';
import { celebrate, Segments } from 'celebrate';
import { payoutValidation } from '../../validations/admin/payout.validation';

const router = Router();

router.route('/restuarant').get(verifyAdminToken, getAllRestuarantPayoutHistory)
router.route('/restuarant').post(celebrate({ body: payoutValidation.PAYOUT_TO_RESTAURANT }), verifyAdminToken, payoutToRestuarantByAdmin)
router.route('/restuarant/:restId').get(verifyAdminToken, payoutToRestuarantByAdminByRestuarantId)

router.route('/driver').get(verifyAdminToken, getAllDriverPayoutHistory)
router.route('/driver').post(celebrate({ body: payoutValidation.PAYOUT_TO_DRIVER }), verifyAdminToken, payoutToDriverByAdmin)
router.route('/driver/:driverId').get(verifyAdminToken, payoutToRestuarantByAdminByDriverId)


// supplement payout
router.route('/supplement').get(verifyAdminToken, getAllSupplementPayoutHistory)
router.route('/supplement').post(celebrate({ body: payoutValidation.PAYOUT_TO_SUPPLEMENT }), verifyAdminToken, payoutToSupplementByAdmin)
router.route('/supplement/:supId').get(verifyAdminToken, payoutToSupplementByAdminBySupplementId)

// Grocery payout
router.route('/gym').get(verifyAdminToken, getAllGymPayoutHistory)
router.route('/gym').post(celebrate({ body: payoutValidation.PAYOUT_TO_GYM }), verifyAdminToken, payoutToGymByAdmin)
router.route('/gym/:gymId').get(verifyAdminToken, payoutToGymByAdminByGymId)
export default router;
