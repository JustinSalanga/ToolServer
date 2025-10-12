exports.handleError = (res, status, error) => {
    res.status(status).json({ error });
}