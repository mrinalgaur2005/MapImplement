import { StudentModel } from '../models/User';

class FriendDataHandler {

  async getFriends(sid: string): Promise<{ sid: string }[]> {
    try {
      const result = await StudentModel.aggregate([
        { $match: { student_id: sid } },
        { $unwind: "$friends" },
        {
          $lookup: {
            from: 'students',
            localField: 'friends',
            foreignField: '_id',
            as: 'friendDetails'
          }
        },
        {
          $project: {
            _id: 0,
            sid: { $arrayElemAt: ["$friendDetails.student_id", 0] }
          }
        }
      ]);
      if (result.length === 0) {
        throw new Error(`Student with student_id ${sid} not found`);
      }
      return result.map((friend) => ({ sid: friend.sid }));
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw new Error(`Error fetching friends for student_id ${sid}: ${(error as any).message}`);
    }
  }
}

export default FriendDataHandler;
