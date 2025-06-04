import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        // Validate inputs
        if (!email || !password) {
            Alert.alert('Error', 'Email and password are required');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        try {
            // Try logging in as student
            let response;
            try {
                response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password, role: 'student' });
            } catch (error) {
                // If student login fails, try faculty
                try {
                    response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password, role: 'faculty' });
                } catch (error) {
                    // If faculty login fails, try super_admin
                    response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password, role: 'super_admin' });
                }
            }

            // Store token and user data
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify({ ...response.data.user, role: response.data.user.role }));

            // Navigate to appropriate dashboard
            if (response.data.user.role === 'student') {
                navigation.replace('StudentDashboard');
            } else if (response.data.user.role === 'faculty') {
                navigation.replace('FacultyDashboard');
            } else if (response.data.user.role === 'super_admin') {
                navigation.replace('SuperAdminDashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            Alert.alert('Error', message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
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
            <Button mode="contained" onPress={handleLogin} style={styles.button}>
                Login
            </Button>
            <Button onPress={() => navigation.navigate('Register')} style={styles.link}>
                Don't have an account? Register
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