import { Router } from "express";
import * as offer from '../../controllers/grocery/offerOrder';
import { verifyGroceryToken } from "../../middlewares/authentication";
const router = Router();

router.route('/saveOrder').post(verifyGroceryToken, offer.OfferSaveTransaction);
router.route('/saveCategory').post(verifyGroceryToken, offer.offerSaveCategory);
router.route('/enrolledOfferList').get(verifyGroceryToken, offer.buyOfferList);
router.route('/newOfferList').get(verifyGroceryToken, offer.newOfferList);
router.route('/enrolledOffer/changeStatus').post(verifyGroceryToken, offer.offerActiveandDeactive);
router.route('/enrolledCategory/changeStatus').post(verifyGroceryToken, offer.categoryActiveandDeactive);


export default router;
