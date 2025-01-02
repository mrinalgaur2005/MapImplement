import { StudentModel } from '../models/User';
import { studentData } from '../testData/studentData';

class FriendDataHandler {

  async getFriends(student_id: string): Promise<{ student_id: string, name: string }[]> {
    try {
      const result = await StudentModel.aggregate([
        {
          $match: {
            student_id,
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "friends",
            foreignField: "_id",
            as: "friends",
            pipeline: [
              {
                $project: {
                  _id: 0,
                  student_id: 1,
                  name: 1,
                },
              },
            ],
          },
        },
        {
          $project: {
            friends: {
              $ifNull: ["$friends", []],
            },
          },
        },
        {
          $unwind: {
            path: "$friends",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $replaceRoot: { newRoot: "$friends" },
        },
      ]);
        if (result.length === 0 || result[0]?.friends.length === 0) {
        return [];
      }
  
      return result;
      
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw new Error(`Error fetching friends for student_id ${student_id}: ${error}`);
    }
  }
  
}

export default FriendDataHandler;

  //TESTT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// class FriendDataHandler {
//   async getFriends(student_id: string) {
//     if (student_id === studentData.student_id) {
//       return studentData.friends;

//     }
//     return [];
//   }
// }

// export default FriendDataHandler;
