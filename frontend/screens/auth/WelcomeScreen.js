import React from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Animated, 
  ScrollView, 
  Dimensions,
  PanResponder 
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const scrollViewRef = React.useRef(null);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Slide data
  const slides = [
    {
      id: 1,
      title: "Welcome to OU Connect",
      subtitle: "Your Academic Journey Starts Here",
      description: "OU Connect is your all-in-one platform for seamless academic management at Osmania University. Access your dashboard, update profiles, and stay connected.",
      icon: "school",
      color: "#6200ea",
      features: [
        { icon: "account-circle", text: "Personal Dashboard" },
        { icon: "book-open-page-variant", text: "Academic Records" },
        { icon: "calendar-check", text: "Schedule Management" }
      ]
    },
    {
      id: 2,
      title: "Build Your Future",
      subtitle: "Professional Development Tools",
      description: "Create stunning resumes, track your achievements, and showcase your skills to potential employers with our integrated career development tools.",
      icon: "file-document-edit",
      color: "#00c853",
      features: [
        { icon: "file-document", text: "Resume Builder" },
        { icon: "trophy", text: "Achievement Tracker" },
        { icon: "briefcase", text: "Career Portal" }
      ]
    },
    {
      id: 3,
      title: "Stay Connected",
      subtitle: "Faculty & Administration Hub",
      description: "Connect with faculty members, access administrative services, and stay updated with university announcements and events.",
      icon: "account-group",
      color: "#ff6d00",
      features: [
        { icon: "message-text", text: "Faculty Chat" },
        { icon: "bell-ring", text: "Notifications" },
        { icon: "calendar-star", text: "Events & News" }
      ]
    },
    {
      id: 4,
      title: "Smart Features",
      subtitle: "Enhanced University Experience",
      description: "Enjoy advanced features like offline access, smart notifications, biometric security, and personalized recommendations.",
      icon: "brain",
      color: "#e91e63",
      features: [
        { icon: "wifi-off", text: "Offline Access" },
        { icon: "fingerprint", text: "Secure Login" },
        { icon: "lightbulb-on", text: "Smart Suggestions" }
      ]
    }
  ];

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optional: Add real-time swipe feedback
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50 && currentSlide > 0) {
        // Swipe right - previous slide
        goToSlide(currentSlide - 1);
      } else if (gestureState.dx < -50 && currentSlide < slides.length - 1) {
        // Swipe left - next slide
        goToSlide(currentSlide + 1);
      }
    },
  });



  // Initial animations
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Slide change animation
  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: currentSlide * 0.1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentSlide]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const renderSlide = (slide, index) => (
    <View key={slide.id} style={[styles.slide, { width }]} {...panResponder.panHandlers}>
      <Animated.View style={[
        styles.slideContent, 
        { 
          opacity: fadeAnim, 
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
            { rotate: `${rotateAnim._value}deg` }
          ] 
        }
      ]}>
        {/* University Logo - Only on first slide */}
        {index === 0 && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Image
              source={{ uri: 'https://i.postimg.cc/PCCJfcSr/osmania-logo.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {/* Main Icon */}
        <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
          <Icon name={slide.icon} size={60} color={slide.color} />
        </View>

        {/* Content */}
        <Text style={styles.title}>Osmania University</Text>
        <Text style={[styles.subtitle, { color: slide.color }]}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        <Text style={styles.description}>{slide.description}</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {slide.features.map((feature, idx) => (
            <Animated.View 
              key={idx} 
              style={[
                styles.featureItem,
                {
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 * (idx + 1), 0]
                    })
                  }]
                }
              ]}
            >
              <Icon name={feature.icon} size={24} color={slide.color} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Action Button */}
        {index === slides.length - 1 ? (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={[styles.actionButton, { backgroundColor: slide.color }]}
            labelStyle={styles.buttonText}
          >
            Get Started
          </Button>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, { borderColor: slide.color }]}
            onPress={() => goToSlide(index + 1)}
          >
            <Text style={[styles.nextButtonText, { color: slide.color }]}>Next</Text>
            <Icon name="arrow-right" size={20} color={slide.color} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentSlide(slideIndex);
        }}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Slide Indicators */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index === currentSlide ? slides[currentSlide].color : 'rgba(0,0,0,0.3)',
                transform: [{ scale: index === currentSlide ? 1.2 : 1 }]
              }
            ]}
            onPress={() => goToSlide(index)}
          />
        ))}
      </View>



      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
              backgroundColor: slides[currentSlide].color
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    borderRadius: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#5a6c7d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featureText: {
    fontSize: 15,
    color: '#2c3e50',
    marginLeft: 15,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 30,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    opacity: 0.8,
  },

  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});