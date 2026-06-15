import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Searchbar,
  Menu,
  Button as PaperButton,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface MonthOption {
  label: string;
  value: string | null; // null = "All Months"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(value: any): string {
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
}

/** Returns a "YYYY-MM" key from an ISO timestamp string. */
function toMonthKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Converts "YYYY-MM" to a human-readable label like "June 2025". */
function monthKeyToLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-PH', {
    month: 'long',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { user, isLoading, isDarkMode } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Raw data
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // null = All
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);

  // Detail modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // AI state
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [showConfirmPredict, setShowConfirmPredict] = useState(false);

  // ── Auth guard & real-time subscription ──────────────────────────────────
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/AuthScreen');
      return;
    }
    if (isLoading || !user) return;

    const unsubscribe = getConsumptionHistory((data) => {
      setHistory(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isLoading, router]);

  // ── Derived: distinct months present in history (sorted newest first) ─────
  const monthOptions = useMemo<MonthOption[]>(() => {
    const keys = new Set<string>();
    history.forEach((item) => {
      if (item.created_at) keys.add(toMonthKey(item.created_at));
    });
    const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
    return [
      { label: 'All Months', value: null },
      ...sorted.map((k) => ({ label: monthKeyToLabel(k), value: k })),
    ];
  }, [history]);

  // ── Derived: filtered list ────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter((item) => {
      // Month filter
      if (selectedMonth !== null) {
        const itemKey = item.created_at ? toMonthKey(item.created_at) : '';
        if (itemKey !== selectedMonth) return false;
      }
      // Search filter
      if (q) {
        const haystack = [
          item.appliance,
          item.category,
          item.room,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [history, searchQuery, selectedMonth]);

  // ── AI handlers ───────────────────────────────────────────────────────────
  const handleFetchAIEngine = async () => {
    setAiLoading(true);
    setAiModalVisible(true);
    try {
      // Group history entries by date (YYYY-MM-DD) for logs in the current calendar month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const dailyKwhMap: Record<string, number> = {};
      let totalAccumulated = 0;
      let rate = 11.50;

      history.forEach((log) => {
        if (!log.created_at) return;
        const logDate = new Date(log.created_at);
        
        // Filter only current calendar month
        if (logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth) {
          const dateKey = log.created_at.split('T')[0];
          const logKwh = Number(log.consumption_kwh || log.daily_kwh || 0);
          dailyKwhMap[dateKey] = (dailyKwhMap[dateKey] || 0) + logKwh;
          totalAccumulated += logKwh;
          if (log.rate) {
            rate = Number(log.rate);
          }
        }
      });

      const dailyLogs = Object.keys(dailyKwhMap).map((date) => ({
        date,
        totalKwh: dailyKwhMap[date],
      })).sort((a, b) => a.date.localeCompare(b.date));

      const insights = await getTenantPredictionAndTips(history, dailyLogs, totalAccumulated, rate);
      setAiResponse(insights);
    } catch (error) {
      console.error('AI Insight Error:', error);
      setAiResponse('Paumanhin, hindi ako makakonekta sa FairWatt AI sa ngayon.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePredictPress = () => setShowConfirmPredict(true);
  const handleConfirmPredict = () => {
    setShowConfirmPredict(false);
    handleFetchAIEngine();
  };

  // ── Detail modal items ────────────────────────────────────────────────────
  const detailItems = selectedItem
    ? (() => {
        const calculatedCost = (selectedItem.consumption_kwh || 0) * (selectedItem.rate || 0);
        return [
          { label: 'Appliance', value: selectedItem.appliance || 'N/A' },
          { label: 'Category', value: selectedItem.category || 'N/A' },
          { label: 'Room', value: selectedItem.room || 'General' },
          { label: 'Usage Value', value: `${selectedItem.value || 0} ${selectedItem.unit || ''}`.trim() },
          { label: 'Provider', value: selectedItem.provider || 'N/A' },
          { label: 'Rate', value: `₱${Number(selectedItem.rate || 0).toFixed(2)} /kWh` },
          { label: 'Usage Period', value: selectedItem.period || 'N/A' },
          { label: 'Hours per Day', value: `${selectedItem.hours_used || 0}` },
          { label: 'Quantity', value: `${selectedItem.quantity || 1}` },
          { label: 'Actual Consumption (kWh)', value: `${Number(selectedItem.consumption_kwh || 0).toFixed(3)}` },
          { label: 'Actual Cost (₱)', value: `₱${calculatedCost.toFixed(2)}` },
        ];
      })()
    : [];

  // ── Render item ───────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: any }) => {
    const calculatedCost = (item.consumption_kwh || 0) * (item.rate || 0);
    return (
      <TouchableOpacity
        style={[styles.historyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.textContainer}>
            <Text style={[styles.applianceName, { color: themeColors.text }]}>
              {item.appliance || 'Unknown'}
            </Text>
            <Text style={[styles.categoryTag, { color: themeColors.textSecondary }]}>
              {`${item.category || 'Others'} • ${(item.consumption_kwh || 0).toFixed(3)} kWh • ${item.period || 'Daily'}`}
            </Text>
          </View>
          <Text style={[styles.statValue, { color: isDarkMode ? '#81C784' : '#1B5E20' }]}>
            ₱{calculatedCost.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Safe-area bottom padding for the pinned button ────────────────────────
  const pinnedButtonHeight = 70; // button height + vertical margin
  const bottomPad = Math.max(insets.bottom, 12) + pinnedButtonHeight;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.outerContainer, { backgroundColor: themeColors.background }]}>
      <View style={styles.container}>
        <ScreenHeader title="Consumption History" subtitle="Tap a record to inspect details." />

        {/* ── COMPACT FILTER HEADER ─────────────────────────────────────── */}
        <View style={styles.filterRow}>
          {/* Search Bar */}
          <Searchbar
            placeholder="Search appliance..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[
              styles.searchBar,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
            inputStyle={[styles.searchInput, { color: themeColors.text }]}
            iconColor={themeColors.textSecondary}
            placeholderTextColor={themeColors.textSecondary}
            elevation={0}
          />

          {/* Month Picker */}
          <Menu
            visible={monthMenuVisible}
            onDismiss={() => setMonthMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={[
                  styles.monthButton,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: selectedMonth ? themeColors.primary : themeColors.border,
                  },
                ]}
                onPress={() => setMonthMenuVisible(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.monthButtonText,
                    { color: selectedMonth ? themeColors.primary : themeColors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  📅 {selectedMonth ? monthKeyToLabel(selectedMonth) : 'All Months'}
                </Text>
                <Text style={{ color: themeColors.textSecondary, fontSize: 10 }}>▼</Text>
              </TouchableOpacity>
            }
            contentStyle={[
              styles.menuContent,
              { backgroundColor: themeColors.card },
            ]}
          >
            {monthOptions.map((opt, idx) => (
              <React.Fragment key={opt.value ?? 'all'}>
                <Menu.Item
                  onPress={() => {
                    setSelectedMonth(opt.value);
                    setMonthMenuVisible(false);
                  }}
                  title={opt.value === selectedMonth ? `✓ ${opt.label}` : opt.label}
                  titleStyle={[
                    styles.menuItemText,
                    {
                      color: opt.value === selectedMonth
                        ? themeColors.primary
                        : themeColors.text,
                      fontWeight: opt.value === selectedMonth ? '700' : '400',
                    },
                  ]}
                />
                {idx === 0 && <Divider style={{ backgroundColor: themeColors.border }} />}
              </React.Fragment>
            ))}
          </Menu>
        </View>

        {/* ── LIST ──────────────────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item) =>
              item.id?.toString() ||
              item.created_at?.toString() ||
              Math.random().toString()
            }
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              // Extra bottom padding so last card clears the pinned button
              { paddingBottom: history.length > 0 ? bottomPad : 30 },
            ]}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                {history.length > 0
                  ? 'No records match your filter.'
                  : 'No records yet.'}
              </Text>
            }
          />
        )}
      </View>

      {/* ── PINNED ACTION BUTTON ──────────────────────────────────────────── */}
      {history.length > 0 && (
        <View
          style={[
            styles.pinnedButtonWrapper,
            { bottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <TouchableOpacity
            style={[styles.pinnedButton, { backgroundColor: themeColors.primary }]}
            onPress={handlePredictPress}
            activeOpacity={0.85}
          >
            <Text style={styles.pinnedButtonText}>✨ Predict Bill &amp; Tips</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── CONFIRM BILL PREDICTION MODAL ────────────────────────────────── */}
      <ConfirmationModal
        visible={showConfirmPredict}
        title="Predict bills?"
        message="Continue bill prediction?"
        confirmText="Continue"
        iconName="trending-up"
        onCancel={() => setShowConfirmPredict(false)}
        onConfirm={handleConfirmPredict}
      />

      {/* ── AI ASSISTANT ANALYSIS MODAL ──────────────────────────────────── */}
      <Modal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        closeOnBackdropPress={true}
        style={styles.aiModalContent}
      >
        <Text style={[styles.modalTitle, { color: themeColors.primary }]}>
          ⚡ FairWatt AI Analysis
        </Text>

        {aiLoading ? (
          <View style={styles.aiLoadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.aiLoadingText, { color: themeColors.textSecondary }]}>
              The AI is currently analyzing your appliance usage logs to provide an accurate bill prediction...
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={true} style={styles.detailScroll}>
            <Text style={[styles.aiMarkdownText, { color: themeColors.text }]}>
              {aiResponse}
            </Text>
          </ScrollView>
        )}

        <Button
          title="Close Analysis"
          onPress={() => setAiModalVisible(false)}
          variant="primary"
          style={{ marginTop: 10 }}
        />
      </Modal>

      {/* ── RECORD DETAILS MODAL ─────────────────────────────────────────── */}
      <Modal
        visible={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        closeOnBackdropPress={true}
        style={styles.detailsModalContent}
      >
        <Text style={[styles.modalTitle, { color: themeColors.primary }]}>
          Record Details
        </Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    width: '100%',
    maxWidth: 600,
  },

  // ── Filter header ──────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  searchBar: {
    flex: 3,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    height: 46,
  },
  searchInput: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 0,
    minHeight: 0,
  },
  monthButton: {
    flex: 2,
    height: 46,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 4,
  },
  monthButtonText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  menuContent: {
    borderRadius: Radius.button,
    marginTop: 4,
    elevation: 4,
    minWidth: 180,
  },
  menuItemText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  // ── List ───────────────────────────────────────────────────────────────────
  flatList: {
    width: '100%',
  },
  listContent: {
    // paddingBottom set dynamically in render
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
    width: '100%',
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

  // ── Pinned button ──────────────────────────────────────────────────────────
  pinnedButtonWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  pinnedButton: {
    width: '100%',
    maxWidth: 560,
    borderRadius: Radius.button,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  pinnedButtonText: {
    color: '#FFFFFF',
    ...Fonts.button,
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Modals ─────────────────────────────────────────────────────────────────
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