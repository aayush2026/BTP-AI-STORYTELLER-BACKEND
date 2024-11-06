import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  sid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Story",
    required: true,
  },
  uid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  feedbacks: [
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
        default: "",
      },
      rating: {
        type: Number,
        required: true,
      },
      feedback: {
        type: String,
        required: true,
      },
    },
  ],
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
