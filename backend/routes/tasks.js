const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// Get tasks for a student
router.get('/student/:id', authenticate, restrictTo('student'), async (req, res) => {
  const userId = req.params.id;

  try {
    const [tasks] = await db.query(
      'SELECT t.id, t.task, t.due_date, t.status, t.notes, t.link, ' +
      'COALESCE(f.name, s.name) AS assigned_by ' +
      'FROM tasks t ' +
      'LEFT JOIN faculty f ON t.assigned_by = f.id AND t.role_flag = "faculty" ' +
      'LEFT JOIN super_admins s ON t.assigned_by = s.id AND t.role_flag = "super_admin" ' +
      'WHERE t.assigned_to = ? AND t.role_flag = "student"',
      [userId]
    );
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for a faculty
router.get('/faculty/:id', authenticate, restrictTo('faculty'), async (req, res) => {
  const userId = req.params.id;

  try {
    const [tasks] = await db.query(
      'SELECT t.id, t.task, t.due_date, t.status, t.notes, t.link, ' +
      'COALESCE(s.name, f.name) AS assigned_by, ' +
      'u.name AS assigned_to_name ' +
      'FROM tasks t ' +
      'LEFT JOIN super_admins s ON t.assigned_by = s.id AND t.role_flag = "super_admin" ' +
      'LEFT JOIN faculty f ON t.assigned_by = f.id AND t.role_flag = "faculty" ' +
      'LEFT JOIN users u ON t.assigned_to = u.id AND t.role_flag = "student" ' +
      'WHERE t.assigned_to = ? AND t.role_flag = "faculty"',
      [userId]
    );
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks assigned by a user
router.get('/assigned-by/:id', authenticate, restrictTo('faculty', 'super_admin'), async (req, res) => {
  const userId = req.params.id;

  try {
    const [tasks] = await db.query(
      'SELECT t.id, t.task, t.due_date, t.status, t.notes, t.link, ' +
      'u.name AS assigned_to_name ' +
      'FROM tasks t ' +
      'JOIN users u ON t.assigned_to = u.id ' +
      'WHERE t.assigned_by = ? AND t.role_flag = "student"',
      [userId]
    );
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status, notes, and link
router.post('/update/:taskId', authenticate, restrictTo('student', 'faculty'), async (req, res) => {
  const taskId = req.params.taskId;
  const { status, notes, link } = req.body;

  if (!status && !notes && !link) {
    return res.status(400).json({ message: 'At least one field (status, notes, or link) is required' });
  }

  // Validate URL in notes or link if present
  const urlRegex = /^(https?:\/\/[^\s]+)/;
  if (notes) {
    const urls = notes.match(urlRegex);
    if (urls) {
      for (const url of urls) {
        try {
          new URL(url);
        } catch {
          return res.status(400).json({ message: 'Invalid URL in notes' });
        }
      }
    }
  }
  if (link) {
    try {
      new URL(link);
    } catch {
      return res.status(400).json({ message: 'Invalid URL in link' });
    }
  }

  try {
    // Verify task exists and is assigned to the user
    const roleFlag = req.user.role === 'student' ? 'student' : 'faculty';
    const [task] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ? AND role_flag = ?',
      [taskId, req.user.id, roleFlag]
    );
    if (task.length === 0) {
      return res.status(404).json({ message: 'Task not found or not assigned to you' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (notes) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (link) {
      updates.push('link = ?');
      values.push(link);
    }
    values.push(taskId);

    if (updates.length > 0) {
      await db.query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      res.json({ message: 'Task updated successfully' });
    } else {
      res.status(400).json({ message: 'No valid fields to update' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign a new task
router.post('/assign', authenticate, restrictTo('faculty', 'super_admin'), async (req, res) => {
  const { task, due_date, assigned_to, role_flag, notes, link } = req.body;
  if (!task || !assigned_to || !role_flag) {
    return res.status(400).json({ message: 'Task, assigned_to, and role_flag are required' });
  }

  // Validate link if present
  if (link) {
    try {
      new URL(link);
    } catch {
      return res.status(400).json({ message: 'Invalid URL in link' });
    }
  }

  // Validate URLs in notes if present
  if (notes) {
    const urlRegex = /^(https?:\/\/[^\s]+)/;
    const urls = notes.match(urlRegex);
    if (urls) {
      for (const url of urls) {
        try {
          new URL(url);
        } catch {
          return res.status(400).json({ message: 'Invalid URL in notes' });
        }
      }
    }
  }

  try {
    // Determine the table based on role_flag
    const table = role_flag === 'student' ? 'users' : role_flag === 'faculty' ? 'faculty' : 'super_admins';

    // Verify assigned user exists
    const [user] = await db.query(`SELECT id FROM ${table} WHERE id = ? AND role = ?`, [assigned_to, role_flag]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    // Determine assigned_by table based on req.user.role
    const assignedByTable = req.user.role === 'faculty' ? 'faculty' : 'super_admins';
    const [assignedBy] = await db.query(`SELECT id FROM ${assignedByTable} WHERE id = ?`, [req.user.id]);
    if (assignedBy.length === 0) {
      return res.status(404).json({ message: 'Assigning user not found' });
    }

    await db.query(
      'INSERT INTO tasks (assigned_by, assigned_to, task, due_date, role_flag, status, notes, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, assigned_to, task, due_date || null, role_flag, 'pending', notes || null, link || null]
    );
    res.json({ message: 'Task assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;