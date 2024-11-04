import mongoose from "mongoose";
const assignmentSchema = new mongoose.Schema(
  {
    sid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Story",
    },
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        userAnswer: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
