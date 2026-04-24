import { Router } from "express";
import { verifySupplementToken } from "../../middlewares/authentication";
import * as auth from '../../controllers/supplement/cms';
const router = Router();

/****************************************
*************** SPRINT 7 ****************
*****************************************/

router.route('/').get(verifySupplementToken, auth.supplementCms);
router.route('/faqList').get(verifySupplementToken, auth.supplementfaqList);


export default router;
