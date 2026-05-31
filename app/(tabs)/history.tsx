import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { getTenantPredictionAndTips } from '../../Services/aiService';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../components/ScreenHeader';
import { KeyValueCard } from '../../components/KeyValueCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { getConsumptionHistory } from '../../Services/consumptionService'; // Inalis ang deleteConsumptionRecord import

export default function HistoryScreen() {
  const { user, isLoading, isDarkMode } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const handleFetchAIEngine = async () => {
    setAiLoading(true);
    setAiModalVisible(true);
    try {
      const insights = await getTenantPredictionAndTips(history);
      setAiResponse(insights);
    } catch (error) {
      console.error('AI Insight Error:', error);
      setAiResponse('Paumanhin, hindi ako makakonekta sa FairWatt AI sa ngayon.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/AuthScreen');
      return;
    }

    if (isLoading || !user) {
      return;
    }

    const unsubscribe = getConsumptionHistory((data) => {
      setHistory(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isLoading, router]);

  const formatDate = (value: any) => {
    const date =
      typeof value === 'string'
        ? new Date(value)
        : value?.toDate
        ? value.toDate()
        : value;

    if (date instanceof Date && !isNaN(date.valueOf())) {
      return date.toLocaleString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return 'Unknown date';
  };

  // MODIFIED: Inayos ang data reading field para sa 'Room' upang maging 'General' kapag walang makitang variable mula sa database engine log log entry
  const detailItems = selectedItem
    ? [
        { label: 'Appliance', value: selectedItem.appliance || 'N/A' },
        { label: 'Category', value: selectedItem.category || 'N/A' },
        { label: 'Room', value: selectedItem.room || 'General' }, 
        { label: 'Provider', value: selectedItem.provider || 'N/A' },
        { label: 'Rate', value: `₱${Number(selectedItem.rate || 0).toFixed(2)} /kWh` },
        { label: 'Usage Period', value: selectedItem.period || 'N/A' },
        { label: 'Hours per Day', value: `${selectedItem.hours_used || 0}` },
        { label: 'Quantity', value: `${selectedItem.quantity || 1}` },
        { label: 'Daily Cost', value: `₱${Number(selectedItem.daily_cost || 0).toFixed(2)}` },
        { label: 'Monthly Cost', value: `₱${Number(selectedItem.monthly_cost || 0).toFixed(2)}` },
      ]
    : [];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.historyCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]} onPress={() => setSelectedItem(item)}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.applianceName, { color: isDarkMode ? '#FFFFFF' : '#1E293B' }]}>{item.appliance || 'Unknown'}</Text>
          <Text style={styles.categoryTag}>{`${item.category || 'Others'} • ${item.period || 'Daily'}`}</Text>
        </View>
        <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#1A442E' }]}>₱{Number(item.monthly_cost || 0).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' }]}>
      <ScreenHeader title="Consumption History" subtitle="Tap a record to inspect details." />

      {history && history.length > 0 && (
        <TouchableOpacity style={styles.aiTriggerButton} onPress={handleFetchAIEngine}>
          <Text style={styles.aiButtonText}>✨ Predict Bill & Tips</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1A442E" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id?.toString() || item.created_at?.toString() || item.createdAt?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No records yet.</Text>}
        />
      )}

      {/* --- AI ASSISTANT ANALYSIS MODAL --- */}
      <Modal
        visible={aiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAiModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', maxHeight: '85%' }]}>
                <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#1A442E' }]}>⚡ FairWatt AI Analysis</Text>
                <Text style={styles.subTitle}>Module 6: Energy Data Analyst Insights</Text>
                
                {aiLoading ? (
                  <View style={styles.aiLoadingContainer}>
                    <ActivityIndicator size="large" color="#1A442E" />
                    <Text style={styles.aiLoadingText}>Kasalukuyang sinusuri ng AI ang iyong appliance usage logs para sa bill prediction...</Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                    <Text style={[styles.aiMarkdownText, { color: isDarkMode ? '#FFFFFF' : '#334155' }]}>{aiResponse}</Text>
                  </ScrollView>
                )}

                <PrimaryButton
                  title="Close Analysis"
                  onPress={() => setAiModalVisible(false)}
                  style={{ backgroundColor: '#1A442E', marginTop: 10 }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- RECORD DETAILS MODAL (BINAGO: Ginawang malinis na Read-Only Interface) --- */}
      <Modal
        visible={Boolean(selectedItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedItem(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
                <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#1A442E' }]}>Record Details</Text>
                <Text style={styles.subTitle}>{formatDate(selectedItem?.created_at || selectedItem?.createdAt)}</Text>
                
                <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                  <KeyValueCard items={detailItems} />
                </ScrollView>
                
                {/* BINAGO: Pinalitan ang mapanganib na "Delete Record" button ng ligtas na "Close" handler para sa view-only requirement */}
                <PrimaryButton
                  title="Close Details"
                  onPress={() => setSelectedItem(null)}
                  style={{ backgroundColor: '#1A442E' }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ❌ Tinanggal na natin ang buong ConfirmModal ng Deletion para hindi na mag-trigger o mag-occupy ng space */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  listContent: {
    paddingBottom: 30,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applianceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  categoryTag: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A442E',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
  },
  detailScroll: {
    marginBottom: 18,
  },
  aiTriggerButton: {
    backgroundColor: '#1A442E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  aiLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  aiMarkdownText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'left',
  },
});