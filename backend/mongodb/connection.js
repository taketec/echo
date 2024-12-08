import mongoose from "mongoose";

const mongoDBConnect = () => {
  try {
    mongoose.connect(process.env.PROD_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("MongoDB - Connected at " + "mongodb://localhost:27017/chat-app");
  } catch (error) {
    console.log("Error - MongoDB Connection " + error);
  }
};
export default mongoDBConnect;
