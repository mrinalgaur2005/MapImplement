import { StudentModel } from '../models/User';

class FriendDataHandler {

  async getFriends(username: string): Promise<{ username:string }[]> {
    try {
      const result = await StudentModel.aggregate([
        { $match: { name:username } },
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
        throw new Error(`Student with student_id ${username} not found`);
      }
      return result.map((friend) => ({ username: friend.username }));
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw new Error(`Error fetching friends for student_id ${username}: ${(error as any).message}`);
    }
  }
}

export default FriendDataHandler;
