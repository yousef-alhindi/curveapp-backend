import { Router } from 'express';
const router = Router();

import auth from './auth';
import wallet from './groceryWallet';
import sponser from './grocerySponser';
import product from './product';
import support from './support';
import offer from './offer';
import cms from './cms';

router.use('/auth', auth);
router.use('/wallet', wallet);
router.use('/sponsor', sponser);
router.use('/product', product);
router.use('/offer', offer);
router.use('/support', support);
router.use('/cms', cms);


export default router;