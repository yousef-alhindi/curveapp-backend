import { Router } from "express";
const router = Router();
import * as faq from '../../controllers/admin/faq'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route("/add").post( verifyAdminToken, faq.addFaq);
router.route("/list").get( verifyAdminToken, faq.faqList);
router.route("/update/:id").put( verifyAdminToken, faq.updateFaq);



export default router;
