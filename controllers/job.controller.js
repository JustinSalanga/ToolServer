const model = require('../database/model');
const { handleError } = require('../utils/utils');

exports.getJobs = async (req, res) => {
    try {
        const { date } = req.query;
        const jobs = await model.getJobs(date);

        res.status(200).json({
            jobs
        });
    } catch (error) {
        console.error('Get jobs error:', error);
        handleError(res, 500, 'Error fetching jobs');
    }
}

exports.getTodayJobs = async (req, res) => {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const jobs = await model.getJobs(today);

        res.status(200).json({
            date: today,
            jobs,
            count: jobs.length
        });
    } catch (error) {
        console.error('Get today jobs error:', error);
        handleError(res, 500, 'Error fetching today\'s jobs');
    }
}

exports.getJob = async (req, res) => {
    const { id } = req.params;

    try {
        const job = await model.getJobById(id);

        if (!job) {
            return handleError(res, 404, 'Job not found');
        }

        res.status(200).json({
            job
        });
    } catch (error) {
        console.error('Get job error:', error);
        handleError(res, 500, 'Error fetching job');
    }
}

exports.createJob = async (req, res) => {
    const { id, title, company, tech, url, description } = req.body;

    try {
        // Validate required fields
        if (!id || !title || !company) {
            return handleError(res, 400, 'ID, title and company are required');
        }

        // Validate URL format if provided
        if (url) {
            try {
                new URL(url); // Validate URL format
            } catch (urlError) {
                return handleError(res, 400, 'Invalid URL format');
            }

            // Check if URL already exists using normalized URL
            const existingJob = await model.getJobByNormalizedUrl(url);
            if (existingJob) {
                return handleError(res, 409, 'Job with this URL already exists');
            }
        }

        // Check if job ID already exists
        const existingJobById = await model.getJobById(id);
        if (existingJobById) {
            return handleError(res, 409, 'Job with this ID already exists');
        }

        // Check if job with same title and company already exists
        // const existingJobByTitleCompany = await model.getJobByTitleAndCompany(title, company);
        // if (existingJobByTitleCompany) {
        //     return handleError(res, 409, 'Job with this title and company already exists');
        // }

        const newJob = await model.createJob(id, title, company, tech, url, description);

        res.status(201).json({
            message: 'Job created successfully',
            job: newJob
        });
    } catch (error) {
        console.error('Create job error:', error);
        handleError(res, 500, 'Error creating job');
    }
}

exports.updateJob = async (req, res) => {
    const { id } = req.params;
    const { title, company, tech, url, description } = req.body;

    try {
        // Check if job exists
        const existingJob = await model.getJobById(id);
        if (!existingJob) {
            return handleError(res, 404, 'Job not found');
        }

        // Update job
        const updatedJob = await model.updateJob(id, title, company, tech, url, description);

        res.status(200).json({
            message: 'Job updated successfully',
            job: updatedJob
        });
    } catch (error) {
        console.error('Update job error:', error);
        handleError(res, 500, 'Error updating job');
    }
}

exports.deleteJob = async (req, res) => {
    const { id } = req.params;

    try {
        const job = await model.getJobById(id);
        if (!job) {
            return handleError(res, 404, 'Job not found');
        }

        await model.deleteJob(id);

        res.status(200).json({
            message: 'Job deleted successfully'
        });
    } catch (error) {
        console.error('Delete job error:', error);
        handleError(res, 500, 'Error deleting job');
    }
}
