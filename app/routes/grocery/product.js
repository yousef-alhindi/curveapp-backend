import { Router } from 'express';
import * as product from '../../controllers/grocery/product';
import { verifyGroceryToken } from '../../middlewares/authentication';
const router = Router();

router.route('/categories').get(verifyGroceryToken, product.getCategories);
router.route('/subCategories/:id').get(verifyGroceryToken, product.getSubCategoriesByCategory);
router.route('/').post(verifyGroceryToken, product.addProduct);
router.route('/:productId').put(verifyGroceryToken, product.editProduct);
router.route('/getBySubcategory/:subCategoryId').get(verifyGroceryToken, product.getProductsBySubcategory);

export default router;
