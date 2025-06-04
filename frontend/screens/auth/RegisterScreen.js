import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/ip';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RegisterScreen({ navigation }) {
    const [mode, setMode] = useState('student'); // 'student' or 'admin'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [branch, setBranch] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const branches = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'];

    const handleRegister = async () => {
        // Validate inputs
        if (!name || !email || !password || !confirmPassword || !branch) {
            Alert.alert('Error', 'All fields are required');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        // Validate password strength
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            // Set role based on mode
            const role = mode === 'student' ? 'student' : 'super_admin';
            await axios.post(`${API_BASE_URL}/api/auth/signup`, { name, email, password, role, branch });
            Alert.alert('Success', 'Registration successful! Please login.');
            navigation.navigate('Login');
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            Alert.alert('Error', message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <View style={styles.toggleContainer}>
                <Button
                    mode={mode === 'student' ? 'contained' : 'outlined'}
                    onPress={() => setMode('student')}
                    style={[styles.toggleButton, mode === 'student' ? styles.activeButton : null]}
                    labelStyle={mode === 'student' ? styles.activeButtonText : styles.inactiveButtonText}
                >
                    Student
                </Button>
                <Button
                    mode={mode === 'admin' ? 'contained' : 'outlined'}
                    onPress={() => setMode('admin')}
                    style={[styles.toggleButton, mode === 'admin' ? styles.activeButton : null]}
                    labelStyle={mode === 'admin' ? styles.activeButtonText : styles.inactiveButtonText}
                >
                    Admin
                </Button>
            </View>
            <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
                theme={{ colors: { primary: '#6200ea' } }}
            />
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                theme={{ colors: { primary: '#6200ea' } }}
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={[styles.input, styles.passwordInput]}
                    mode="outlined"
                    theme={{ colors: { primary: '#6200ea' } }}
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Icon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color="#808080"
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
                <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.input, styles.passwordInput]}
                    mode="outlined"
                    theme={{ colors: { primary: '#6200ea' } }}
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    <Icon
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color="#808080"
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={branch}
                    onValueChange={(value) => setBranch(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Branch" value="" />
                    {branches.map((b) => (
                        <Picker.Item key={b} label={b} value={b} />
                    ))}
                </Picker>
            </View>
            <Button mode="contained" onPress={handleRegister} style={styles.button}>
                {mode === 'student' ? 'Register as Student' : 'Register as Admin'}
            </Button>
            <Button onPress={() => navigation.navigate('Login')} style={styles.link}>
                Already have an account? Login
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    toggleButton: {
        flex: 1,
        marginHorizontal: 5,
        borderColor: '#6200ea',
    },
    activeButton: {
        backgroundColor: '#6200ea',
    },
    activeButtonText: {
        color: '#fff',
    },
    inactiveButtonText: {
        color: '#6200ea',
    },
    input: {
        marginBottom: 15,
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    passwordInput: {
        paddingRight: 40,
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 5,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    picker: {
        height: 50,
    },
    button: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#6200ea',
    },
    link: {
        marginTop: 15,
        color: '#6200ea',
    },
});