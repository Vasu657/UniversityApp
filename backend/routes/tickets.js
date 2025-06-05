const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

router.post('/', authenticate, restrictTo('student'), async (req, res) => {
    const { user_id, description } = req.body;
    if (!user_id || !description) {
        return res.status(400).json({ message: 'User ID and description are required' });
    }

    try {
        // Verify user exists in users table (students only)
        const [user] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [user_id, 'student']);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await db.query(
            'INSERT INTO tickets (user_id, description, status) VALUES (?, ?, ?)',
            [user_id, description, 'pending']
        );
        // console.log(`Ticket created for user ${user_id}`);
        res.json({ message: 'Ticket raised successfully' });
    } catch (error) {
        console.error(`Error raising ticket for user ${user_id}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/student/:userId', authenticate, restrictTo('student'), async (req, res) => {
    const { userId } = req.params;
   

    try {
        const [tickets] = await db.query(
            'SELECT id, description, status, response FROM tickets WHERE user_id = ?',
            [userId]
        );
        //console.log(`Tickets fetched for user ${userId}:`, tickets);
        res.json({ tickets });
    } catch (error) {
       // console.error(`Error fetching tickets for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/resolve', authenticate, restrictTo('super_admin'), async (req, res) => {
    const { id } = req.params;
    const { action, response } = req.body;

    if (!action || !['approve', 'decline'].includes(action)) {
        return res.status(400).json({ message: 'Valid action (approve or decline) is required' });
    }
    if (!response) {
        return res.status(400).json({ message: 'Response is required' });
    }

    let connection;
    try {
        // Start a transaction
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Fetch ticket
        const [ticket] = await connection.query('SELECT user_id FROM tickets WHERE id = ?', [id]);
        if (ticket.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const userId = ticket[0].user_id;
        const newStatus = action === 'approve' ? 'approved' : 'declined';

        // Update ticket status and response
        await connection.query(
            'UPDATE tickets SET status = ?, response = ? WHERE id = ?',
            [newStatus, response, id]
        );

        if (action === 'approve') {
            // Verify user exists in users table (students only)
            const [user] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
            if (user.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Student not found' });
            }

            // Update can_edit_profile
            const [result] = await connection.query(
                'UPDATE users SET can_edit_profile = TRUE WHERE id = ?',
                [userId]
            );
            //console.log(`Update can_edit_profile result for user ${userId}:`, result);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(500).json({ message: 'Failed to update profile edit permission' });
            }
        }

        // Commit transaction
        await connection.commit();
        console.log(`Ticket ${id} ${newStatus} for user ${userId}`);
        if (action === 'approve') {
       //     console.log(`Profile edit permission granted for user ${userId} via ticket ${id}`);
        }
        res.json({ message: `Ticket ${newStatus} successfully` });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(`Error resolving ticket ${id}:`, error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;