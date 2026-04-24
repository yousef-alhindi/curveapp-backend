import mongoose from 'mongoose';
import { GymPkgModel } from '../../models/gym/gymPkg.model';
import { GymModel } from '../../models/gym/gym.model';

export const addGymPkg = async (req, res) => {
  try {
    let { name, durations, gender, description, termAndCond, image } = req.body;
    let { _id } = req.gymData;

    const requiredFields = ['name', 'durations', 'gender', 'description', 'termAndCond'];

    const missingFields = requiredFields.filter(field => !req.body[field] || (req.body[field].length < 1));

    if (missingFields.length > 0) {
      return res.status(409).json({ message: `Missing Fields: ${missingFields.join(', ')}` });
    }

    // Check for duplicates in durations
    const durationSet = new Set();
    const hasDuplicate = durations.some(item => {
      if (durationSet.has(item.duration)) {
        return true;
      }
      durationSet.add(item.duration);
      return false;
    });
    if (hasDuplicate) {
      return res.status(409).json({ message: `Duplicate duration found in the payload.` });
    }

    let lowerCaseName = name.toLowerCase();
    let existedGymPkg = await GymPkgModel.findOne({ gymId: _id, name: lowerCaseName, isDeleted: false }).lean();
    if (existedGymPkg) {
      return res.status(409).json({ message: `Gym Package Already Existed` });
    } else {
      let createGymPkg = await GymPkgModel.create({
        gymId: _id,
        name: lowerCaseName,
        durations,
        gender,
        description,
        termAndCond,
        image
      })

      if (createGymPkg) {
        await GymModel.findByIdAndUpdate(_id, { package: createGymPkg._id });
        return res.status(201).json({ status: true, message: " Gym Package Added", data: createGymPkg });
      } else {
        return res.status(500).json({ message: 'Something Went wrong while adding Gym' });
      }
    }

  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const gymPkgList = async (req, res) => {
  try {
    let { _id } = req.gymData;
    let { page = 1, limit = 10, search = '' } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);
    let skipIndex = (page - 1) * limit;
    let params = { gymId: _id, isDeleted: false };

    if (search) {
      params.name = { $regex: '.*' + search + '.*', $options: 'i' };
    }

    let count = await GymPkgModel.countDocuments(params);
    let GymPkgList = await GymPkgModel.find(params)
      .skip(skipIndex)
      .limit(limit)
      .lean();


    let data = { count, GymPkgList };
    return res.status(200).json({ status: true, message: "Gym Package Retrieved", data: data });
  } catch (error) {
    console.error("Error in gymPkgList API:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const viewGymPkg = async (req, res) => {
  try {
    let { gymPkgId } = req.params;
    let gymPkg = await GymPkgModel.findById(gymPkgId).lean();
    if (!gymPkg) {
      return res.status(409).json({ message: `Invalid Gym Pkg Id` });
    } else {
      return res.status(200).json({ status: true, message: " Gym Package", data: gymPkg });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const editGymPkg = async (req, res) => {
  try {
    //name ,durations, gender, description, termAndCond ,image 
    let { gymPkgId, name, durations, gender, description, termAndCond, image } = req.body;

    console.log("req.body...", req.body)

    if (!gymPkgId) {
      return res.status(400).json({ message: 'Gym Package ID is required' });
    }

    if (name && typeof name !== 'string') {
      return res.status(400).json({ message: 'Name must be a string' });
    }

    if (durations && (!Array.isArray(durations) || durations.length === 0)) {
      return res.status(400).json({ message: 'durations must be a non-empty array' });
    }

    if (description && typeof description !== 'string') {
      return res.status(400).json({ message: 'Description must be a string' });
    }

    if (termAndCond && typeof termAndCond !== 'string') {
      return res.status(400).json({ message: 'termAndCond must be a string' });
    }

    // Check for duplicates in durations
    const durationSet = new Set();
    const hasDuplicate = durations.some(item => {
      if (durationSet.has(item.duration)) {
        return true;
      }
      durationSet.add(item.duration);
      return false;
    });
    if (hasDuplicate) {
      return res.status(409).json({ message: `Duplicate duration found in the payload.` });
    }

    console.log("hasDuplicate....", hasDuplicate)

    let existedGymPkg = await GymPkgModel.findById(gymPkgId).lean();

    console.log("existedGymPkg...", existedGymPkg)

    if (!existedGymPkg) {
      return res.status(409).json({ message: `Invalid Gym Package Id` });
    }
    if (name) {
      let lowerCaseName = name.toLowerCase();
      let gymPkg = await GymPkgModel.findOne({ _id: { $ne: existedGymPkg._id }, name: lowerCaseName }).lean();
      if (gymPkg) {
        return res.status(409).json({ message: `Gym Pkg Already Added with this name` });
      }
      existedGymPkg.name = name ? lowerCaseName : existedGymPkg.name
    }
    existedGymPkg.durations = durations ? durations : existedGymPkg.durations
    existedGymPkg.gender = gender ? gender : existedGymPkg.gender
    existedGymPkg.description = description ? description : existedGymPkg.description
    existedGymPkg.termAndCond = termAndCond ? termAndCond : existedGymPkg.termAndCond
    existedGymPkg.image = image ? image : existedGymPkg.image

    let updatedGymPkg = await GymPkgModel.findByIdAndUpdate(
      existedGymPkg._id,
      { $set: existedGymPkg },
      { new: true }
    );

    if (updatedGymPkg) {
      await GymModel.findByIdAndUpdate(existedGymPkg.gymId, { package: updatedGymPkg._id });
      return res.status(200).json({ status: true, message: "edited Gym Package", data: updatedGymPkg });
    } else {
      return res.status(500).json({ message: `Something went wrong while updating the stock in existing Gym Package` });
    }

  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const deleteGymPkg = async (req, res) => {
  try {
    let { gymPkgId } = req.params

    let deleteGymPkg = await GymPkgModel.findByIdAndUpdate(
      gymPkgId,
      { $set: { isDeleted: true } },
      { new: true }
    )

    return res.status(200).json({ status: true, message: "Gym Deleted Successfully", data: gymPkgId });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const blockGymPkg = async (req, res) => {
  try {
    let { gymPkgId, isBlocked } = req.body;

    let blockGymPkg = await GymPkgModel.findByIdAndUpdate(
      gymPkgId,
      { $set: { isBlocked: isBlocked } },
      { new: true }
    )

    if (!blockGymPkg) {
      return res.status(409).json({ message: 'Invalid Gym Package Id' });
    } else {
      if (blockGymPkg.isBlocked) {
        return res.status(200).json({ status: true, message: "Gym Package blocked Successfully", data: blockGymPkg });
      } else {
        return res.status(200).json({ status: true, message: "Gym Package unBlocked Successfully", data: blockGymPkg });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}