import { Router } from "express";
const router = Router();
import * as grocery from '../../controllers/admin/grocery';
import { verifyAdminToken } from "../../middlewares/authentication";

/****************************************
*************** SPRINT 9 ****************
*****************************************/

router.route("/list/pending").get(verifyAdminToken, grocery.getResListPending);
router.route("/list/accept").get(verifyAdminToken, grocery.getResListAccepted);
router.route("/list/reject").get(verifyAdminToken, grocery.getResListRejected);
router.route("/updateStatus").patch(verifyAdminToken, grocery.updateResStatus);
router.route("/").patch(verifyAdminToken, grocery.blockUnblockUser);

// category/subcategory management
router.route("/category")
    .get(verifyAdminToken, grocery.getCategories)
    .post(verifyAdminToken, grocery.addCategory)
    .put(verifyAdminToken, grocery.editCategory);

router.route("/subCategory")
    .post(verifyAdminToken, grocery.addSubCategory)
    .put(verifyAdminToken, grocery.editSubCategory);

router.route("/subCategories/:id").get(verifyAdminToken, grocery.getSubCategoriesByCategory);

export default router;
