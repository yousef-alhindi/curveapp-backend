import { Commission_Model } from '../../models/admin/commision.model';
export const calculateAdminCommission = async (type, totalEarning) => {
   try {
      const commision = await Commission_Model.findOne({ service: type, isDeleted: false }).lean(
         true
      );
      if (commision) {
         const adminCommission = (totalEarning * commision.percentage) / 100;
         return adminCommission;
      }
      return totalEarning;
   } catch (error) {
      return error.message;
   }
};
