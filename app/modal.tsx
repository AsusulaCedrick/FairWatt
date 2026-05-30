import { Link } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    // 🛠️ UPDATE: Pinalitan ng standard View para ma-enforce ang #F5F7FA background
    <View style={styles.container}>
      <Text style={styles.title}>About FairWatt</Text>
      <Text style={styles.description}>
        This personal sub-meter app helps tenants track and predict their electric consumption dynamically.
      </Text>
      
      {/* 🛠️ FIX: Binago mula "/" patungong "/(tabs)" para bumalik sa tamang tab route window */}
      <Link href="/(tabs)" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Go back to Tracker</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA', // Official Clean Off-White UI Color Standard
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A442E', // FairWatt Maroon-Green Core Primary Color
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: '#1A442E',
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});