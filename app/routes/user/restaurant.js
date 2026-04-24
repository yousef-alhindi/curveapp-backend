import { Router } from 'express';
import * as restaurant from '../../controllers/user/restaurant/homePageRestaurant';
import { setUserToken, verifyUserToken } from '../../middlewares/authentication';
import * as restaurantOut from '../../controllers/user/restaurant';

const router = Router();

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

router.route('/getHomePageRestaurant').get(setUserToken, restaurant.getHomePageRestaurant)
router.route('/getAllServiceBanners').get(restaurantOut.getAllServiceBanners);
router.route('/getAllRestaurants').get(setUserToken, restaurantOut.getAllRestaurants)
router.route('/getRes-cuisine-category').get(verifyUserToken, restaurantOut.getRestaurantCuisine)
router.route('/items/:id').get(verifyUserToken, restaurant.getRestaurantItemByIdController);
router.route('/:id').get(setUserToken, restaurant.restaurantDetailController);
router.route('/:categoryId/category').get(setUserToken, restaurant.getRestaurantByCategoryController)
router.route('/:id/items').get(verifyUserToken, restaurant.getRestaurantItemsController);
router.route('/:id/menus').get(verifyUserToken, restaurant.getRestaurantMenusController);
router.route('/:offerId/offers').get(verifyUserToken, restaurant.getRestaurantByOffersController);
router.route('/:id/highlights').get(verifyUserToken, restaurant.getRestaurantOfferHighlightController);
router.route('/restaurantRating').post(verifyUserToken, restaurantOut.restRating)


/****************************************
 *************** SPRINT 5 ****************
 *****************************************/

//========>>> user Survey Calculation <<<<===========//
router.route('/package/userSurveyCalculation').get(verifyUserToken,restaurant.userSurveyCalculation)

//==========>>>> PACKAGE RESTAURANTS <<<<===========//

router.route('/foodPackage/getRestPackageList').get(verifyUserToken, restaurant.getRestaurantList);
router.route('/foodPackage/:categoryId/getRestByCategory').get(verifyUserToken, restaurant.getPackageRestByCategory);
router.route('/foodPackage/getRestPackages').get(verifyUserToken,restaurant.getRestPackages)

//==========>>>> ADMIN PACKAGE <<<<==============//
router.route('/adminPackage/getAdminPackageList').get(verifyUserToken, restaurant.getAdminPackageList);
router.route('/adminPackage/getAdminPackageRestList').get(verifyUserToken, restaurant.getAdminPackageRestList);
router.route('/adminPackage/restCategoriesList').get(verifyUserToken,restaurant.restCategoriesList)
router.route('/adminPackage/getServiceBannerList').get(verifyUserToken,restaurant.getServiceBannerList)

export default router;
