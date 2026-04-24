import { Router } from "express";
const router = Router();
import * as user from '../../controllers/admin/user'
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/users/blockUnblock").patch(verifyAdminToken, user.blockUnblockUser);
router.route("/users").get(verifyAdminToken, user.getUserList);

export default router;
