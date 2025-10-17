import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "@/services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const [photos, setPhotos] = useState<
    { id: string; url: string; date: string; weekLabel: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const storage = getStorage();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) loadImages();
  }, [user]);

  const loadImages = async () => {
    if (!user) return;
    setLoading(true);

    const q = query(
      collection(db, "users", user.uid, "progress"),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => {
      const ts = doc.data().timestamp?.seconds
        ? new Date(doc.data().timestamp.seconds * 1000)
        : new Date();
      const weekLabel = `Week of ${ts.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}`;
      return {
        id: doc.id,
        url: doc.data().url,
        date: ts.toLocaleDateString(),
        weekLabel,
      };
    });

    setPhotos(data);
    setLoading(false);
  };

  const uploadImage = async () => {
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "We need access to your photos.");
      return;
    }

    // Only one upload per week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekQuery = query(
      collection(db, "users", user.uid, "progress"),
      where("timestamp", ">", oneWeekAgo)
    );
    const weekSnap = await getDocs(weekQuery);
    if (!weekSnap.empty) {
      Alert.alert(
        "Hold up 💖",
        "You’ve already uploaded a progress photo this week. Come back next week for your next update!"
      );
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

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <Text style={styles.title}>Weekly Hair Progress</Text>
      <Text style={styles.subtitle}>
        Upload a new photo each week to see your transformation unfold 💕
      </Text>

      <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
        <LinearGradient colors={["#ff9db2", "#ffb6c5"]} style={styles.uploadGradient}>
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.uploadText}>Upload This Week’s Photo</Text>
        </LinearGradient>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#ff9db2" style={{ marginTop: 40 }} />
      ) : photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="image-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No progress photos yet</Text>
          <Text style={styles.emptySubtitle}>
            Start your journey by uploading your first weekly photo!
          </Text>
        </View>
      ) : (
        photos.map((photo, index) => (
          <View key={photo.id} style={styles.weekCard}>
            <TouchableOpacity
              style={styles.weekHeader}
              onPress={() => toggleExpand(photo.id)}
            >
              <Text style={styles.weekTitle}>{photo.weekLabel}</Text>
              <Ionicons
                name={expanded === photo.id ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {expanded === photo.id && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo.url }} style={styles.image} />
                <Text style={styles.dateText}>📅 Taken on {photo.date}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60, // clears selfie cam / notch
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#222",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 16,
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
  weekCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  photoContainer: {
    alignItems: "center",
    paddingBottom: 16,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
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

