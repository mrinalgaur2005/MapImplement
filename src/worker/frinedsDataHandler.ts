import { StudentModel } from '../models/User';
import { studentData } from '../testData/studentData';

// class FriendDataHandler {

//   async getFriends(student_id: string): Promise<{ student_id:string }[]> {
//     try {
//       const result = await StudentModel.aggregate([
//         { $match: { student_id:student_id } },
//         { $unwind: "$friends" },
//         {
//           $lookup: {
//             from: 'students',
//             localField: 'friends',
//             foreignField: '_id',
//             as: 'friendDetails'
//           }
//         },
//         {
//           $project: {
//             _id: 0,
//             sid: { $arrayElemAt: ["$friendDetails.student_id", 0] }
//           }
//         }
//       ]);
//       if (result.length === 0) {
//         throw new Error(`Student with student_id ${student_id} not found`);
//       }
//       return result.map((friend) => ({ student_id: friend.student_id }));
//     } catch (error) {
//       console.error('Error fetching friends:', error);
//       throw new Error(`Error fetching friends for student_id ${student_id}: ${(error as any).message}`);
//     }
//   }
// }

//test
class FriendDataHandler {
  async getFriends(student_id: string) {
    if (student_id === studentData.student_id) {
      return studentData.friends;
    }
    throw new Error(`Student with student_id ${student_id} not found`);
  }
}

export default FriendDataHandler;
