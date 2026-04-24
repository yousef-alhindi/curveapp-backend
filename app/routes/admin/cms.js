import { Router } from "express";
const router = Router();
import * as cms from '../../controllers/admin/cms'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route("/addUpdate").post( verifyAdminToken, cms.addupdateCms);
router.route("/list").get( verifyAdminToken, cms.getCms);



export default router;
