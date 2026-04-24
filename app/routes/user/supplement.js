import { Router } from 'express';
import * as supplement from '../../controllers/user/supplement/homePage';
import { setUserToken, verifyUserToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 7 ****************
 *****************************************/


// ............SUPPLEMENT / SUPPLEMENT BUNDLES................
router.route('/getSupplementSellerList').get(verifyUserToken, supplement.getSupplementSellerList);
router.route('/:categoryId/getSupplementSellerList').get(verifyUserToken, supplement.getSupSellerByCategory)
router.route('/getAllSupplementSellers').get(verifyUserToken, supplement.getAllSupplementSellers)
router.route('/getSupplementBundles/:sellerId').get(verifyUserToken, supplement.getSupplementBundles)
router.route('/supplementBundleDetails/:supBundleId').get(verifyUserToken, supplement.supplementBundleDetails)
router.route('/getSupplements/:sellerId').get(verifyUserToken, supplement.getSupplements)
//..................CART................................
router.route('/getSingleSupplementCartAdded/:supId').get(verifyUserToken, supplement.getSingleSupplementCartAdded)
router.route('/supplementDetail/:supId').get(verifyUserToken, supplement.supplementDetail)
router.route('/:id/supOfferHighlight').get(verifyUserToken, supplement.getSupOfferHighlight);
router.route('/getSupSellerDetail/:sellerId').get(verifyUserToken, supplement.getSupSellerDetail)
router.route("/addToCart").post(verifyUserToken, supplement.addTocart)
router.route("/multiCartList").get(verifyUserToken, supplement.multiCartList)
router.route("/removeCart/:supSellerId/:cartId").delete(verifyUserToken, supplement.removeCartBySupSeller)
router.route("/:supSellerId/summarySellerCartView").get(verifyUserToken, supplement.summarySellerCartView)
router.route("/singleCartView/:cartId").get(verifyUserToken, supplement.singleCartView)
router.route("/removeFromcart/:id/:type").delete(verifyUserToken, supplement.removeFromcart)
router.route('/mustTryItems/:supSellerId/:userId').get(supplement.getMustTryItems)
router.route("/addAndRemoveWishlist/:supSellerId/:userId").post(verifyUserToken, supplement.addAndRemoveWishlist)
router.route("/listWishlist").get(verifyUserToken, supplement.listWishlist);
router.route('/getSupSellersByOffers/:offerId/offers').get(verifyUserToken, supplement.getSupSellersByOffers);
router.route("/getDeliveryFare").post(verifyUserToken, supplement.getDeliveryFare);
router.route("/getDiscountAmount").post(verifyUserToken, supplement.getDiscountAmount);
router.route('/promoCodeList').get(verifyUserToken, supplement.promoCodeList);
//..................ORDER...........................
router.route('/createOrder').post(verifyUserToken, supplement.createOrder);
router.route('/getOrderDetails/:id').get(verifyUserToken, supplement.getOrderById);
router.route('/getOrderProducts/:id').get(verifyUserToken, supplement.getOrderProducts);
router.route('/myAllOrders/:filterBy').get(verifyUserToken, supplement.getOrdersByUserId);
router.route('/cancel/:orderId').post(verifyUserToken, supplement.cancelOrder);
router.route('/rateOrder').post(verifyUserToken, supplement.rateOrder)
router.route('/getOrderRating/:orderId').get(verifyUserToken, supplement.getOrderRating)

export default router;
