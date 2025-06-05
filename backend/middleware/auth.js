const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  //  console.log('Authenticating request');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
   //     console.log('No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
       // console.log('Verifying token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //    console.log('Decoded token:', decoded);
        
        const table = decoded.table || (decoded.role === 'faculty' ? 'faculty' : decoded.role === 'student' ? 'users' : 'super_admins');
    //    console.log('Using table:', table);
        
        const [user] = await db.query(`SELECT id, name, email, role, branch FROM ${table} WHERE id = ?`, [decoded.id]);
    //    console.log('User query result:', user);
        
        if (user.length === 0) {
    //        console.log('User not found in database');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        req.user = user[0];
    //    console.log('Authentication successful for user:', req.user.id);
        next();
    } catch (error) {
    //    console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

module.exports = { authenticate, restrictTo };