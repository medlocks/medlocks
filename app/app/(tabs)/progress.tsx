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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "@/services/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
      quality: 0.8,
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
        <Text style={styles.uploadText}>Upload New Photo</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#ff9db2" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={images}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.imageCard}>
              <Image source={{ uri: item.url }} style={styles.image} />
              <Text style={styles.date}>{item.date}</Text>
            </View>
          )}
          contentContainerStyle={styles.gallery}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  uploadButton: {
    backgroundColor: "#ff9db2",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  uploadText: { color: "#fff", fontWeight: "600" },
  gallery: { gap: 12 },
  imageCard: {
    flex: 1,
    alignItems: "center",
    margin: 5,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  image: { width: 150, height: 150, borderRadius: 10 },
  date: { fontSize: 12, color: "#555", marginTop: 6, marginBottom: 6 },
});
