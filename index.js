import express from "express";
import mongoose from "mongoose";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Mongoose schema for jobs
const jobSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: false,
  },
  company_name: {
    type: String,
    required: false,
  },
  company_logo: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  tags: {
    type: [String],
    required: false,
  },
  job_type: {
    type: String,
    required: false,
  },
  publication_date: {
    type: Date,
    required: false,
  },
  candidate_required_location: {
    type: String,
    required: false,
  },
  salary: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
});

// Define Mongoose model for jobs
const Job = mongoose.model("Job", jobSchema);

// Fetch remote jobs and save them to MongoDB
async function fetchRemoteJobs() {
  try {
    const response = await fetch("https://remotive.com/api/remote-jobs");
    const data = await response.json();
    const remoteJobs = data.jobs;
    remoteJobs.forEach(async (remoteJob) => {
      try {
        const job = new Job({
          id: remoteJob.id,
          url: remoteJob.url,
          title: remoteJob.title,
          company_name: remoteJob.company_name,
          company_logo: remoteJob.company_logo,
          category: remoteJob.category,
          tags: remoteJob.tags,
          job_type: remoteJob.job_type,
          publication_date: new Date(remoteJob.publication_date),
          candidate_required_location: remoteJob.candidate_required_location,
          salary: remoteJob.salary,
          description: remoteJob.description,
        });
        await job.save();
      } catch (error) {
        console.error("Error saving job:", error);
      }
    });
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

    console.log(allJobs);
    // Send all jobs data as JSON response
    res.json(allJobs);
  } catch (error) {
    // If an error occurs, send 500 Internal Server Error status
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);

  // Fetch remote jobs when the server starts
  fetchRemoteJobs();
});
