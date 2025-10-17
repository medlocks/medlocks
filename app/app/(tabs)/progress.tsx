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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "@/services/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const [images, setImages] = useState<{ id: string; url: string; date: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const storage = getStorage();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) loadImages();
  }, [user]);

  const loadImages = async () => {
    if (!user) return;
    setLoading(true);

    const q = query(collection(db, "users", user.uid, "progress"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      url: doc.data().url,
      date: new Date(doc.data().timestamp?.seconds * 1000).toLocaleDateString(),
    }));

    setImages(data);
    setLoading(false);
  };

  const uploadImage = async () => {
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "We need access to your photos to upload progress images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    setLoading(true);

    try {
      const image = result.assets[0];
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const fileRef = ref(storage, `users/${user.uid}/progress/${Date.now()}.jpg`);
      await uploadBytes(fileRef, blob);

      const downloadURL = await getDownloadURL(fileRef);
      await addDoc(collection(db, "users", user.uid, "progress"), {
        url: downloadURL,
        timestamp: new Date(),
      });

      await loadImages();
    } catch (error) {
      console.error(error);
      Alert.alert("Upload failed", "Something went wrong while uploading.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hair Progress</Text>

      <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
        <LinearGradient
          colors={["#ff9db2", "#ffb6c5"]}
          style={styles.uploadGradient}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.uploadText}>Upload New Photo</Text>
        </LinearGradient>
      </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60, // keeps clear of selfie cam / notch
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#222",
    marginBottom: 24,
  },
  uploadButton: {
    alignSelf: "center",
    width: "80%",
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: "#ff9db2",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  uploadGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  gallery: {
    paddingBottom: 80,
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
