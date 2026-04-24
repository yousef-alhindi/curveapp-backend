import { Router } from "express";
import { verifyGroceryToken } from '../../middlewares/authentication';
import * as auth from '../../controllers/grocery/cms';
const router = Router();

router.route('/').get(verifyGroceryToken, auth.groceryCms);
router.route('/faqList').get(verifyGroceryToken, auth.groceryfaqList);


export default router;
