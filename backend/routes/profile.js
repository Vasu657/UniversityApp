const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// Get profile for a student
router.get('/:userId', authenticate, restrictTo('student'), async (req, res) => {
    const { userId } = req.params;

    try {
        const [profile] = await db.query(
            'SELECT personal_details, education, skills, work_experience, projects, ' +
            'certifications, achievements, languages, hobbies, resume_references, can_edit_profile ' +
            'FROM users WHERE id = ? AND role = ?',
            [userId, 'student']
        );
        if (profile.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

       // console.log(`Profile fetched for user ${userId}`);
        res.json({ profile: profile[0], can_edit_profile: profile[0].can_edit_profile });
    } catch (error) {
       // console.error(`Error fetching profile for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get profile for admin view
router.get('/all/:userId', authenticate, restrictTo('super_admin'), async (req, res) => {
    const { userId } = req.params;

    try {
        let profile = [];
        let [user] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
        if (user.length > 0) {
            [profile] = await db.query(
                'SELECT personal_details, education, skills, work_experience, projects, ' +
                'certifications, achievements, languages, hobbies, resume_references ' +
                'FROM users WHERE id = ? AND role = ?',
                [userId, 'student']
            );
        } else {
            [user] = await db.query('SELECT role FROM faculty WHERE id = ?', [userId]);
            if (user.length > 0) {
                [profile] = await db.query(
                    'SELECT name, email, branch FROM faculty WHERE id = ? AND role = ?',
                    [userId, 'faculty']
                );
            } else {
                [user] = await db.query('SELECT role FROM super_admins WHERE id = ?', [userId]);
                if (user.length > 0) {
                    [profile] = await db.query(
                        'SELECT name, email, branch FROM super_admins WHERE id = ? AND role = ?',
                        [userId, 'super_admin']
                    );
                }
            }
        }

        if (profile.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

      //  console.log(`Admin profile fetched for user ${userId}`);
        res.json({ profile: profile[0] });
    } catch (error) {
        console.error(`Error fetching admin profile for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check if user can edit profile
router.get('/can-edit/:userId', authenticate, restrictTo('student'), async (req, res) => {
    const { userId } = req.params;

    try {
        const [user] = await db.query('SELECT can_edit_profile FROM users WHERE id = ? AND role = ?', [userId, 'student']);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        console.log(`Can edit profile check for user ${userId}: ${user[0].can_edit_profile}`);
        res.json({ can_edit_profile: user[0].can_edit_profile });
    } catch (error) {
        console.error(`Error checking can_edit_profile for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save or update profile
router.post('/save', authenticate, restrictTo('student'), async (req, res) => {
    const { userId, profileData } = req.body;

    if (!userId || !profileData) {
        return res.status(400).json({ message: 'User ID and profile data are required' });
    }

    try {
        // Check if user can edit profile
        const [user] = await db.query('SELECT can_edit_profile FROM users WHERE id = ? AND role = ?', [userId, 'student']);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        if (!user[0].can_edit_profile && profileData.personal_details?.full_name) {
            return res.status(403).json({ message: 'Profile editing not permitted. Please raise a ticket.' });
        }

        // Validate profile photo (base64 string)
        if (profileData.personal_details?.profile_photo) {
            const base64Regex = /^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/;
            if (!base64Regex.test(profileData.personal_details.profile_photo)) {
                return res.status(400).json({ message: 'Invalid profile photo format. Must be a valid base64 image (PNG or JPEG).' });
            }
            // Optional: Limit size of base64 string (e.g., 1MB)
            const maxSizeBytes = 1 * 1024 * 1024; // 1MB
            const base64String = profileData.personal_details.profile_photo.split(',')[1];
            const sizeBytes = (base64String.length * 3) / 4 - (base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0);
            if (sizeBytes > maxSizeBytes) {
                return res.status(400).json({ message: 'Profile photo size exceeds 1MB limit.' });
            }
        }

        // Convert profile data sections to JSON strings
        const profileFields = {
            personal_details: JSON.stringify(profileData.personal_details || {}),
            education: JSON.stringify(profileData.education || []),
            skills: JSON.stringify(profileData.skills || []),
            work_experience: JSON.stringify(profileData.work_experience || []),
            projects: JSON.stringify(profileData.projects || []),
            certifications: JSON.stringify(profileData.certifications || []),
            achievements: JSON.stringify(profileData.achievements || []),
            languages: JSON.stringify(profileData.languages || []),
            hobbies: JSON.stringify(profileData.hobbies || []),
            resume_references: JSON.stringify(profileData.resume_references || [])
        };

        // Update profile in database and reset can_edit_profile
        await db.query(
            `UPDATE users SET 
                personal_details = ?, 
                education = ?, 
                skills = ?, 
                work_experience = ?, 
                projects = ?, 
                certifications = ?, 
                achievements = ?, 
                languages = ?, 
                hobbies = ?, 
                resume_references = ?, 
                can_edit_profile = FALSE
            WHERE id = ? AND role = ?`,
            [
                profileFields.personal_details,
                profileFields.education,
                profileFields.skills,
                profileFields.work_experience,
                profileFields.projects,
                profileFields.certifications,
                profileFields.achievements,
                profileFields.languages,
                profileFields.hobbies,
                profileFields.resume_references,
                userId,
                'student'
            ]
        );

       // console.log(`Profile saved for user ${userId}`);
        res.json({ message: 'Profile saved successfully' });
    } catch (error) {
        console.error(`Error saving profile for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile (name and email)
router.put('/update', authenticate, async (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userTable = userRole === 'student' ? 'users' : userRole === 'faculty' ? 'faculty' : 'super_admins';

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        // Check if email already exists for another user
        const [existingUsers] = await db.query(
            `SELECT id FROM ${userTable} WHERE email = ? AND id != ?`,
            [email, userId]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already in use by another account' });
        }

        // Update user profile
        await db.query(
            `UPDATE ${userTable} SET name = ?, email = ? WHERE id = ?`,
            [name, email, userId]
        );

    //    console.log(`Profile updated for user ${userId} (${userRole})`);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(`Error updating profile for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;