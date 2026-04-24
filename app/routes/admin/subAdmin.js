import { Router } from "express";
const router = Router();
import * as subAdmin from '../../controllers/admin/subAdmin'
import { verifyAdminToken } from "../../middlewares/authentication";
import { celebrate } from "celebrate";

/****************************************
*************** SPRINT 7 ****************
*****************************************/


router.route("/addSubAdmin").post(verifyAdminToken, subAdmin.addSubAdmin);
router.route("/getSubAdmins").get(verifyAdminToken, subAdmin.getSubAdmins);
router.route("/editSubAdmin/:id").patch(verifyAdminToken, subAdmin.editSubAdmin);
router.route("/blockUnblockSubAdmin/:id").patch(verifyAdminToken, subAdmin.blockUnblockSubAdmin);
router.route("/deleteSubAdmin/:id").delete(verifyAdminToken, subAdmin.deleteSubAdmin);


export default router;