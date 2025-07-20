import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { useAnalytics } from '@/providers/AnalyticsProvider';

export default function CameraScreen() {
  const user = useQuery(api.users.getCurrentUser);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const convex = useConvex();
  const createImageAnalysisJob = useMutation(api.analyse.createImageAnalysisJob);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const generateUploadUrl = useMutation(api.analyse.generateUploadUrl);
  const { selectedDate } = useLocalSearchParams<{ selectedDate: string }>();

  // Analytics
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.track({ name: 'Camera Viewed' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsMounted(false);
      setCamera(null);
    };
  }, []);

  if (!isMounted || !user || !permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="white" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionMessage}>
          Please allow camera access to scan the protein in your food
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleTorch = () => {
    const newState = !torch;
    setTorch(newState);
    analytics.track({ name: 'Camera Torch Toggled', properties: { enabled: newState } });
  };

  const takePicture = async () => {
    if (camera) {
      try {
        analytics.track({ name: 'Camera Capture Attempt' });
        const photo = await camera.takePictureAsync({ quality: 0 });
        setIsAnalyzing(true);
        if (photo && photo.uri) {
          const postUrl = await generateUploadUrl();
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          const { storageId } = await result.json();

          const localDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
          const localTime = format(new Date(), 'HH:mm:ss.SSS');
          const entryDate = `${localDate}T${localTime}`;

          const jobId = await createImageAnalysisJob({
            imageStorageId: storageId,
            userId: user?._id,
            date: entryDate
          });

          setIsAnalyzing(false);
          analytics.track({ name: 'Camera Capture Success' });
          router.back();
        }
      } catch (error) {
        setIsAnalyzing(false);
        analytics.track({ name: 'Camera Capture Failure', properties: { error: (error as Error).message ?? 'unknown' } });
        Alert.alert(
          "Error",
          "An error occurred while analyzing the image. Please try again.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const pickImage = async () => {
    try {
      analytics.track({ name: 'Camera PickImage Attempt' });
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0,
      });

      if (!result.canceled && result.assets[0]) {
        setIsAnalyzing(true);
        const photo = result.assets[0];

        const postUrl = await generateUploadUrl();
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        const uploadResult = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type },
          body: blob,
        });
        const { storageId } = await uploadResult.json();

        const localDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
        const localTime = format(new Date(), 'HH:mm:ss.SSS');
        const entryDate = `${localDate}T${localTime}`;

        await createImageAnalysisJob({
          imageStorageId: storageId,
          userId: user?._id,
          date: entryDate
        });

        setIsAnalyzing(false);
        analytics.track({ name: 'Camera PickImage Success' });
        router.back();
      }
    } catch (error) {
      setIsAnalyzing(false);
      analytics.track({ name: 'Camera PickImage Failure', properties: { error: (error as Error).message ?? 'unknown' } });
      Alert.alert(
        "Error",
        "An error occurred while processing the image. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        ref={setCamera}
        onMountError={(error) => {
          console.error('Camera mount error:', error);
          setIsMounted(false);
          setTimeout(() => setIsMounted(true), 300);
        }}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={() => { }}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Protein Scanner</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.frame}>
              <View style={[styles.frameCorner, styles.topLeft]} />
              <View style={[styles.frameCorner, styles.topRight]} />
              <View style={[styles.frameCorner, styles.bottomLeft]} />
              <View style={[styles.frameCorner, styles.bottomRight]} />
            </View>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.captureButtonContainer}>
                {isAnalyzing ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : (
                  <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.torchButton} onPress={toggleTorch}>
                <Ionicons
                  name={torch ? "flash" : "flash-off"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlayTouchable: {
    flex: 1,
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingBottom: 20,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    zIndex: 3,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  frame: {
    flex: 1,
    marginHorizontal: 40,
    marginVertical: 150,
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 3,
  },
  torchButton: {
    padding: 10,
  },
  captureButtonContainer: {
    flex: 1,
    alignItems: 'center',
    height: 70,
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'black',
    textAlign: 'center',
  },
  message: {
    color: 'white',
    textAlign: 'center',
    paddingBottom: 10,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionMessage: {
    color: '#ffffff99',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryButton: {
    padding: 10,
  },
});
