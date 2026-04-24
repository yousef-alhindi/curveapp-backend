import { Router } from "express";
import { verifyGymToken } from '../../middlewares/authentication';
import * as auth from '../../controllers/gym/cms';
const router = Router();

/****************************************
*************** SPRINT 8 ****************
*****************************************/

router.route('/').get(verifyGymToken, auth.gymCms);
router.route('/faqList').get(verifyGymToken, auth.gymfaqList);


export default router;
