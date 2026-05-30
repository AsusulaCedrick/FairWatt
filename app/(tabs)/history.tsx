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
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../components/ScreenHeader';
import { KeyValueCard } from '../../components/KeyValueCard';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
// 🛠️ FIX: Dalawang talon (`../../`) na para tumpak na tumuro sa root Services folder mo
import { getConsumptionHistory, deleteConsumptionRecord } from '../../Services/consumptionService';

export default function HistoryScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

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

  const handleDelete = async () => {
    if (!selectedItem?.id) return;
    try {
      await deleteConsumptionRecord(selectedItem.id);
      setConfirmDeleteVisible(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Delete error', error);
    }
  };

  const detailItems = selectedItem
    ? [
        { label: 'Appliance', value: selectedItem.appliance || 'N/A' },
        { label: 'Category', value: selectedItem.category || 'N/A' },
        { label: 'Room', value: selectedItem.room || 'N/A' },
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
    <TouchableOpacity style={styles.historyCard} onPress={() => setSelectedItem(item)}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.applianceName}>{item.appliance || 'Unknown'}</Text>
          <Text style={styles.categoryTag}>{`${item.category || 'Others'} • ${item.period || 'Daily'}`}</Text>
        </View>
        <Text style={[styles.statValue, { color: '#1A442E' }]}>₱{Number(item.monthly_cost || 0).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Consumption History" subtitle="Tap a record to inspect details." />

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

      <Modal
        visible={Boolean(selectedItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedItem(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Record Details</Text>
                <Text style={styles.subTitle}>{formatDate(selectedItem?.created_at || selectedItem?.createdAt)}</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                  <KeyValueCard items={detailItems} />
                </ScrollView>
                <PrimaryButton
                  title="Delete Record"
                  onPress={() => setConfirmDeleteVisible(true)}
                  style={styles.deleteButton}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ConfirmModal
        visible={confirmDeleteVisible}
        title="Delete Record"
        message="This will permanently remove the selected consumption record. Continue?"
        onCancel={() => setConfirmDeleteVisible(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // 🛠️ UPDATE: Inayos ayon sa pinal na primary system palette (#F5F7FA)
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
  deleteButton: {
    backgroundColor: '#DC2626',
  },
});