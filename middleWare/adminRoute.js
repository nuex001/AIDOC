// const jwt = require("jsonwebtoken");
// const config = require("config");

//

module.exports = async function (req, res, next) {
    if (req.user.role === "user") {
        res.status(500).send({ err: "RESTRICTED ADDRESS" });
    } else {
        next();
    }
    // NEXT
};
