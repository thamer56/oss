module.exports = {
  connectDB: async () => {
    const mongoose = require("mongoose");
    const dbURI =
      "mongodb+srv://admin_pfe:<50611477>@cluster0.ooyzlhe.mongodb.net/oss?retryWrites=true&w=majority";

    try {
      await mongoose.connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      process.exit(1);
    }
  },
};
