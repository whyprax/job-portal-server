import express from "express";
import mongoose from "mongoose";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.DB_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");

    // Define Mongoose schema for jobs
    const jobSchema = new mongoose.Schema({
      id: {
        type: Number,
        required: true,
      },
      url: String,
      title: String,
      company_name: String,
      company_logo: String,
      category: String,
      tags: [String],
      job_type: String,
      publication_date: Date,
      candidate_required_location: String,
      salary: String,
      description: String,
    });

    // Define Mongoose model for jobs
    const Job = mongoose.model("Job", jobSchema);

    // Fetch remote jobs and save them to MongoDB
    async function fetchRemoteJobs() {
      try {
        const response = await fetch("https://remotive.com/api/remote-jobs");
        const data = await response.json();
        const remoteJobs = data.jobs;

        for (const remoteJob of remoteJobs) {
          const existingJob = await Job.findOne({ id: remoteJob.id });

          if (!existingJob) {
            try {
              const job = new Job(remoteJob);
              await job.save();
            } catch (error) {
              console.error("Error saving job:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching remote jobs:", error);
      }
    }

    // Define route handler for /jobs/:id
    app.get("/jobs/:id", async (req, res) => {
      const jobId = req.params.id;

      try {
        // Query the database for the job with the specified ID
        const job = await Job.findOne({ id: jobId });

        // If job is found, send its data as response
        if (job) {
          res.json(job);
        } else {
          // If job is not found, send 404 Not Found status
          res.status(404).json({ error: "Job not found" });
        }
      } catch (error) {
        // If an error occurs, send 500 Internal Server Error status
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Define route handler for rendering HTML page
    app.get("/", (req, res) => {
      res.send("<h1>Server is ok at 3000</h1>");
    });

    // Define route handler for /jobs
    app.get("/jobs", async (req, res) => {
      try {
        // Query the database to get all jobs
        const allJobs = await Job.find();

        // console.log(allJobs);
        // Send all jobs data as JSON response
        res.json(allJobs);
      } catch (error) {
        // If an error occurs, send 500 Internal Server Error status
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Start the server
    const PORT = process.env.PORT || 10000;
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);

      // Fetch remote jobs when the server starts
      fetchRemoteJobs();
    });

    // Increase server timeouts to prevent intermittent timeouts or connection reset errors
    server.keepAliveTimeout = 120000; // 120 seconds
    server.headersTimeout = 120000; // 120 seconds
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
