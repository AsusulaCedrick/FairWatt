import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { getTenantPredictionAndTips } from '../../Services/aiService';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../components/ScreenHeader';
import { KeyValueCard } from '../../components/KeyValueCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { getConsumptionHistory } from '../../Services/consumptionService';
import { Colors, Fonts, Radius } from '../../constants/theme';

export default function HistoryScreen() {
  const { user, isLoading, isDarkMode } = useAuth();
  const router = useRouter();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [showConfirmPredict, setShowConfirmPredict] = useState(false);

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

  const handlePredictPress = () => {
    setShowConfirmPredict(true);
  };

  const handleConfirmPredict = () => {
    setShowConfirmPredict(false);
    handleFetchAIEngine();
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
    <TouchableOpacity 
      style={[styles.historyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.textContainer}>
          <Text style={[styles.applianceName, { color: themeColors.text }]}>{item.appliance || 'Unknown'}</Text>
          <Text style={[styles.categoryTag, { color: themeColors.textSecondary }]}>{`${item.category || 'Others'} • ${item.period || 'Daily'}`}</Text>
        </View>
        <Text style={[styles.statValue, { color: isDarkMode ? '#81C784' : '#1B5E20' }]}>₱{Number(item.monthly_cost || 0).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScreenHeader title="Consumption History" subtitle="Tap a record to inspect details." />

      {history && history.length > 0 && (
        <TouchableOpacity 
          style={[styles.aiTriggerButton, { backgroundColor: themeColors.primary }]} 
          onPress={handlePredictPress}
          activeOpacity={0.8}
        >
          <Text style={styles.aiButtonText}>✨ Predict Bill & Tips</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id?.toString() || item.created_at?.toString() || item.createdAt?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              No records yet.
            </Text>
          }
        />
      )}

      {/* --- CONFIRM BILL PREDICTION MODAL --- */}
      <ConfirmationModal
        visible={showConfirmPredict}
        title="Predict bills?"
        message="Continue bill prediction?"
        confirmText="Continue"
        iconName="trending-up"
        onCancel={() => setShowConfirmPredict(false)}
        onConfirm={handleConfirmPredict}
      />

      {/* --- AI ASSISTANT ANALYSIS MODAL --- */}
      <Modal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        closeOnBackdropPress={true}
        style={styles.aiModalContent}
      >
        <Text style={[styles.modalTitle, { color: themeColors.primary }]}>⚡ FairWatt AI Analysis</Text>
        <Text style={[styles.subTitle, { color: themeColors.textSecondary }]}>Module 6: Energy Data Analyst Insights</Text>
        
        {aiLoading ? (
          <View style={styles.aiLoadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.aiLoadingText, { color: themeColors.textSecondary }]}>
              Kasalukuyang sinusuri ng AI ang iyong appliance usage logs para sa bill prediction...
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={true} style={styles.detailScroll}>
            <Text style={[styles.aiMarkdownText, { color: themeColors.text }]}>{aiResponse}</Text>
          </ScrollView>
        )}

        <Button
          title="Close Analysis"
          onPress={() => setAiModalVisible(false)}
          variant="primary"
          style={{ marginTop: 10 }}
        />
      </Modal>

      {/* --- RECORD DETAILS MODAL --- */}
      <Modal
        visible={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        closeOnBackdropPress={true}
        style={styles.detailsModalContent}
      >
        <Text style={[styles.modalTitle, { color: themeColors.primary }]}>Record Details</Text>
        <Text style={[styles.subTitle, { color: themeColors.textSecondary }]}>
          {formatDate(selectedItem?.created_at || selectedItem?.createdAt)}
        </Text>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
          <KeyValueCard items={detailItems} />
        </ScrollView>
        
        <Button
          title="Close Details"
          onPress={() => setSelectedItem(null)}
          variant="primary"
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  listContent: {
    paddingBottom: 30,
  },
  historyCard: {
    borderRadius: Radius.button + 6,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  applianceName: {
    ...Fonts.body,
    fontWeight: '700',
  },
  categoryTag: {
    ...Fonts.caption,
    marginTop: 4,
  },
  statValue: {
    ...Fonts.body,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    ...Fonts.body,
    fontStyle: 'italic',
  },
  modalTitle: {
    ...Fonts.h2,
    fontWeight: '700',
    marginBottom: 6,
  },
  subTitle: {
    ...Fonts.caption,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailScroll: {
    marginBottom: 16,
    maxHeight: 350,
  },
  aiTriggerButton: {
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  aiButtonText: {
    color: '#FFFFFF',
    ...Fonts.button,
    fontWeight: '700',
  },
  aiLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingText: {
    marginTop: 16,
    ...Fonts.body,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  aiMarkdownText: {
    ...Fonts.body,
    lineHeight: 22,
    textAlign: 'left',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiModalContent: {
    maxWidth: 420,
    width: '95%',
  },
  detailsModalContent: {
    maxWidth: 400,
    width: '90%',
  },
});