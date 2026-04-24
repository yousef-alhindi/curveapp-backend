import { Router } from 'express';
import * as supPkgMgmt from '../../controllers/supplement/supplementPkgMgmt';
import { verifySupplementToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 7 ****************
 *****************************************/

 router.route('/addSupplementPkg').post(verifySupplementToken, supPkgMgmt.addSupplementPkg);
 router.route('/getSupplementList').get(verifySupplementToken, supPkgMgmt.getSupplementList);
 router.route('/supplementPkgList').get(verifySupplementToken, supPkgMgmt.supplementPkgList);
 router.route('/viewSupplementPkg/:supplementPkgId').get(verifySupplementToken, supPkgMgmt.viewSupplementPkg);
 router.route('/editSupplementPkg').patch(verifySupplementToken, supPkgMgmt.editSupplementPkg)
 router.route('/deleteSupplementPkg/:supPkgId').delete(verifySupplementToken, supPkgMgmt.deleteSupplementPkg)
 router.route('/blockSupplementPkg').patch(verifySupplementToken, supPkgMgmt.blockSupplementPkg);
 export default router;