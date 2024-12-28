import { StudentModel } from '../models/User';

class FriendDataHandler {

  async getFriends(student_id: string): Promise<{ student_id:string }[]> {
    try {
      const result = await StudentModel.aggregate([
        {
          $match: {
            student_id,
          }
        },
        {
          $lookup: {
            from: 'students',
            localField: 'friends',
            foreignField: '_id',
            as: 'friends',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  name: 1,
                  student_id: 1,
                }
              }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            student_id: 1,
            name: 1,
            semester: 1,
            branch: 1,
            friends: 1,
          }
        }
      ]);
      if (result.length === 0) {
        throw new Error(`Student with student_id ${student_id} not found`);
      }
      return result.map((friend) => ({ student_id: friend.student_id }));
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw new Error(`Error fetching friends for student_id ${student_id}: ${(error)}`);
    }
  }
}

export default FriendDataHandler;
