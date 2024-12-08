import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true, 
    },
    username: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true, 
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
