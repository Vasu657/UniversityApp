const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

router.get('/templates/:branch', authenticate, restrictTo('student'), async (req, res) => {
    const { branch } = req.params;

    try {
        const [templates] = await db.query('SELECT id, name, content FROM resume_templates WHERE branch = ?', [branch]);
        res.json({ templates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/generate', authenticate, restrictTo('student'), async (req, res) => {
    const { student_id, template_id } = req.body;
    if (!student_id || !template_id) {
        return res.status(400).json({ message: 'Student ID and template ID are required' });
    }

    try {
        const [user] = await db.query(
            `SELECT 
                personal_details, 
                education, 
                skills, 
                work_experience, 
                projects, 
                certifications, 
                achievements, 
                languages, 
                hobbies, 
                resume_references 
            FROM users WHERE id = ? AND role = ?`,
            [student_id, 'student']
        );
        if (!user[0] || !user[0].personal_details) {
            return res.status(400).json({ message: 'Profile data not found. Please complete your profile.' });
        }

        const resume_data = {
            personal_details: JSON.parse(user[0].personal_details || '{}'),
            education: JSON.parse(user[0].education || '[]'),
            skills: JSON.parse(user[0].skills || '[]'),
            work_experience: JSON.parse(user[0].work_experience || '[]'),
            projects: JSON.parse(user[0].projects || '[]'),
            certifications: JSON.parse(user[0].certifications || '[]'),
            achievements: JSON.parse(user[0].achievements || '[]'),
            languages: JSON.parse(user[0].languages || '[]'),
            hobbies: JSON.parse(user[0].hobbies || '[]'),
            resume_references: JSON.parse(user[0].resume_references || '[]')
        };

        await db.query(
            'INSERT INTO resumes (student_id, template_id, resume_data) VALUES (?, ?, ?)',
            [student_id, template_id, JSON.stringify(resume_data)]
        );
        res.json({ message: 'Resume generated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/templates/:id', authenticate, restrictTo('super_admin'), async (req, res) => {
    const { id } = req.params;
    const { name, content } = req.body;
    if (!name || !content) {
        return res.status(400).json({ message: 'Name and content are required' });
    }

    try {
        const [template] = await db.query('SELECT id FROM resume_templates WHERE id = ?', [id]);
        if (template.length === 0) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await db.query(
            'UPDATE resume_templates SET name = ?, content = ? WHERE id = ?',
            [name, JSON.stringify(content), id]
        );
        res.json({ message: 'Template updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;