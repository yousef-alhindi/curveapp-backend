import { Router } from 'express';
const router = Router();

import auth from './auth';
import dashboard from './dashboard';
import wallet from './gymWallet';
import sponser from './gymSponser';
import offer from './offer';
import cms from './cms';
import support from './support';
import ratings from './ratings';
import payments from './payments';
import gymPkgMgmt from './gymPkgMgmt'
import subscriptions from './subscriptions'

router.use('/auth', auth);
router.use('/dashboard', dashboard);
router.use('/wallet', wallet);
router.use('/sponsor', sponser);
router.use('/offer', offer);
router.use('/cms', cms);
router.use('/support', support);
router.use('/ratings', ratings);
router.use('/payments', payments);
router.use('/gymPkgMgmt', gymPkgMgmt);
router.use('/subscriptions', subscriptions);



export default router;