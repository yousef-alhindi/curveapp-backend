import { Router } from 'express';
import { celebrate } from 'celebrate';
import * as address from '../../controllers/user/address';
import { verifyUserToken, verifyUserTokenForDelete } from '../../middlewares/authentication';
import { addressValidation } from "../../validations/user/address.validation"

const router = Router();

router
   .route('/')
   .get(verifyUserToken, address.getAddresses)
   .post(celebrate({ body: addressValidation.CREATE_ADDRESS }), verifyUserToken, address.createAddress)
  
router.route('/:id').get(verifyUserToken, address.getUserAddresses)
router.route('/updateAddress').put(celebrate({ body: addressValidation.UPDATE_ADDRESS }), verifyUserToken, address.updateAddress)

router.route('/deleteAddress').delete(celebrate({ body: addressValidation.DELETE_ADDRESS }), verifyUserToken, address.deleteAddress);

export default router;
