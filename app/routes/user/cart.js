import { Router } from "express";
import * as cart from '../../controllers/user/cart'
import { verifyUserToken } from "../../middlewares/authentication";
import { user } from "../../validations/user/user.validation"
import { celebrate } from "celebrate";

/****************************************
 *************** SPRINT 3 ****************
 *****************************************/

const router = Router();

router.route("/").post(celebrate({ body: user.ADD_RESTAURENT_CART }), verifyUserToken, cart.addTocart)
router.route("/customize").post(celebrate({ body: user.ADD_RESTAURENT_CART }), verifyUserToken, cart.addToCartWithCustomizeItem)
router.route("/").get(verifyUserToken, cart.cartList)
router.route("/:restId/view").get(verifyUserToken, cart.cartViewByRestaurant)
router.route("/:restId/list").get(verifyUserToken, cart.cartListByRestaurant)
// router.route("/:restId").get(verifyUserToken, cart.cartListByRestaurant)
router.route("/:restId/restaurant/:cartId").delete(verifyUserToken, cart.removeCartByRestaurant)
router.route("/items/:id").delete(verifyUserToken, cart.removeTocart)
router.route("/items/:id/:restId").get(verifyUserToken, cart.getItemsListByItem)
router.route("/getDeliveryFare").post(verifyUserToken, cart.getDeliveryFare);
router.route("/getDiscountAmount").post(verifyUserToken, cart.getDiscountAmount);
router.route("/customizeCartItems").patch(verifyUserToken, cart.customizeCartItems)


/****************************************
 *************** SPRINT 5 ****************
 *****************************************/
//................For restaurant food package............
 router.route("/foodPackage").post(verifyUserToken, cart.addTocartFoodPack)
 router.route("/foodPackage").get(verifyUserToken,cart.foodPackCartList);
 router.route("/getSingleRestCart").get(verifyUserToken,cart.getSingleRestCart)
 router.route("/foodPackage/:restId/view").get(verifyUserToken, cart.foodPackCartViewByRestaurant);
 router.route("/foodPackage/:restId/restaurant/:cartId").delete(verifyUserToken, cart.removeFoodPackCartByRestaurant)
 router.route("/editFoodPackageCart").patch(verifyUserToken, cart.editFoodPackageCart)
 router.route("/getFoodPackageDeliveryFare").post(verifyUserToken, cart.getFoodPackageDeliveryFare)

//................For Admin food package................
 router.route("/adminPackage").post(verifyUserToken, cart.addTocartAdminFoodPack)
 router.route("/adminPackage").get(verifyUserToken,cart.AdminPackCartList);
 router.route("/getSingleAdminPackCart").get(verifyUserToken,cart.getSingleAdminPackCart)
 router.route("/adminPackage/:packageId/:cartId").delete(verifyUserToken, cart.removeAdminPackCartFromList)
 router.route("/getAdminPackageDeliveryFare").post(verifyUserToken, cart.getAdminPackageDeliveryFare)



export default router;
