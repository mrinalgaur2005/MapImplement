import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from 'uuid'

export interface User extends Document {
    username: string;
    email: string;
    password: string;
    isVerified: boolean;
    isStudent:boolean
    isTeacher: boolean;
    isAdmin: boolean;
    isLocationAccess:boolean;
}

const UserSchema: Schema<User> = new Schema({
    username: {
        type: String,
        required: [true, 'username is required'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
, 'please use college email id'],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isStudent: {
        type: Boolean,
        default: false,
    },
    isTeacher: {
        type: Boolean,
        default: false, // Default to false, only true if admin updates the field
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isLocationAccess:{
        type: Boolean,
        default: false,
        required: true,
    }
});

UserSchema.post("save", async function (this: User) {
    if (this.isStudent) {
        
        try {
            const existingStudent = await StudentModel.findOne({ user_id: this._id });
            if (existingStudent) {
                console.log(`Student with user_id ${this._id} already exists.`);
                return; 
            }
            const studentId = `S-${uuidv4()}`;
            const newStudent = new StudentModel({
                user_id: this._id,
                name: this.username,
                student_id: studentId,
                semester: 1,
                branch: "Unknown",
                sid_verification: false,
                enrolledSubjectId: [],
                teacherSubjectMap: {},
                attendanceSubjectMap: {},
                clubsPartOf: [],
                interestedEvents: [],
                clubsHeadOf: [],
                profile: "",
                friends: []
            });

            await newStudent.save();
        } catch (error) {
            console.error("Error creating student:", error);
        }
    }

});


export interface Student extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    name: string;
    student_id?: string;
    semester: number;
    phoneNumber?: number;
    branch: string;
    sid_verification: boolean;
    enrolledSubjectId: string[];
    teacherSubjectMap: Record<string, mongoose.Schema.Types.ObjectId>;
    attendanceSubjectMap: Record<number, string>;
    clubsPartOf: mongoose.Schema.Types.ObjectId[];
    interestedEvents: mongoose.Schema.Types.ObjectId[];
    clubsHeadOf: mongoose.Schema.Types.ObjectId[];
    profile?: string;
    friends: mongoose.Schema.Types.ObjectId[];
}


const StudentSchema: Schema<Student> = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: { type: String, required: true },
    student_id: { type: String, unique: true },
    semester: { type: Number, required: true },
    phoneNumber: { type: Number },
    branch: { type: String, required: true },
    sid_verification: { type: Boolean, default: false },
    enrolledSubjectId: [{ type: String }],
    teacherSubjectMap: {
        type: Map,
        of: Schema.Types.ObjectId,
    },
    attendanceSubjectMap: {
        type: Map,
        of: String,
    },
    clubsPartOf: [{ type: Schema.Types.ObjectId, ref: "Club" }],
    interestedEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    clubsHeadOf: [{ type: Schema.Types.ObjectId, ref: "Club" }],
    profile: {
        type: String,
        required: false,
    },
    friends: [{ type: Schema.Types.ObjectId, ref: "Student" }],
});




export interface Request extends Document {
    user_id: mongoose.Schema.Types.ObjectId;
    for_teacher: boolean;
    for_admin: boolean;
}

const RequestSchema: Schema<Request> = new Schema({
    user_id: {type: Schema.Types.ObjectId, ref: "User" },
    for_teacher: {type: "boolean", default: false},
    for_admin: {type: "boolean", default: false},
})



export interface FriendRequest extends Document {
    from: mongoose.Schema.Types.ObjectId;
    to: mongoose.Schema.Types.ObjectId;
}

const FriendRequestSchema: Schema<FriendRequest> = new Schema({
    from: {type: Schema.Types.ObjectId, ref: "Student" },
    to: {type: Schema.Types.ObjectId, ref: "Student" },
})


const UserModel: Model<User> =
    mongoose.models.User || mongoose.model<User>("User", UserSchema);

const StudentModel: Model<Student> =
    mongoose.models.Student || mongoose.model<Student>("Student", StudentSchema);

const RequestModel: Model<Request> =
    mongoose.models.Request || mongoose.model<Request>("Request", RequestSchema);

const FriendRequestModel: Model<FriendRequest> =
    mongoose.models.FriendRequest || mongoose.model<FriendRequest>("FriendRequest", FriendRequestSchema);

export {
    UserModel,
    StudentModel,
    RequestModel,
    FriendRequestModel,
};
