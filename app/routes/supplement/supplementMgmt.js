import { Router } from 'express';
import * as supMgmt from '../../controllers/supplement/supplementMgmt';
import { verifySupplementToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 6 ****************
 *****************************************/

router.route('/addSupplement').post(verifySupplementToken, supMgmt.addSupplement);
router.route('/editSupplement').patch(verifySupplementToken, supMgmt.editSupplement);
router.route('/viewSupplement/:supplementId').get(verifySupplementToken, supMgmt.viewSupplement);
router.route('/BlockSupplementStock').patch(verifySupplementToken, supMgmt.BlockSupplementStock);
router.route('/getSupplementList').get(verifySupplementToken, supMgmt.getSupplementList);
router.route('/deleteSupplementList/:supId').delete(verifySupplementToken, supMgmt.deleteSupplementList);
router.route('/blockSupplement').patch(verifySupplementToken, supMgmt.blockSupplement);


export default router;
