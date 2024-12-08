import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const chatSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);
// userSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     this.password = await argon2.hash(this.password, 12);
//   }
//   next();
// })


const chatModel = mongoose.model('Chat', chatSchema);
export default chatModel;
