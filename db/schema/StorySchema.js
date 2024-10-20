import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    storyTitle: {
      type: String,
      required: true,
    },
    storyDescription: {
      type: String,
      required: true,
    },
    storyContent: [
      {
        pageText: {
          type: String,
          required: true,
        },
        pageImage: {
          type: String,
          required: false,
        },
      },
    ],
    storyAuthor: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    maxPages: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Story = mongoose.model("Story", storySchema);
export default Story;
