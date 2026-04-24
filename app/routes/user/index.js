import { Router } from 'express';
const router = Router();

import auth from './auth';
import dashboard from './dashboard';
import restaurant from './restaurant';
import offer from './offer';
import banner from './banner';
import cart from './cart';
import wishlist from './wishlist';
import address from './address'
import order from './order'
import supplement from './supplement'
import gym from './gym'
import cms from "./cms"
import support from "./support"
import loyaltyPoints from "./loyaltyPoint"

router.use('/auth', auth);
router.use('/dashboard', dashboard);
router.use('/restaurants', restaurant);
router.use('/offer', offer);
router.use('/banner', banner);
router.use('/carts', cart);
router.use('/wishlists', wishlist);
router.use('/address', address)
router.use('/order', order)
router.use('/supplement', supplement)
router.use('/gym', gym)
router.use('/cms',cms)
router.use('/support', support)
router.use('/loyaltypoints', loyaltyPoints)

export default router;
