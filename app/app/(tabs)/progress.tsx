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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db, storage } from "@/services/firebase";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import theme from "@/theme";

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

  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return await response.blob();
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
      const blob = await uriToBlob(image.uri);

      const filePath = `users/${user.uid}/progress/${Date.now()}.jpg`;
      const fileRef = ref(storage, filePath);

      setLoading(true);
      const uploadTask = uploadBytesResumable(fileRef, blob, { contentType: "image/jpeg" });

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
          <GradientButton
            icon="camera-outline"
            text="Take Photo"
            colors={[theme.colors.primary, theme.colors.primaryLight]}
            onPress={() => pickAndUpload(true)}
          />
          <GradientButton
            icon="image-outline"
            text="Upload"
            colors={[theme.colors.primaryLight, theme.colors.accentLight]}
            onPress={() => pickAndUpload(false)}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : images.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={60} color={theme.colors.border} />
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

function GradientButton({
  icon,
  text,
  colors,
  onPress,
}: {
  icon: any;
  text: string;
  colors: string[];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.buttonWrapper}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryLight] as [string, string]}
        style={styles.button}>
        <Ionicons name={icon} size={20} color="#fff" />
        <Text style={styles.buttonText}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "700",
    textAlign: "center",
    color: theme.colors.text,
    marginVertical: theme.spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  buttonWrapper: {
    marginHorizontal: 8,
    borderRadius: theme.radius.lg,
    ...theme.shadow.button,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: theme.fontSizes.md,
    marginLeft: 6,
  },
  gallery: {
    paddingBottom: 100,
    justifyContent: "center",
  },
  imageCard: {
    flex: 1,
    margin: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  image: {
    width: (width - 60) / 2,
    height: (width - 60) / 2,
    borderRadius: theme.radius.lg,
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
    marginTop: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    textAlign: "center",
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
});

