// import jwt from "jsonwebtoken";
// import * as dotenv from "dotenv";
// dotenv.config();

// const secretKeys = {
//   trainee: process.env.TRAINEE_SECRET_KEY,
//   admin: process.env.ADMIN_SECRET_KEY,
//   trainer: process.env.TRAINER_SECRET_KEY,
// };

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Not authenticated", Auth: false });
//   }

//   const token = authHeader.split(" ")[1];
//   const decoded = jwt.decode(token, { complete: true });

//   if (!decoded || !decoded.payload.payload.role) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid token1", Auth: false });
//   }

//   const secretKey = secretKeys[decoded.payload.payload.role];
//   if (!secretKey) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid role", Auth: false });
//   }

//   jwt.verify(token, secretKey, (err, decoded) => {
//     if (err) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Invalid token", Auth: false });
//     }

//     req.user = decoded;

//     next();
//   });
// };

// const generateToken = (payload) => {
//   const secretKey = secretKeys[payload.role];
//   if (!secretKey) {
//     throw new Error("Invalid role specified");
//   }
//   const options = { expiresIn: "10d" };
//   return jwt.sign({ payload }, secretKey, options);
// };

// const allowedTo = (...permittedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !permittedRoles.includes(req.user.payload.role)) {
//       return res.status(401).json({
//         success: false,
//         message: `You do not have permission to access this resource ${req.user.role}`,
//         Auth: false,
//       });
//     }
//     next();
//   };
// };

// export { verifyToken, generateToken, allowedTo };

import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated", Auth: false });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid token", Auth: false });
    }

    if (!decoded || !decoded.payload.role) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token", Auth: false });
    }

    req.user = decoded;

    next();
  });
};

// const generateToken = (id, email, role) => {
//   const options = { expiresIn: "10d" };
//   return jwt.sign({ id, email, role }, SECRET_KEY, options);
// };
const generateToken = (user) => {
  const options = { expiresIn: "10d" };
  const payload = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    isConfirmed: user.isConfirmed,
  };
  return jwt.sign({ payload }, SECRET_KEY, options);
};

const allowedTo = (...permittedRoles) => {
  return (req, res, next) => {
    if (!req.user || !permittedRoles.includes(req.user.payload.role)) {
      return res.status(401).json({
        success: false,
        message: `You do not have permission to access this resource ${req.user.payload.role}`,
        Auth: false,
      });
    }
    next();
  };
};

export { verifyToken, generateToken, allowedTo };
