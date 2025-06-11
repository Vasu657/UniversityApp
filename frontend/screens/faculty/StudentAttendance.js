import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, Card, TextInput, Title, ActivityIndicator, IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/ip';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);

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

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setAttendanceDate(selectedDate);
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
    } catch (error) {
      //console.error('Add subject error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add subject');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            color="#1E88E5"
            size={28}
            onPress={() => navigation.goBack()}
          />
          <Title style={styles.sectionTitle}>Student Attendance</Title>
        </View>

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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  innerContainer: {
    flex: 1,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 15,
    color: '#212121',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#757575',
    marginHorizontal: 20,
    marginVertical: 15,
    fontStyle: 'italic',
  },
  formCard: {
    width: '90%',
    marginVertical: 15,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
  },
  input: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
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
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E88E5',
    padding: 10,
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
    width: '90%',
    marginVertical: 10,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  studentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
    marginLeft: 15,
  },
  attendanceButtons: {
    flexDirection: 'row',
  },
  attendanceButton: {
    marginHorizontal: 5,
    borderRadius: 8,
  },
  presentButton: {
    backgroundColor: '#4CAF50',
  },
  absentButton: {
    backgroundColor: '#EF5350',
  },
  attendanceButtonLabel: {
    fontSize: 12,
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