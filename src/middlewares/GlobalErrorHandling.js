export const globalErrorHandling = (err, req, res, next) => {
  let error = err.message;
  let code = err.statuscode || 500;
  process.env.MODE == "dev"
    ? res.status(code).json({ error, stack: err.stack })
    : res.status(code).json({ error });
};
