import { Router } from 'express';
import * as gymPkgMgmt from '../../controllers/gym/gymPkgMgmt';
import { verifyGymToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
 *************** SPRINT 8 ****************
 *****************************************/

 router.route('/addGymPkg').post(verifyGymToken, gymPkgMgmt.addGymPkg);
 router.route('/gymPkgs').get(verifyGymToken, gymPkgMgmt.gymPkgList);
 router.route('/viewGymPkg/:gymPkgId').get(verifyGymToken, gymPkgMgmt.viewGymPkg);
 router.route('/editGymPkg').patch(verifyGymToken, gymPkgMgmt.editGymPkg)
 router.route('/deleteGymPkg/:gymPkgId').delete(verifyGymToken, gymPkgMgmt.deleteGymPkg)
 router.route('/blockGymPkg').patch(verifyGymToken, gymPkgMgmt.blockGymPkg);
 export default router;