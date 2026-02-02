const { z } = require("zod");

const validateObj = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation Error",
                issues: e.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
            });
        }
        next(e);
    }
};

const validateParam = (schema) => (req, res, next) => {
    try {
        schema.parse(req.params);
        next();
    } catch (e) {
        return res.status(400).json({ error: "Invalid Parameters" });
    }
};

module.exports = { validateObj, validateParam };
