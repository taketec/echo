import mongoose from "mongoose";

const mongoDBConnect = () => {
  try {
    mongoose.connect(process.env.PROD_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("MongoDB - Connected at " + process.env.PROD_URL);
  } catch (error) {
    console.log("Error - MongoDB Connection " + error);
  }
};
export default mongoDBConnect;
