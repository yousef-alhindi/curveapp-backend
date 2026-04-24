import { Router } from 'express';
const router = Router();

import auth from './auth';
import user from './user';
import restaurantCuisine from './restaurantCuisine';
import restaurant from './restaurant';
import offer from './offer';
import banner from './banner';
import subscription from './subscription';
import support from './support';
import commission from './commission';
import deliveryFare from './deliveryFare';
import cms from './cms';
import faq from './faq';
import driver from './driver';
import foodPackage from './foodPackage';
import Categrory from './category';
import Sponsor from './sponsor';
import orderRoutes from "./order";
import paymentRoutes from './payment';
import payoutRouter from "./payout";
import loyaltyPointRoutes from "./loyaltyPoint";
import supplementRoutes from "./supplement";
import foodPackageOrder from "./foodPackageOrder";
import gymMgmt from "./gymMgmt"
import subAdmin from "./subAdmin"
import grocery from "./grocery"
import dashboard from "./dashboard"
import notification from "./notification"


router.use('/auth', auth);
router.use('/user', user);
router.use('/category', Categrory);
router.use('/sponsor', Sponsor);
router.use('/resCategory', restaurantCuisine);
router.use('/restaurants', restaurant);
router.use('/offer', offer);
router.use('/cms', cms);
router.use('/faq', faq);
router.use('/banner', banner);
router.use('/subscription', subscription);
router.use('/support', support);
router.use('/commission', commission);
router.use('/deliveryFare', deliveryFare);
router.use('/driver', driver);
router.use('/foodPackage', foodPackage);
router.use('/order', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/payout', payoutRouter);
router.use('/loyalty-points',loyaltyPointRoutes);
router.use('/supplement',supplementRoutes);
router.use('/foodPackageOrder',foodPackageOrder);
router.use('/gymMgmt',gymMgmt);
router.use('/subAdmin',subAdmin);
router.use('/grocery', grocery);
router.use('/dashboard', dashboard);
router.use('/notification', notification);

export default router;
