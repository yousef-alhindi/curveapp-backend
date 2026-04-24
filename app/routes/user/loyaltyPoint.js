import { Router } from "express";
import * as loyalityPoints from "../../controllers/user/loyaltyPoint"
import { verifyUserToken } from "../../middlewares/authentication";

const router = Router();
router.route("/getReferralPoints").get(verifyUserToken, loyalityPoints.getReferralPoints)
router.route("/:userId").get(verifyUserToken, loyalityPoints.getLoyaltyPoints);


export default router;
