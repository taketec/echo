import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
//import * as argon2 from "argon2";

const userSchema = mongoose.Schema(
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
// });
userSchema.methods.generateAuthToken = async function () {
  try {
    let token = jwt.sign(
      { id: this._id, email: this.email },
      '(*&)(Y&OHBAHDGOIASDIUHOIAJSBDGUojhgjhaskef',
      {
        expiresIn: '24h',
      }
    );

    return token;
  } catch (error) {
    console.log('error while generating token');
  }
};

const userModel = mongoose.model('User', userSchema);
export default userModel;
