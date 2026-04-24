import { Router } from 'express';
import { celebrate } from 'celebrate';
import * as order from '../../controllers/user/order';
import { verifyUserToken, verifyUserTokenForDelete } from '../../middlewares/authentication';
import { addressValidation } from '../../validations/user/address.validation';

const router = Router();

router.route('/').post(verifyUserToken, order.createOrder);
router.route('/:id').get(verifyUserToken, order.getOrderById);
router.route('/myAllOrders/:userId/:filterBy').get(verifyUserToken, order.getOrdersByUserId);
router.get('/myAllOrders/all', (req, res) => {
   return res.status(200).json({status: true, message: "No user order data",data: []});
});
router.route('/cancel/:orderId').post(verifyUserToken, order.cancelOrder);
//router.route('/filteredOrders/:userId/:filterBy').get(verifyUserToken, order.getFilteredOrders)
router.route('/deliveryDataByOrderId/:orderId').get(verifyUserToken,order.deliveryDetailsByOrderId)

//.................Restaurant Package Orders..........................
router.route('/packageOrder').post(verifyUserToken, order.createPackageOrder);
//router.route('/packageOrder/:id').get(verifyUserToken, order.getPackageOrderById);

//...........COMMON............
router.route('/myAllActivePackageOrders/:userId').get(verifyUserToken, order.getActivePackageOrdersByUserId);
router.route('/myAllPastPackageOrders/:userId').get(verifyUserToken, order.getPastPackageOrdersByUserId);
router.route('/playPausePackage').patch(verifyUserToken,order.playPausePackage)
router.route('/calenderView/:packageOrderId/:restId').get(verifyUserToken,order.calenderView)
router.route('/selectSubstituteItem').patch(verifyUserToken,order.selectSubstituteItem)
router.route('/renewOrder').post(verifyUserToken,order.renewOrder)
router.route('/rateOrder').post(verifyUserToken,order.rateOrder)
router.route('/getOrderRating/:orderId').get(verifyUserToken,order.getOrderRating)
router.route('/orderDetail/:orderId/:restId').get(verifyUserToken,order.getOrderDetail)
router.route('/menuDetails/:orderId/:restId').get(verifyUserToken, order.menuDetails)
router.route('/shuffleMenu/:orderId/:restId/:categoryId').patch(verifyUserToken, order.shuffleMenu)
//router.route('/migratePackage').post(verifyUserToken,order.migratePackage)

//............Admin Package Orders.......................
router.route('/adminPackageOrder').post(verifyUserToken, order.createAdminPackageOrder);
router.route('/adminPackageOrderRestaurants/:id').get(verifyUserToken, order.adminPackageOrderRestaurants);
//router.route('/getAdminPackOrderDetailsByRest/:id/:restId').get(verifyUserToken, order.getAdminPackOrderDetailsByRest);

router.route('/migratePackage').post(verifyUserToken,order.migratePackage)

export default router;
