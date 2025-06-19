const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// Middleware to log requests for debugging
router.use((req, res, next) => {
    //console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | User ID: ${req.user?.id || 'unknown'}`);
    next();
});

// Get semesters and subjects
router.get('/config', authenticate, restrictTo('faculty'), async (req, res) => {
    try {
        //console.log(`Fetching config for faculty_id: ${req.user.id}`);
        const [semesters] = await db.query(
            'SELECT DISTINCT semester FROM attendance WHERE faculty_id = ? AND semester != "DUMMY_SEMESTER"',
            [req.user.id]
        );
        const [subjects] = await db.query(
            'SELECT DISTINCT subject FROM attendance WHERE faculty_id = ? AND subject != "DUMMY_SUBJECT"',
            [req.user.id]
        );

        const semesterList = semesters.map(s => s.semester).filter(s => s);
        const subjectList = subjects.map(s => s.subject).filter(s => s);

        //console.log(`Found ${semesterList.length} semesters and ${subjectList.length} subjects`);
        res.status(200).json({
            semesters: semesterList,
            subjects: subjectList
        });
    } catch (error) {
        //console.error(`Error fetching config for faculty_id: ${req.user.id}:`, error.message, error.stack);
        res.status(500).json({ message: 'Failed to fetch configuration', error: error.message });
    }
});

// Add a new semester
router.post('/add-semester', authenticate, restrictTo('faculty'), async (req, res) => {
    const { semester } = req.body;
    if (!semester || typeof semester !== 'string' || semester.trim() === '') {
        //console.warn(`Invalid semester input: ${semester} for faculty_id: ${req.user.id}`);
        return res.status(400).json({ message: 'Valid semester is required' });
    }

    const trimmedSemester = semester.trim();
    try {
        //console.log(`Adding semester: ${trimmedSemester} for faculty_id: ${req.user.id}`);

        // Verify faculty_id exists in faculty table
        const [faculty] = await db.query('SELECT id FROM faculty WHERE id = ?', [req.user.id]);
        if (faculty.length === 0) {
            //console.warn(`Faculty ID ${req.user.id} not found in faculty table`);
            return res.status(403).json({ message: 'Invalid faculty user' });
        }

        // Check if semester already exists
        const [existing] = await db.query(
            'SELECT semester FROM attendance WHERE semester = ? AND faculty_id = ?',
            [trimmedSemester, req.user.id]
        );
        if (existing.length > 0) {
            //console.warn(`Semester already exists: ${trimmedSemester} for faculty_id: ${req.user.id}`);
            return res.status(400).json({ message: 'Semester already exists' });
        }

        // Insert dummy record to store semester
        await db.query(
            'INSERT INTO attendance (faculty_id, student_id, status, date, semester, subject) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 0, 'present', '2000-01-01', trimmedSemester, 'DUMMY_SUBJECT']
        );

        //console.log(`Semester added successfully: ${trimmedSemester} for faculty_id: ${req.user.id}`);
        res.status(201).json({ message: 'Semester added successfully' });
    } catch (error) {
        //console.error(`Error adding semester '${trimmedSemester}' for faculty_id: ${req.user.id}:`, error.message, error.stack);
        res.status(500).json({ message: 'Failed to add semester', error: error.message });
    }
});

// Add a new subject
router.post('/add-subject', authenticate, restrictTo('faculty'), async (req, res) => {
    const { subject } = req.body;
    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
        //console.warn(`Invalid subject input: ${subject} for faculty_id: ${req.user.id}`);
        return res.status(400).json({ message: 'Valid subject is required' });
    }

    const trimmedSubject = subject.trim();
    try {
        //console.log(`Adding subject: ${trimmedSubject} for faculty_id: ${req.user.id}`);

        // Verify faculty_id exists in faculty table
        const [faculty] = await db.query('SELECT id FROM faculty WHERE id = ?', [req.user.id]);
        if (faculty.length === 0) {
            //console.warn(`Faculty ID ${req.user.id} not found in faculty table`);
            return res.status(403).json({ message: 'Invalid faculty user' });
        }

        // Check if subject already exists
        const [existing] = await db.query(
            'SELECT subject FROM attendance WHERE subject = ? AND faculty_id = ?',
            [trimmedSubject, req.user.id]
        );
        if (existing.length > 0) {
            //console.warn(`Subject already exists: ${trimmedSubject} for faculty_id: ${req.user.id}`);
            return res.status(400).json({ message: 'Subject already exists' });
        }

        // Insert dummy record to store subject
        await db.query(
            'INSERT INTO attendance (faculty_id, student_id, status, date, semester, subject) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 0, 'present', '2000-01-01', 'DUMMY_SEMESTER', trimmedSubject]
        );

        //console.log(`Subject added successfully: ${trimmedSubject} for faculty_id: ${req.user.id}`);
        res.status(201).json({ message: 'Subject added successfully' });
    } catch (error) {
        //console.error(`Error adding subject '${trimmedSubject}' for faculty_id: ${req.user.id}:`, error.message, error.stack);
        res.status(500).json({ message: 'Failed to add subject', error: error.message });
    }
});

// Mark attendance
router.post('/mark', authenticate, restrictTo('faculty'), async (req, res) => {
    const { attendance } = req.body;
    if (!Array.isArray(attendance) || attendance.length === 0) {
        //console.warn(`Invalid attendance data for faculty_id: ${req.user.id}: Empty or not an array`);
        return res.status(400).json({ message: 'Valid attendance data is required' });
    }

    try {
        //console.log(`Marking attendance for ${attendance.length} records for faculty_id: ${req.user.id}`);
        for (const record of attendance) {
            const { student_id, status, date, semester, subject } = record;
            if (!student_id || !status || !date || !semester || !subject) {
                //console.warn(`Invalid record for faculty_id: ${req.user.id}: ${JSON.stringify(record)}`);
                return res.status(400).json({ message: 'Incomplete attendance record' });
            }

            // Validate status
            if (!['present', 'absent'].includes(status)) {
                //console.warn(`Invalid status: ${status} for faculty_id: ${req.user.id}`);
                return res.status(400).json({ message: 'Invalid attendance status' });
            }

            // Check if record exists
            const [existing] = await db.query(
                'SELECT id FROM attendance WHERE student_id = ? AND date = ? AND semester = ? AND subject = ? AND faculty_id = ?',
                [student_id, date, semester, subject, req.user.id]
            );

            if (existing.length > 0) {
                // Update existing record
                await db.query(
                    'UPDATE attendance SET status = ? WHERE id = ?',
                    [status, existing[0].id]
                );
                //console.log(`Updated attendance for student_id: ${student_id}, date: ${date}, faculty_id: ${req.user.id}`);
            } else {
                // Insert new record
                await db.query(
                    'INSERT INTO attendance (faculty_id, student_id, status, date, semester, subject) VALUES (?, ?, ?, ?, ?, ?)',
                    [req.user.id, student_id, status, date, semester, subject]
                );
                //console.log(`Inserted attendance for student_id: ${student_id}, date: ${date}, faculty_id: ${req.user.id}`);
            }
        }

        res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
        //console.error(`Error marking attendance for faculty_id: ${req.user.id}:`, error.message, error.stack);
        res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
    }
});

// Get attendance report for date range
router.get('/report/date-range', authenticate, restrictTo('faculty'), async (req, res) => {
    const { semester, subject, fromDate, toDate } = req.query;
    
    if (!semester || !subject || !fromDate || !toDate) {
        return res.status(400).json({ message: 'Semester, subject, fromDate, and toDate are required' });
    }

    try {
        // Get faculty info to filter students by branch
        const [faculty] = await db.query('SELECT branch FROM faculty WHERE id = ?', [req.user.id]);
        if (faculty.length === 0) {
            return res.status(403).json({ message: 'Invalid faculty user' });
        }

        // Get all students in the faculty's branch
        const [students] = await db.query(
            'SELECT id, name FROM users WHERE branch = ? AND role = "student"',
            [faculty[0].branch]
        );

        if (students.length === 0) {
            return res.status(200).json({ reportData: [] });
        }

        // Get attendance records for the date range
        const [attendanceRecords] = await db.query(`
            SELECT 
                student_id,
                status,
                date
            FROM attendance 
            WHERE faculty_id = ? 
            AND semester = ? 
            AND subject = ? 
            AND date BETWEEN ? AND ?
            AND student_id != 0
            ORDER BY student_id, date
        `, [req.user.id, semester, subject, fromDate, toDate]);

        // Calculate attendance statistics for each student
        const reportData = students.map(student => {
            const studentAttendance = attendanceRecords.filter(record => record.student_id == student.id);
            
            const totalClasses = studentAttendance.length;
            const attendedClasses = studentAttendance.filter(record => record.status === 'present').length;
            const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

            return {
                id: student.id,
                name: student.name,
                totalClasses,
                attendedClasses,
                percentage,
                dateRange: `${fromDate} - ${toDate}`
            };
        });

        res.status(200).json({ reportData });
    } catch (error) {
        console.error(`Error fetching date range report for faculty_id: ${req.user.id}:`, error.message, error.stack);
        res.status(500).json({ message: 'Failed to fetch attendance report', error: error.message });
    }
});

// Get monthly attendance report
router.get('/report/monthly', authenticate, restrictTo('faculty'), async (req, res) => {
    const { semester, subject, month, year } = req.query;
    
    if (!semester || !subject || month === undefined || !year) {
        return res.status(400).json({ message: 'Semester, subject, month, and year are required' });
    }

    try {
        // Get faculty info to filter students by branch
        const [faculty] = await db.query('SELECT branch FROM faculty WHERE id = ?', [req.user.id]);
        if (faculty.length === 0) {
            return res.status(403).json({ message: 'Invalid faculty user' });
        }

        // Get all students in the faculty's branch
        const [students] = await db.query(
            'SELECT id, name FROM users WHERE branch = ? AND role = "student"',
            [faculty[0].branch]
        );

        if (students.length === 0) {
            return res.status(200).json({ reportData: [] });
        }

        // Calculate date range for the selected month and year
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, parseInt(month) + 1, 0); // Last day of the month
        
        const formatDate = (date) => date.toISOString().split('T')[0];
        const fromDate = formatDate(startDate);
        const toDate = formatDate(endDate);

        // Get attendance records for the month
        const [attendanceRecords] = await db.query(`
            SELECT 
                student_id,
                status,
                date
            FROM attendance 
            WHERE faculty_id = ? 
            AND semester = ? 
            AND subject = ? 
            AND date BETWEEN ? AND ?
            AND student_id != 0
            ORDER BY student_id, date
        `, [req.user.id, semester, subject, fromDate, toDate]);

        // Calculate attendance statistics for each student
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthName = months[parseInt(month)];
        const monthYear = `${monthName} ${year}`;

        const reportData = students.map(student => {
            const studentAttendance = attendanceRecords.filter(record => record.student_id == student.id);
            
            const totalClasses = studentAttendance.length;
            const attendedClasses = studentAttendance.filter(record => record.status === 'present').length;
            const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

            return {
                id: student.id,
                name: student.name,
                totalClasses,
                attendedClasses,
                percentage,
                monthYear,
                attendanceDisplay: `${attendedClasses}/${totalClasses}`
            };
        });

        res.status(200).json({ reportData });
    } catch (error) {
        console.error(`Error fetching monthly report for faculty_id: ${req.user.id}:`, error.message, error.stack);
        res.status(500).json({ message: 'Failed to fetch monthly attendance report', error: error.message });
    }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticate, restrictTo('faculty'), async (req, res) => {
    try {
        // Get faculty info
        const [faculty] = await db.query('SELECT branch FROM faculty WHERE id = ?', [req.user.id]);
        if (faculty.length === 0) {
            return res.status(403).json({ message: 'Invalid faculty user' });
        }

        // Get total students in faculty's branch
        const [studentsCount] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE branch = ? AND role = "student"',
            [faculty[0].branch]
        );

        // Get semesters and subjects count
        const [semestersCount] = await db.query(
            'SELECT COUNT(DISTINCT semester) as count FROM attendance WHERE faculty_id = ? AND semester != "DUMMY_SEMESTER"',
            [req.user.id]
        );
        
        const [subjectsCount] = await db.query(
            'SELECT COUNT(DISTINCT subject) as count FROM attendance WHERE faculty_id = ? AND subject != "DUMMY_SUBJECT"',
            [req.user.id]
        );

        // Get attendance marked today
        const today = new Date().toISOString().split('T')[0];
        const [attendanceToday] = await db.query(
            'SELECT COUNT(DISTINCT student_id) as count FROM attendance WHERE faculty_id = ? AND date = ? AND student_id != 0',
            [req.user.id, today]
        );

        const stats = {
            totalStudents: studentsCount[0].count,
            totalSemesters: semestersCount[0].count,
            totalSubjects: subjectsCount[0].count,
            attendanceMarkedToday: attendanceToday[0].count
        };

        res.status(200).json({ stats });
    } catch (error) {
        console.error(`Error fetching dashboard stats for faculty_id: ${req.user.id}:`, error.message, error.stack);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics', error: error.message });
    }
});

module.exports = router;