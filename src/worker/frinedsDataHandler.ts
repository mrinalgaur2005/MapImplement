import dbConnect from '../db/connectDb';
import { StudentModel } from '../models/User';
import { studentData } from '../testData/studentData';

class FriendDataHandler {
  async getFriends(student_id: string): Promise<{ student_id: string, name: string }[]> {
    await dbConnect();
    try {
      const result = await StudentModel.aggregate([
        {
          $match: {
            student_id: student_id,
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
            friends: 1
          }
        }
      ]);

      if (!result || result.length === 0) {
        return []
      }

      return result[0].friends;
  
    } catch (error) {
      console.error("Error fetching friends:", error);
      throw new Error(`Error fetching friends for student_id ${student_id}: ${(error as Error).message}`);
    }
  }
}

export default FriendDataHandler;

  //TESTT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// class FriendDataHandler {
//   async getFriends(student_id: string) {
//     const student = studentData.find((s) => s.student_id === student_id);
//
//     if (student) {
//       console.log("friend found");
//
//       return student.friends;
//     }
//     return [];
//   }
// }
//
// export default FriendDataHandler;
