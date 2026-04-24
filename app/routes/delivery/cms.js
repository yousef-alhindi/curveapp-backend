import { Router } from "express";
import { verifyDeliveryToken } from "../../middlewares/authentication";
import * as auth from '../../controllers/delivery/cms';
const router = Router();

router.route('/').get(verifyDeliveryToken, auth.deliveryCms);
router.route('/faqList').get(verifyDeliveryToken, auth.deliveryfaqList);


export default router;
