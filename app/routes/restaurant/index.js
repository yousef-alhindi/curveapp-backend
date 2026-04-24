import { Router } from 'express';
const router = Router();

import auth from './auth';
import offer from './offer';
import subscription from './subscription';
import category from './category';
import menu from './menu';
import customise from './customise';
import deliveryCharge from './restDeliveryCharge';
import wallet from './restaurantWallet';
import sponser from './restaurentSponser';
import cms from './cms';
import support from './support';
import order from './order'
import dashboard from './dashboard'
import payment from './payment'
import restaurantPackage  from './restaurantPackage'
import packageCategory from './packageCategory'



router.use('/auth', auth);
router.use('/offer', offer);
router.use('/subscription', subscription);
router.use('/category', category);
router.use('/customise', customise);
router.use('/menu', menu);
router.use('/deliveryCharge', deliveryCharge);
router.use('/wallet', wallet);
router.use('/sponsor', sponser);
router.use('/cms', cms);
router.use('/support', support);
router.use('/order',order)
router.use('/dashboard',dashboard)
router.use('/payment',payment)
router.use('/restaurantPackage',restaurantPackage)
router.use('/packageCategory',packageCategory)


export default router;
