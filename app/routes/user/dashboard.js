import { Router } from "express";
import * as dashboard from '../../controllers/user/dashboard'
import { verifyUserToken } from "../../middlewares/authentication";

const router = Router();

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/banner").post(verifyUserToken, dashboard.bannerWithServiceType)
router.route("/banner").get(verifyUserToken, dashboard.banner)

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route("/restaurantListByDeliveryType").get(verifyUserToken, dashboard.restaurantListByDeliveryType)
router.route("/nearByRestaurant").post(verifyUserToken, dashboard.newarByRestaurantList)
router.route("/menuList").get(verifyUserToken, dashboard.MenuList)
router.route("/featureList").get(verifyUserToken,dashboard.featuredList)
router.route("/all").get(verifyUserToken, dashboard.AllRestaurant)
router.route("/itemDetail").get(verifyUserToken, dashboard.ItemDetail)
router.route("/countList").get(verifyUserToken, dashboard.menuCountList)
router.route('/suggestedItems/:restId').post( dashboard.getsuggestedItems)
router.route('/mustTryItems/:restId/:userId').get( dashboard.getMustTryItems)





export default router;
