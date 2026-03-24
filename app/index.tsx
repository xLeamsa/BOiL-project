import { StyleSheet, View } from "react-native";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Home from "../components/Home";

export default function Index() {
  return (
    <View style={styles.mainContainer}>
      <Header />
      <Home />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
});