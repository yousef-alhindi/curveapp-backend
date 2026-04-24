import { Router } from 'express';
import * as gym from '../../controllers/user/gym/gymControllers';
import { setUserToken, verifyUserToken } from '../../middlewares/authentication';

const router = Router();

router.route('/getHomePageGym').get(setUserToken, gym.getHomePageGym)
router.route('/getAllServiceBanners').get(gym.getAllServiceBanners);
router.route('/:offerId/offers').get(verifyUserToken, gym.getGymsByLocationAndOffer);
router.route('/getByCategory/:categoryId').get(setUserToken, gym.getGymsByCategoryId)
router.route('/toggleWishlist/:id').get(verifyUserToken, gym.toggleGymWishlist)
router.route('/listWishlistedGyms').get(verifyUserToken, gym.listWishlistGymController)
router.route('/getById/:id').get(setUserToken, gym.getById);
router.route("/addToCart").post(verifyUserToken, gym.addTocart)
router.route("/getCartData").get(verifyUserToken, gym.getCartData)
router.route("/getCartItem/:id").get(verifyUserToken, gym.getCartItem)
router.route("/getCartItemByGymId/:id").get(verifyUserToken, gym.getCartByGymId)
router.route("/:id").delete(verifyUserToken, gym.deleteCartItem)
router.route("/getGymOffers/:id").get(verifyUserToken, gym.getGymOffers)
router.route("/applyPromoCode").post(verifyUserToken, gym.applyPromoCode)
router.route("/checkout").post(verifyUserToken, gym.checkout)
router.route("/getSubscriptions").get(verifyUserToken, gym.getSubscriptions)
router.route("/renewSubscription/:id").get(verifyUserToken, gym.renewSubscription)
router.route("/rateGym").post(verifyUserToken, gym.gymRating)


export default router;
