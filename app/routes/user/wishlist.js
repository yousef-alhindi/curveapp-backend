import { Router } from "express";
import * as wishlist from '../../controllers/user/restaurant/wishlist'
import { verifyUserToken } from "../../middlewares/authentication";

/****************************************
 *************** SPRINT 3 ****************
 *****************************************/

const router = Router();

router.route("/:id").post(verifyUserToken, wishlist.addAndRemoveWishlistRestaurentController)
router.route("/").get(verifyUserToken, wishlist.listWishlistRestaurentController)
router.route('/foodPackage').get(verifyUserToken,wishlist.getWishlistPackageRest)

export default router;
