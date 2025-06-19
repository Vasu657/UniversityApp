import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Card, TextInput, Title, ActivityIndicator, IconButton, Chip, ProgressBar } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/ip';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// Home Screen Component
function HomeScreen({ facultyData, dashboardStats, navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.welcomeHeader}>
            <Icon name="account-circle" size={60} color="#1E88E5" />
            <View style={styles.welcomeText}>
              <Title style={styles.welcomeTitle}>Welcome Back!</Title>
              <Text style={styles.welcomeSubtitle}>
                {facultyData.name || 'Faculty Member'}
              </Text>
              <Text style={styles.welcomeBranch}>
                {facultyData.branch || 'Department'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="account-group" size={30} color="#4CAF50" />
            <Text style={styles.statNumber}>{dashboardStats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="school" size={30} color="#FF9800" />
            <Text style={styles.statNumber}>{dashboardStats.totalSemesters}</Text>
            <Text style={styles.statLabel}>Semesters</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="book-open-variant" size={30} color="#9C27B0" />
            <Text style={styles.statNumber}>{dashboardStats.totalSubjects}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="check-circle" size={30} color="#2196F3" />
            <Text style={styles.statNumber}>{dashboardStats.attendanceMarkedToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.recentActivityCard}>
        <Card.Content>
          <Title style={styles.recentActivityTitle}>Recent Activity</Title>
          <View style={styles.activityItem}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.activityText}>Attendance marked for Mathematics</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Icon name="plus-circle" size={20} color="#2196F3" />
            <Text style={styles.activityText}>New subject added: Physics</Text>
            <Text style={styles.activityTime}>1 day ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Icon name="account-plus" size={20} color="#FF9800" />
            <Text style={styles.activityText}>5 new students enrolled</Text>
            <Text style={styles.activityTime}>3 days ago</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

// Mark Attendance Screen Component
function MarkAttendanceScreen({ 
  students, 
  semesters, 
  subjects, 
  selectedSemester, 
  setSelectedSemester,
  selectedSubject, 
  setSelectedSubject,
  attendanceDate, 
  setAttendanceDate,
  showDatePicker, 
  setShowDatePicker,
  attendance, 
  setAttendance,
  newSemester, 
  setNewSemester,
  newSubject, 
  setNewSubject,
  isAdding, 
  setIsAdding,
  handleDateChange,
  toggleAttendance,
  saveAttendance,
  addSemester,
  addSubject
}) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentWithPadding}>
      {/* Add Semester/Subject Section */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => setIsAdding(!isAdding)}
            style={styles.toggleButton}
            labelStyle={styles.toggleButtonLabel}
            icon={isAdding ? "chevron-up" : "chevron-down"}
          >
            {isAdding ? 'Hide Add Options' : 'Add Semester/Subject'}
          </Button>
          {isAdding && (
            <>
              <TextInput
                label="New Semester (e.g., Semester 1)"
                value={newSemester}
                onChangeText={setNewSemester}
                style={styles.input}
                mode="outlined"
              />
              <Button
                mode="contained"
                onPress={addSemester}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                icon="plus"
              >
                Add Semester
              </Button>
              <TextInput
                label="New Subject (e.g., Mathematics)"
                value={newSubject}
                onChangeText={setNewSubject}
                style={styles.input}
                mode="outlined"
              />
              <Button
                mode="contained"
                onPress={addSubject}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                icon="plus"
              >
                Add Subject
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Attendance Form */}
      <Card style={styles.formCard}>
        <Card.Content>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Semester</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={selectedSemester}
                onValueChange={setSelectedSemester}
                style={styles.picker}
              >
                <Picker.Item label="Select Semester" value="" />
                {semesters.map((sem, index) => (
                  <Picker.Item key={index} label={sem} value={sem} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Subject</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={selectedSubject}
                onValueChange={setSelectedSubject}
                style={styles.picker}
              >
                <Picker.Item label="Select Subject" value="" />
                {subjects.map((sub, index) => (
                  <Picker.Item key={index} label={sub} value={sub} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.datePickerContainer}>
            <Text style={styles.dateLabel}>Attendance Date</Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              labelStyle={styles.dateButtonLabel}
              icon="calendar"
            >
              {attendanceDate.toLocaleDateString()}
            </Button>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={attendanceDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </Card.Content>
      </Card>

      {/* Student List */}
      <Text style={styles.sectionTitle}>Mark Attendance</Text>
      {students.length === 0 ? (
        <Text style={styles.noDataText}>No students found.</Text>
      ) : (
        students.map(student => (
          <Card key={student.id} style={styles.studentCard}>
            <Card.Content style={styles.studentCardContent}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentId}>ID: {student.student_id || student.id}</Text>
              </View>
              <View style={styles.attendanceButtons}>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.presentButton,
                    attendance[student.id] === 'present' && styles.activeButton
                  ]}
                  onPress={() => toggleAttendance(student.id)}
                >
                  <Icon 
                    name="check-circle" 
                    size={20} 
                    color={attendance[student.id] === 'present' ? '#FFFFFF' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.attendanceButtonText,
                    attendance[student.id] === 'present' && styles.activeButtonText
                  ]}>
                    Present
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.absentButton,
                    attendance[student.id] === 'absent' && styles.activeButton
                  ]}
                  onPress={() => toggleAttendance(student.id)}
                >
                  <Icon 
                    name="close-circle" 
                    size={20} 
                    color={attendance[student.id] === 'absent' ? '#FFFFFF' : '#EF5350'} 
                  />
                  <Text style={[
                    styles.attendanceButtonText,
                    attendance[student.id] === 'absent' && styles.activeButtonText
                  ]}>
                    Absent
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        ))
      )}

      {/* Save Button */}
      <Card style={styles.saveButtonCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={saveAttendance}
            style={styles.saveButton}
            labelStyle={styles.saveButtonLabel}
            icon="content-save"
            contentStyle={styles.saveButtonContent}
          >
            Save Attendance
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

// Reports Screen Component  
function ReportsScreen({ 
  semesters, 
  subjects, 
  reportSemester, 
  setReportSemester,
  reportSubject, 
  setReportSubject,
  attendanceReport, 
  reportLoading,
  reportFromDate,
  setReportFromDate,
  reportToDate,
  setReportToDate,
  showFromDatePicker,
  setShowFromDatePicker,
  showToDatePicker,
  setShowToDatePicker,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  reportViewType,
  setReportViewType,
  monthlyReports,
  handleFromDateChange,
  handleToDateChange,
  fetchAttendanceReport,
  fetchMonthlyAttendanceReport
}) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }

  const displayData = reportViewType === 'monthly' ? monthlyReports : attendanceReport;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Attendance Reports</Text>
      
      <Card style={styles.formCard}>
        <Card.Content>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Semester</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={reportSemester}
                onValueChange={setReportSemester}
                style={styles.picker}
              >
                <Picker.Item label="Select Semester" value="" />
                {semesters.map((sem, index) => (
                  <Picker.Item key={index} label={sem} value={sem} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Subject</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={reportSubject}
                onValueChange={setReportSubject}
                style={styles.picker}
              >
                <Picker.Item label="Select Subject" value="" />
                {subjects.map((sub, index) => (
                  <Picker.Item key={index} label={sub} value={sub} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Generate Report Button */}
          <Button
            mode="contained"
            onPress={() => {
              if (reportViewType === 'monthly') {
                fetchMonthlyAttendanceReport();
              } else {
                fetchAttendanceReport();
              }
            }}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon="chart-line"
            disabled={!reportSemester || !reportSubject}
          >
            Generate Report
          </Button>
        </Card.Content>
      </Card>

      {/* Report View Type Selector */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Text style={styles.pickerLabel}>Report Type</Text>
          <View style={styles.reportTypeContainer}>
            <TouchableOpacity
              style={[
                styles.reportTypeButton,
                reportViewType === 'monthly' && styles.activeReportTypeButton
              ]}
              onPress={() => setReportViewType('monthly')}
            >
              <Icon 
                name="calendar-month" 
                size={20} 
                color={reportViewType === 'monthly' ? '#FFFFFF' : '#1E88E5'} 
              />
              <Text style={[
                styles.reportTypeText,
                reportViewType === 'monthly' && styles.activeReportTypeText
              ]}>
                Monthly View
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.reportTypeButton,
                reportViewType === 'dateRange' && styles.activeReportTypeButton
              ]}
              onPress={() => setReportViewType('dateRange')}
            >
              <Icon 
                name="calendar-range" 
                size={20} 
                color={reportViewType === 'dateRange' ? '#FFFFFF' : '#1E88E5'} 
              />
              <Text style={[
                styles.reportTypeText,
                reportViewType === 'dateRange' && styles.activeReportTypeText
              ]}>
                Date Range
              </Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Date Filters */}
      <Card style={styles.formCard}>
        <Card.Content>
          {reportViewType === 'monthly' ? (
            <>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Select Month</Text>
                <View style={styles.pickerBorder}>
                  <Picker
                    selectedValue={selectedMonth}
                    onValueChange={setSelectedMonth}
                    style={styles.picker}
                  >
                    {months.map((month, index) => (
                      <Picker.Item key={index} label={month} value={index} />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Select Year</Text>
                <View style={styles.pickerBorder}>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={setSelectedYear}
                    style={styles.picker}
                  >
                    {years.map((year, index) => (
                      <Picker.Item key={index} label={year.toString()} value={year} />
                    ))}
                  </Picker>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>From Date</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowFromDatePicker(true)}
                  style={styles.dateButton}
                  labelStyle={styles.dateButtonLabel}
                  icon="calendar"
                >
                  {reportFromDate.toLocaleDateString()}
                </Button>
              </View>
              
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>To Date</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowToDatePicker(true)}
                  style={styles.dateButton}
                  labelStyle={styles.dateButtonLabel}
                  icon="calendar"
                >
                  {reportToDate.toLocaleDateString()}
                </Button>
              </View>
              
              {showFromDatePicker && (
                <DateTimePicker
                  value={reportFromDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleFromDateChange}
                  maximumDate={reportToDate}
                />
              )}
              
              {showToDatePicker && (
                <DateTimePicker
                  value={reportToDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleToDateChange}
                  minimumDate={reportFromDate}
                  maximumDate={new Date()}
                />
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {reportLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading Report...</Text>
        </View>
      ) : displayData.length > 0 ? (
        <>
          <Card style={styles.reportSummaryCard}>
            <Card.Content>
              <Title style={styles.reportTitle}>
                {reportSubject} - {reportSemester}
              </Title>
              <Text style={styles.reportSubtitle}>
                {reportViewType === 'monthly' 
                  ? `${months[selectedMonth]} ${selectedYear}`
                  : `${reportFromDate.toLocaleDateString()} - ${reportToDate.toLocaleDateString()}`
                }
              </Text>
              <View style={styles.reportSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {displayData.length}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Students</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {Math.round(displayData.reduce((acc, student) => acc + student.percentage, 0) / displayData.length)}%
                  </Text>
                  <Text style={styles.summaryLabel}>Avg Attendance</Text>
                </View>
                {reportViewType === 'monthly' && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>
                      {Math.round(displayData.reduce((acc, student) => acc + student.totalClasses, 0) / displayData.length)}
                    </Text>
                    <Text style={styles.summaryLabel}>Avg Classes</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {displayData.map((student, index) => (
            <Card key={student.id} style={styles.reportCard}>
              <Card.Content>
                <View style={styles.reportStudentHeader}>
                  <View style={styles.studentReportInfo}>
                    <Text style={styles.reportStudentName}>{student.name}</Text>
                    {reportViewType === 'monthly' && (
                      <Text style={styles.attendanceDisplay}>
                        {student.attendanceDisplay}
                      </Text>
                    )}
                  </View>
                  <Chip 
                    style={[
                      styles.attendanceChip,
                      student.percentage >= 75 ? styles.goodAttendance : 
                      student.percentage >= 60 ? styles.averageAttendance : styles.poorAttendance
                    ]}
                    textStyle={styles.chipText}
                  >
                    {student.percentage}%
                  </Chip>
                </View>
                
                <View style={styles.reportDetails}>
                  <Text style={styles.reportDetailText}>
                    Classes Attended: {student.attendedClasses}/{student.totalClasses}
                    {reportViewType === 'monthly' && ` (${months[selectedMonth]} ${selectedYear})`}
                  </Text>
                  <ProgressBar 
                    progress={student.percentage / 100} 
                    color={student.percentage >= 75 ? '#4CAF50' : student.percentage >= 60 ? '#FF9800' : '#F44336'}
                    style={styles.progressBar}
                  />
                  {student.percentage < 75 && (
                    <Text style={styles.warningText}>
                      ⚠️ Below 75% attendance requirement
                    </Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </>
      ) : (
        <Card style={styles.noDataCard}>
          <Card.Content style={styles.noDataContent}>
            <Icon name="chart-line" size={60} color="#BDBDBD" />
            <Text style={styles.noDataText}>
              {!reportSemester || !reportSubject ? 
                'Select semester and subject, then click "Generate Report"' : 
                reportLoading ? 
                'Loading...' :
                'No attendance data found for the selected criteria. This could mean:\n\n• No attendance has been marked for this subject/semester\n• No students are enrolled in your branch\n• The selected date range has no recorded attendance'
              }
            </Text>
            {reportSemester && reportSubject && !reportLoading && (
              <Button
                mode="outlined"
                onPress={() => {
                  if (reportViewType === 'monthly') {
                    fetchMonthlyAttendanceReport();
                  } else {
                    fetchAttendanceReport();
                  }
                }}
                style={[styles.button, { marginTop: 16 }]}
                labelStyle={styles.buttonLabel}
                icon="refresh"
              >
                Retry
              </Button>
            )}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

// Main Component
const StudentAttendance = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [newSemester, setNewSemester] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // States for reports
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSemester, setReportSemester] = useState('');
  const [reportSubject, setReportSubject] = useState('');
  const [reportFromDate, setReportFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [reportToDate, setReportToDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportViewType, setReportViewType] = useState('monthly'); // 'monthly', 'dateRange'
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [facultyData, setFacultyData] = useState({});
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalSemesters: 0,
    totalSubjects: 0,
    attendanceMarkedToday: 0
  });

  useEffect(() => {
    fetchData();
    fetchDashboardStats();
  }, []);

  // Remove automatic fetching - users will click "Generate Report" button instead
  // useEffect(() => {
  //   if (reportSemester && reportSubject) {
  //     if (reportViewType === 'monthly') {
  //       fetchMonthlyAttendanceReport();
  //     } else {
  //       fetchAttendanceReport();
  //     }
  //   }
  // }, [reportSemester, reportSubject, selectedMonth, selectedYear, reportFromDate, reportToDate, reportViewType]);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);
      setFacultyData(user);

      // Fetch students
      const studentsResponse = await axios.get(
        `${API_BASE_URL}/api/dashboard/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { branch: user.branch },
        }
      );
      setStudents(studentsResponse.data.students || []);

      // Fetch semesters and subjects
      const configResponse = await axios.get(
        `${API_BASE_URL}/api/attendance/config`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSemesters(configResponse.data.semesters || []);
      setSubjects(configResponse.data.subjects || []);

      // Initialize attendance state
      const initialAttendance = {};
      studentsResponse.data.students.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      //console.error('Fetch data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch dashboard statistics from backend
      const statsResponse = await axios.get(
        `${API_BASE_URL}/api/attendance/dashboard/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDashboardStats(statsResponse.data.stats);
    } catch (error) {
      console.error('Fetch dashboard stats error:', error);
      // Fallback to default values if API call fails
      setDashboardStats({
        totalStudents: 0,
        totalSemesters: 0,
        totalSubjects: 0,
        attendanceMarkedToday: 0
      });
    }
  };

  const fetchAttendanceReport = async () => {
    if (!reportSemester || !reportSubject) return;
    
    setReportLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Format dates for API call
      const fromDate = reportFromDate.toISOString().split('T')[0];
      const toDate = reportToDate.toISOString().split('T')[0];
      
      // Fetch real attendance report from backend
      const response = await axios.get(
        `${API_BASE_URL}/api/attendance/report/date-range`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            semester: reportSemester,
            subject: reportSubject,
            fromDate: fromDate,
            toDate: toDate
          }
        }
      );
      
      setAttendanceReport(response.data.reportData || []);
    } catch (error) {
      console.error('Fetch attendance report error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch attendance report');
      setAttendanceReport([]);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchMonthlyAttendanceReport = async () => {
    if (!reportSemester || !reportSubject) return;
    
    setReportLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch real monthly attendance report from backend
      const response = await axios.get(
        `${API_BASE_URL}/api/attendance/report/monthly`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            semester: reportSemester,
            subject: reportSubject,
            month: selectedMonth,
            year: selectedYear
          }
        }
      );
      
      setMonthlyReports(response.data.reportData || []);
    } catch (error) {
      console.error('Fetch monthly attendance report error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch monthly attendance report');
      setMonthlyReports([]);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setAttendanceDate(selectedDate);
    }
  };

  const handleFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setReportFromDate(selectedDate);
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    setShowToDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setReportToDate(selectedDate);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const saveAttendance = async () => {
    if (!selectedSemester || !selectedSubject) {
      Alert.alert('Error', 'Please select a semester and subject');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const attendanceData = Object.keys(attendance).map(studentId => ({
        student_id: studentId,
        status: attendance[studentId],
        date: attendanceDate.toISOString().split('T')[0],
        semester: selectedSemester,
        subject: selectedSubject
      }));

      await axios.post(
        `${API_BASE_URL}/api/attendance/mark`,
        { attendance: attendanceData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Attendance marked successfully');
      fetchData(); // Refresh data
    } catch (error) {
      //console.error('Save attendance error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save attendance');
    }
  };

  const addSemester = async () => {
    if (!newSemester) {
      Alert.alert('Error', 'Please enter a semester');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/attendance/add-semester`,
        { semester: newSemester },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Semester added successfully');
      setNewSemester('');
      fetchData();
      fetchDashboardStats();
    } catch (error) {
      //console.error('Add semester error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add semester');
    }
  };

  const addSubject = async () => {
    if (!newSubject) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/attendance/add-subject`,
        { subject: newSubject },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Subject added successfully');
      setNewSubject('');
      fetchData();
      fetchDashboardStats();
    } catch (error) {
      //console.error('Add subject error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add subject');
    }
  };

  // Render Home Tab
  const renderHome = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.welcomeHeader}>
            <Icon name="account-circle" size={60} color="#1E88E5" />
            <View style={styles.welcomeText}>
              <Title style={styles.welcomeTitle}>Welcome Back!</Title>
              <Text style={styles.welcomeSubtitle}>
                {facultyData.name || 'Faculty Member'}
              </Text>
              <Text style={styles.welcomeBranch}>
                {facultyData.branch || 'Department'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="account-group" size={30} color="#4CAF50" />
            <Text style={styles.statNumber}>{dashboardStats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="school" size={30} color="#FF9800" />
            <Text style={styles.statNumber}>{dashboardStats.totalSemesters}</Text>
            <Text style={styles.statLabel}>Semesters</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="book-open-variant" size={30} color="#9C27B0" />
            <Text style={styles.statNumber}>{dashboardStats.totalSubjects}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="check-circle" size={30} color="#2196F3" />
            <Text style={styles.statNumber}>{dashboardStats.attendanceMarkedToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <Title style={styles.quickActionsTitle}>Quick Actions</Title>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveTab('attendance')}
            >
              <Icon name="clipboard-check" size={24} color="#1E88E5" />
              <Text style={styles.quickActionText}>Mark Attendance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveTab('report')}
            >
              <Icon name="chart-line" size={24} color="#1E88E5" />
              <Text style={styles.quickActionText}>View Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setIsAdding(true)}
            >
              <Icon name="plus-circle" size={24} color="#1E88E5" />
              <Text style={styles.quickActionText}>Add Semester</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => fetchData()}
            >
              <Icon name="refresh" size={24} color="#1E88E5" />
              <Text style={styles.quickActionText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.recentActivityCard}>
        <Card.Content>
          <Title style={styles.recentActivityTitle}>Recent Activity</Title>
          <View style={styles.activityItem}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.activityText}>Attendance marked for Mathematics</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Icon name="plus-circle" size={20} color="#2196F3" />
            <Text style={styles.activityText}>New subject added: Physics</Text>
            <Text style={styles.activityTime}>1 day ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Icon name="account-plus" size={20} color="#FF9800" />
            <Text style={styles.activityText}>5 new students enrolled</Text>
            <Text style={styles.activityTime}>3 days ago</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  // Render Report Tab
  const renderReport = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Attendance Reports</Text>
      
      <Card style={styles.formCard}>
        <Card.Content>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Semester</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={reportSemester}
                onValueChange={setReportSemester}
                style={styles.picker}
              >
                <Picker.Item label="Select Semester" value="" />
                {semesters.map((sem, index) => (
                  <Picker.Item key={index} label={sem} value={sem} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Subject</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={reportSubject}
                onValueChange={setReportSubject}
                style={styles.picker}
              >
                <Picker.Item label="Select Subject" value="" />
                {subjects.map((sub, index) => (
                  <Picker.Item key={index} label={sub} value={sub} />
                ))}
              </Picker>
            </View>
          </View>
        </Card.Content>
      </Card>

      {reportLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading Report...</Text>
        </View>
      ) : attendanceReport.length > 0 ? (
        <>
          <Card style={styles.reportSummaryCard}>
            <Card.Content>
              <Title style={styles.reportTitle}>
                {reportSubject} - {reportSemester}
              </Title>
              <View style={styles.reportSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {attendanceReport.length}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Students</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {Math.round(attendanceReport.reduce((acc, student) => acc + student.percentage, 0) / attendanceReport.length)}%
                  </Text>
                  <Text style={styles.summaryLabel}>Avg Attendance</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {attendanceReport.map((student, index) => (
            <Card key={student.id} style={styles.reportCard}>
              <Card.Content>
                <View style={styles.reportStudentHeader}>
                  <Text style={styles.reportStudentName}>{student.name}</Text>
                  <Chip 
                    style={[
                      styles.attendanceChip,
                      student.percentage >= 75 ? styles.goodAttendance : 
                      student.percentage >= 60 ? styles.averageAttendance : styles.poorAttendance
                    ]}
                    textStyle={styles.chipText}
                  >
                    {student.percentage}%
                  </Chip>
                </View>
                
                <View style={styles.reportDetails}>
                  <Text style={styles.reportDetailText}>
                    Classes Attended: {student.attendedClasses}/{student.totalClasses}
                  </Text>
                  <ProgressBar 
                    progress={student.percentage / 100} 
                    color={student.percentage >= 75 ? '#4CAF50' : student.percentage >= 60 ? '#FF9800' : '#F44336'}
                    style={styles.progressBar}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
        </>
      ) : (
        <Card style={styles.noDataCard}>
          <Card.Content style={styles.noDataContent}>
            <Icon name="chart-line" size={60} color="#BDBDBD" />
            <Text style={styles.noDataText}>
              {!reportSemester || !reportSubject ? 
                'Select semester and subject to view report' : 
                'No attendance data found'
              }
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  // Render Mark Attendance Tab (existing content)
  const renderMarkAttendance = () => (
    <ScrollView style={styles.tabContent}>
      {/* Add Semester/Subject Section */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => setIsAdding(!isAdding)}
            style={styles.toggleButton}
            labelStyle={styles.toggleButtonLabel}
            icon={isAdding ? "chevron-up" : "chevron-down"}
          >
            {isAdding ? 'Hide Add Options' : 'Add Semester/Subject'}
          </Button>
          {isAdding && (
            <>
              <TextInput
                label="New Semester (e.g., Semester 1)"
                value={newSemester}
                onChangeText={setNewSemester}
                style={styles.input}
                mode="outlined"
              />
              <Button
                mode="contained"
                onPress={addSemester}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                icon="plus"
              >
                Add Semester
              </Button>
              <TextInput
                label="New Subject (e.g., Mathematics)"
                value={newSubject}
                onChangeText={setNewSubject}
                style={styles.input}
                mode="outlined"
              />
              <Button
                mode="contained"
                onPress={addSubject}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                icon="plus"
              >
                Add Subject
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Attendance Form */}
      <Card style={styles.formCard}>
        <Card.Content>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Semester</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={selectedSemester}
                onValueChange={setSelectedSemester}
                style={styles.picker}
              >
                <Picker.Item label="Select Semester" value="" />
                {semesters.map((sem, index) => (
                  <Picker.Item key={index} label={sem} value={sem} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Subject</Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={selectedSubject}
                onValueChange={setSelectedSubject}
                style={styles.picker}
              >
                <Picker.Item label="Select Subject" value="" />
                {subjects.map((sub, index) => (
                  <Picker.Item key={index} label={sub} value={sub} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.datePickerContainer}>
            <Text style={styles.dateLabel}>Attendance Date</Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              labelStyle={styles.dateButtonLabel}
              icon="calendar"
            >
              {attendanceDate.toLocaleDateString()}
            </Button>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={attendanceDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </Card.Content>
      </Card>

      {/* Student List */}
      <Text style={styles.sectionTitle}>Mark Attendance</Text>
      {students.length === 0 ? (
        <Text style={styles.noDataText}>No students found.</Text>
      ) : (
        students.map(student => (
          <Card key={student.id} style={styles.studentCard}>
            <Card.Content style={styles.studentCardContent}>
              <Text style={styles.studentName}>{student.name}</Text>
              <View style={styles.attendanceButtons}>
                <Button
                  mode={attendance[student.id] === 'present' ? 'contained' : 'outlined'}
                  onPress={() => toggleAttendance(student.id)}
                  style={[styles.attendanceButton, attendance[student.id] === 'present' && styles.presentButton]}
                  labelStyle={styles.attendanceButtonLabel}
                >
                  Present
                </Button>
                <Button
                  mode={attendance[student.id] === 'absent' ? 'contained' : 'outlined'}
                  onPress={() => toggleAttendance(student.id)}
                  style={[styles.attendanceButton, attendance[student.id] === 'absent' && styles.absentButton]}
                  labelStyle={styles.attendanceButtonLabel}
                >
                  Absent
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))
      )}

      <Button
        mode="contained"
        onPress={saveAttendance}
        style={styles.button}
        labelStyle={styles.buttonLabel}
        icon="check"
      >
        Save Attendance
      </Button>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Student Attendance</Text>
          </View>
          <IconButton
            icon="refresh"
            color="#FFFFFF"
            size={24}
            onPress={() => {
              fetchData();
              fetchDashboardStats();
            }}
            style={styles.headerRefreshButton}
          />
        </View>
      </View>

      {/* Tab Navigator */}
      <View style={styles.tabContainer}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === 'Home') iconName = 'home';
              else if (route.name === 'Mark Attendance') iconName = 'clipboard-check';
              else if (route.name === 'Reports') iconName = 'chart-line';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#1E88E5',
            tabBarInactiveTintColor: '#757575',
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home">
            
            {() => <HomeScreen facultyData={facultyData} dashboardStats={dashboardStats} navigation={navigation} />}
          </Tab.Screen>
          <Tab.Screen name="Mark Attendance">
            {() => (
              <MarkAttendanceScreen
                students={students}
                semesters={semesters}
                subjects={subjects}
                selectedSemester={selectedSemester}
                setSelectedSemester={setSelectedSemester}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                attendanceDate={attendanceDate}
                setAttendanceDate={setAttendanceDate}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
                attendance={attendance}
                setAttendance={setAttendance}
                newSemester={newSemester}
                setNewSemester={setNewSemester}
                newSubject={newSubject}
                setNewSubject={setNewSubject}
                isAdding={isAdding}
                setIsAdding={setIsAdding}
                handleDateChange={handleDateChange}
                toggleAttendance={toggleAttendance}
                saveAttendance={saveAttendance}
                addSemester={addSemester}
                addSubject={addSubject}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Reports">
            {() => (
              <ReportsScreen
                semesters={semesters}
                subjects={subjects}
                reportSemester={reportSemester}
                setReportSemester={setReportSemester}
                reportSubject={reportSubject}
                setReportSubject={setReportSubject}
                attendanceReport={attendanceReport}
                reportLoading={reportLoading}
                reportFromDate={reportFromDate}
                setReportFromDate={setReportFromDate}
                reportToDate={reportToDate}
                setReportToDate={setReportToDate}
                showFromDatePicker={showFromDatePicker}
                setShowFromDatePicker={setShowFromDatePicker}
                showToDatePicker={showToDatePicker}
                setShowToDatePicker={setShowToDatePicker}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                reportViewType={reportViewType}
                setReportViewType={setReportViewType}
                monthlyReports={monthlyReports}
                handleFromDateChange={handleFromDateChange}
                handleToDateChange={handleToDateChange}
                fetchAttendanceReport={fetchAttendanceReport}
                fetchMonthlyAttendanceReport={fetchMonthlyAttendanceReport}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#64B5F6',
    paddingVertical: 30,
    paddingHorizontal: 2,
    paddingBottom: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  headerRefreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
  },
  tabContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  scrollContentWithPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Extra padding for save button
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    elevation: 6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 5,
    height: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 5,
  },
  
  // Home Tab Styles
  welcomeCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  welcomeText: {
    flex: 1,
    marginLeft: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#1E88E5',
    fontWeight: '600',
    marginBottom: 2,
  },
  welcomeBranch: {
    fontSize: 14,
    color: '#757575',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 80) / 2,
    backgroundColor: 'rgba(30, 136, 229, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.2)',
  },
  quickActionText: {
    fontSize: 12,
    color: '#1E88E5',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentActivityCard: {
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#757575',
  },
  
  // Report Tab Styles
  reportSummaryCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  reportSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reportSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E88E5',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  reportCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  reportStudentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  studentReportInfo: {
    flex: 1,
  },
  attendanceDisplay: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
    marginTop: 4,
  },
  attendanceChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goodAttendance: {
    backgroundColor: '#4CAF50',
  },
  averageAttendance: {
    backgroundColor: '#FF9800',
  },
  poorAttendance: {
    backgroundColor: '#F44336',
  },
  reportDetails: {
    marginTop: 8,
  },
  reportDetailText: {
    fontSize: 14,
  },
  reportDetails: {
    marginTop: 8,
  },
  reportDetailText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    fontWeight: '500',
  },
  reportTypeContainer: {
    flexDirection: 'row',
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    padding: 4,
  },
  reportTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  activeReportTypeButton: {
    backgroundColor: '#1E88E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reportTypeText: {
    fontSize: 14,
    color: '#1E88E5',
    marginLeft: 8,
    fontWeight: '600',
  },
  activeReportTypeText: {
    color: '#FFFFFF',
  },
  noDataCard: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 40,
  },
  noDataContent: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Common Styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 16,
    color: '#212121',
    textAlign: 'center',
  },
  formCard: {
    marginVertical: 10,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 0,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#1E88E5',
    marginBottom: 8,
    fontWeight: '600',
  },
  picker: {
    height: 50,
    color: '#212121',
    backgroundColor: '#FFFFFF',
  },
  pickerBorder: {
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 8,
    backgroundColor: 'rgba(100, 181, 246, 0.05)',
    marginTop: 5,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E88E5',
    padding: 12,
  },
  dateLabel: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  dateButton: {
    borderColor: '#1E88E5',
    borderRadius: 8,
    marginLeft: 10,
  },
  dateButtonLabel: {
    color: '#1E88E5',
    fontSize: 14,
  },
  button: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
    paddingVertical: 5,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleButton: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderColor: '#1E88E5',
    borderRadius: 8,
  },
  toggleButtonLabel: {
    color: '#1E88E5',
    fontSize: 14,
  },
  studentCard: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  studentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 12,
    color: '#757575',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 80,
    justifyContent: 'center',
  },
  presentButton: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  absentButton: {
    borderColor: '#EF5350',
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
  },
  activeButton: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  attendanceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#757575',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  saveButtonCard: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  saveButtonContent: {
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
});

export default StudentAttendance;