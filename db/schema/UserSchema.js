import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  parentName: {
    type: String,
    required: true,
  },
  parentEmail: {
    type: String,
    required: true,
  },
  childName: {
    type: String,
    required: true,
  },
  childAge: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  childStandard: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
