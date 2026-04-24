import { Router } from "express";
import adminRouter from './admin/index'
import userRouter from './user/index'
import restaurantRouter from './restaurant/index'
import deliveryRouter from './delivery/index'
import supplementRouter from './supplement/index'
import gymRouter from './gym/index'
import groceryRouter from './grocery/index'
const router = Router();

/* GET home page. */

router.use("/admin",adminRouter);
router.use("/user",userRouter);
router.use("/restaurant",restaurantRouter);
router.use("/delivery",deliveryRouter);
router.use("/supplement",supplementRouter);
router.use("/gym",gymRouter);
router.use("/grocery",groceryRouter);

export default router;
