import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import * as commonService from '../../services/common/common.service';
import { error, success } from '../../responses/messages';
var randomize = require('randomatic');
import { SUPPORT_MODEL } from '../../models/admin/support.model';

/****************************************
*************** SPRINT 7 ****************
***************body**************************/

// export const userSupport = async (req, res) => {
//     try {
//         const userData = req.userData;
//         req.body.userId = userData._id;
//         if (!req.body.service) {
//             return sendErrorResponse(res, error.Service_Required, HttpStatus.BAD_REQUEST);
//         }
//         let ticketId;
//         let existingTicket;

//         do {
//             ticketId = '#' + await randomize('0', 9);
//             existingTicket = await commonService.findOne(SUPPORT_MODEL, { ticketId });
//         } while (existingTicket);
//         req.body.ticketId = '#' + ticketId;
//         req.body.createdAt = new Date().getTime()
//         req.body.updatedAt = new Date().getTime()
//         await commonService.create(SUPPORT_MODEL, req.body);
//         return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
//     } catch (error) {
//         console.log(error);
//         return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//     }
// };
export const userSupport = async (req, res) => {
   try {
      const userData = req.userData;

      if (!userData || !userData._id) {
         return sendErrorResponse(
            res,
            'User authentication required',
            HttpStatus.UNAUTHORIZED
         );
      }

      req.body.userId = userData._id;

      if (!req.body.service) {
         return sendErrorResponse(res, error.Service_Required, HttpStatus.BAD_REQUEST);
      }

      let ticketId;
      let existingTicket;

      do {
         ticketId = '#' + await randomize('0', 9);
         existingTicket = await commonService.findOne(SUPPORT_MODEL, { ticketId });
      } while (existingTicket);

      req.body.ticketId = ticketId; 
      req.body.createdAt = new Date().getTime();
      req.body.updatedAt = new Date().getTime();

      await commonService.create(SUPPORT_MODEL, req.body);

      return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      console.log(error);
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// export const userSupportlist = async (req, res) => {
//    try {
//         const userData = req.userData;
//       let { page = 1, limit = 10, service } = req.query;
//       limit = parseInt(limit);
//       page = parseInt(page);
//       let skipIndex = (page - 1) * limit;

//       // 🧩 ensure service is numeric
//       let serviceFilter = service ? Number(service) : undefined;

//       // 🧩 build query
//       let params = { userId: String(req.userData?._id) };
//       if (serviceFilter) params.service = serviceFilter;

//       const total = await SUPPORT_MODEL.countDocuments(params);
//       const list = await SUPPORT_MODEL.find(params)
//          .sort({ createdAt: -1 })
//          .skip(skipIndex)
//          .limit(limit)
//          .lean();

//       return sendSuccessResponse(res, { total, list }, 'support List', HttpStatus.OK);
//    } catch (error) {
//       console.log(error);
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//    }
// };
export const userSupportList = async (req, res) => {
  try {
    const userId = req.userData?._id; 
    let { page = 1, limit = 10, service } = req.query;

    // convert pagination params to numbers
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // build filter query
    const query = { userId: String(userId) };
    if (service) query.service = Number(service);

    // fetch total count and data
    const total = await SUPPORT_MODEL.countDocuments(query);
    const list = await SUPPORT_MODEL.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return sendSuccessResponse(
      res,
      { total, list },
      "Support list fetched successfully",
      HttpStatus.OK
    );
  } catch (error) {
    console.error("Error fetching user support list:", error);
    return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
  }
};


