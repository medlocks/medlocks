import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db, storage } from "@/services/firebase";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const [images, setImages] = useState<{ id: string; url: string; date: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) loadImages();
  }, [user]);

  const loadImages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "users", user.uid, "progress"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        url: doc.data().url,
        date: new Date(doc.data().timestamp?.seconds * 1000).toLocaleDateString(),
      }));
      setImages(data);
    } catch (err) {
      console.error("Error loading images:", err);
    }
    setLoading(false);
  };

  // ✅ Fetch-based conversion — this works in Expo Go
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const pickAndUpload = async (fromCamera: boolean = false) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Not signed in", "Please log in to upload progress photos.");
        return;
      }

      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission denied", "We need permission to access your camera/photos.");
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });

      if (result.canceled) return;
      const image = result.assets[0];
      console.log("Selected image:", image);

      const fileUri = image.uri;
      const blob = await uriToBlob(fileUri); // ✅ Reliable in Expo

      const filePath = `users/${user.uid}/progress/${Date.now()}.jpg`;
      const fileRef = ref(storage, filePath);

      console.log("Uploading to:", filePath);
      setLoading(true);

      const metadata = { contentType: "image/jpeg" };
      const uploadTask = uploadBytesResumable(fileRef, blob, metadata);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          reject,
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, "users", user.uid, "progress"), {
              url: downloadURL,
              timestamp: new Date(),
            });
            resolve(true);
          }
        );
      });

      Alert.alert("Success!", "Your progress photo was uploaded.");
      await loadImages();
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload failed", "Something went wrong while uploading your photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Weekly Hair Progress</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => pickAndUpload(true)} style={styles.buttonWrapper}>
            <LinearGradient colors={["#ff9db2", "#ffb6c5"]} style={styles.button}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => pickAndUpload(false)} style={styles.buttonWrapper}>
            <LinearGradient colors={["#ffb6c5", "#ffd3de"]} style={styles.button}>
              <Ionicons name="image-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Upload</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#ff9db2" style={{ marginTop: 40 }} />
        ) : images.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No progress photos yet</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking your hair journey today — upload your first photo!
            </Text>
          </View>
        ) : (
          <FlatList
            data={images}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gallery}
            renderItem={({ item }) => (
              <View style={styles.imageCard}>
                <Image source={{ uri: item.url }} style={styles.image} />
                <View style={styles.overlay}>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#222",
    marginVertical: 24,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  buttonWrapper: {
    marginHorizontal: 6,
    borderRadius: 14,
    shadowColor: "#ff9db2",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
  gallery: {
    paddingBottom: 100,
    justifyContent: "center",
  },
  imageCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: (width - 60) / 2,
    height: (width - 60) / 2,
    borderRadius: 16,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingVertical: 4,
    alignItems: "center",
  },
  date: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});

