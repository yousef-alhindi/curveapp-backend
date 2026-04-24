import { Router } from "express";
import * as restaurantPackage from '../../controllers/restaurant/restaurantPackage'
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 5 ****************
*****************************************/

router.route('/createPackage').post(verifyRestaurantToken, restaurantPackage.createPackage);
router.route('/getPackages').get(verifyRestaurantToken,restaurantPackage.getPackages);
router.route('/packageStatusUpdate').patch(verifyRestaurantToken,restaurantPackage.packageStatusUpdate)
router.route('/updatePackage').post(verifyRestaurantToken,restaurantPackage.updatePackage)
router.route('/deletePackage').delete(verifyRestaurantToken,restaurantPackage.deletePackage)
router.route('/addItems').patch(verifyRestaurantToken,restaurantPackage.addItems)
router.route('/getItems').get(verifyRestaurantToken,restaurantPackage.getItems)
router.route('/updateItems').patch(verifyRestaurantToken,restaurantPackage.updateItems)
router.route('/deleteItem').delete(verifyRestaurantToken,restaurantPackage.deleteItem)
router.route('/updateAdminPackageStatus').patch(verifyRestaurantToken,restaurantPackage.updateAdminPackageStatus)
router.route('/addItemsAdminPack').patch(verifyRestaurantToken,restaurantPackage.addAdminPackageItems)
router.route('/getItemsAdminPack').get(verifyRestaurantToken,restaurantPackage.getAdminPackageItems)
router.route('/updateItemsAdminPack').patch(verifyRestaurantToken,restaurantPackage.updateAdminPackageItems)
router.route('/deleteItemAdminPack').delete(verifyRestaurantToken,restaurantPackage.deleteAdminPackageItem)
/****************************************
*************** SPRINT 6 ****************
*****************************************/
//..........Package booking Mgmt.....
router.route('/getRestaurantspackagesOrders').get(verifyRestaurantToken,restaurantPackage.getRestaurantspackagesOrders)
router.route('/getAdminpackagesOrders').get(verifyRestaurantToken,restaurantPackage.getAdminpackagesOrders)
router.route('/restPackRating').get(verifyRestaurantToken,restaurantPackage.restPackRating)
router.route('/updateRestPackStatus').patch(verifyRestaurantToken,restaurantPackage.updateRestPackStatus)
router.route('/updateAdminPackStatus').patch(verifyRestaurantToken,restaurantPackage.updateAdminPackStatus)

export default router;