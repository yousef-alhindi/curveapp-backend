import { Router } from "express";
import { verifyGroceryToken } from "../../middlewares/authentication";
import * as support from '../../controllers/grocery/support';
const router = Router();

router.route('/').post(verifyGroceryToken, support.restSupport);
router.route('/list').get(verifyGroceryToken, support.restSupportlist);


export default router;
