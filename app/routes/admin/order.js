import { Router } from "express";
import { getOrderList } from "../../controllers/admin/order";

const router = Router();


router.get('/', getOrderList);




export default router;
