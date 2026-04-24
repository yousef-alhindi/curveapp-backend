import { Router } from "express";
import * as cms from "../../controllers/user/cms.js"
import { verifyUserToken } from "../../middlewares/authentication";

const router = Router();


router.route("/getCms").get(verifyUserToken, cms.getUserCms)
router.route("/faqList").get(verifyUserToken, cms.userfaqList);


export default router;
