const express = require('express');
const { getJobs, getTodayJobs, getJob, createJob, updateJob, deleteJob } = require('../controllers/job.controller');
const router = express.Router();

// All job routes are public (no authentication required)
router.route('/')
    .get(getJobs)
    .post(createJob);

// External API endpoint for today's jobs
router.route('/today')
    .get(getTodayJobs);

router.route('/:id')
    .get(getJob)
    .put(updateJob)
    .delete(deleteJob);

module.exports = router;
