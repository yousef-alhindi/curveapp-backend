import { Router } from 'express';
const router = Router();

import auth from './auth';
import wallet from './supplementWallet';
import sponser from './supplementSponser';
import supplementMgmt from './supplementMgmt'
import offer from './offer';
import cms from './cms';
import support from './support';
import dashboard from './dashboard';
import payment from './payment';
import order from './order';
import rating from './rating';
import supplementPkgMgmt from './supplementPkgMgmt'
import deliveryCharge from './supDeliveryCharge';

router.use('/auth', auth);
router.use('/wallet', wallet);
router.use('/sponsor', sponser);
router.use('/supplementMgmt', supplementMgmt)
router.use('/offer', offer);
router.use('/cms', cms);
router.use('/support', support);
router.use('/dashboard', dashboard);
router.use('/payment', payment)
router.use('/supplementPkgMgmt', supplementPkgMgmt);
router.use('/deliveryCharge', deliveryCharge);
router.use('/order', order);
router.use('/rating', rating);



export default router;