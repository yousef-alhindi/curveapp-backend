import { Router } from "express";
const router = Router();

import auth from './auth';
import order from './order'
import cms from './cms'


router.use("/auth", auth);
router.use("/order", order);
router.use("/cms", cms);

export default router;
