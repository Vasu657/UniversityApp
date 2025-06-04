const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();
console.log('Dashboard routes loaded'); // Debug log

router.get('/student/:userId', authenticate, restrictTo('student'), async (req, res) => {
    const { userId } = req.params;

    try {
        const [user] = await db.query(
            'SELECT id, name, email, branch FROM users WHERE id = ? AND role = ?',
            [userId, 'student']
        );
        if (user.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ user: user[0] });
    } catch (error) {
        console.error(`Error fetching student data for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/admin', authenticate, restrictTo('super_admin'), async (req, res) => {
    try {
        // Fetch users from all tables
        const [students] = await db.query(
            'SELECT id, name, email, role, branch FROM users WHERE role = ?',
            ['student']
        );
        const [faculty] = await db.query(
            'SELECT id, name, email, role, branch FROM faculty WHERE role = ?',
            ['faculty']
        );
        const [superAdmins] = await db.query(
            'SELECT id, name, email, role, branch FROM super_admins WHERE role = ?',
            ['super_admin']
        );
        const users = [...students, ...faculty, ...superAdmins];

        const [tasks] = await db.query(
            'SELECT t.id, t.task, t.due_date, t.assigned_to, t.role_flag, ' +
            'COALESCE(u1.name, f1.name, s1.name) AS assigned_by, ' +
            'COALESCE(u2.name, f2.name, s2.name) AS assigned_to_name ' +
            'FROM tasks t ' +
            'LEFT JOIN users u1 ON t.assigned_by = u1.id AND t.role_flag = "student" ' +
            'LEFT JOIN faculty f1 ON t.assigned_by = f1.id AND t.role_flag = "faculty" ' +
            'LEFT JOIN super_admins s1 ON t.assigned_by = s1.id AND t.role_flag = "super_admin" ' +
            'LEFT JOIN users u2 ON t.assigned_to = u2.id AND t.role_flag = "student" ' +
            'LEFT JOIN faculty f2 ON t.assigned_to = f2.id AND t.role_flag = "faculty" ' +
            'LEFT JOIN super_admins s2 ON t.assigned_to = s2.id AND t.role_flag = "super_admin"'
        );
        const [tickets] = await db.query(
            'SELECT t.id, t.user_id, t.description, t.status, t.response, u.name AS user_name ' +
            'FROM tickets t ' +
            'JOIN users u ON t.user_id = u.id'
        );

      //  console.log('Admin dashboard tickets:', tickets);
        res.json({ users, tasks, tickets });
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/students', authenticate, restrictTo('faculty', 'super_admin'), async (req, res) => {
   // console.log('Students endpoint called with query:', req.query); // Debug log
    const { branch } = req.query;

    if (!branch) {
        return res.status(400).json({ message: 'Branch is required' });
    }

    try {
        const [students] = await db.query(
            'SELECT id, name, email, branch FROM users WHERE role = ? AND branch = ?',
            ['student', branch]
        );
       // console.log('Students fetched:', students);
        res.json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;