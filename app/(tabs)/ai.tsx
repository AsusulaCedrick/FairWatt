import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getConsumptionHistory } from '../../Services/consumptionService';
import { getTenantPredictionAndTips, generateEnergyInsights, getApplianceLogsText, getDailyLogsText } from '../../Services/aiService';
import { Colors, Fonts, Radius } from '../../constants/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIScreen() {
  const { user, isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // System instructions para itakda ang eksaktong scope ng AI base sa documentation
  const SYSTEM_SCOPE_PROMPT = 
    "You are FairWatt AI, an expert Energy Analyst Chatbot. Your strict scope is to answer questions about electricity consumption, " +
    "provide actionable tips on how to save energy/money, calculate electricity estimates, and explain features of the FairWatt app. " +
    "Politely decline to answer questions completely unrelated to electricity, energy conservation, or the FairWatt app.";

  useEffect(() => {
    const unsubscribe = getConsumptionHistory((data) => {
      setHistoryData(data);
      setMessages([{
        id: 'welcome',
        text: "Hello! I am FairWatt AI. I've analyzed your consumption logs. How can I help you today? Ask me about your bill predictions or how you can save electricity!",
        sender: 'ai',
        timestamp: new Date(),
      }]);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 60);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userMessageText = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    }]);

    setLoading(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const dailyKwhMap: Record<string, number> = {};
      let totalAccumulated = 0;
      let rate = 11.50;

      historyData.forEach((log) => {
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

      const historyText = getApplianceLogsText(historyData);
      const dailyText = getDailyLogsText(dailyLogs);

      const contextPrompt = `You are FairWatt AI, a personal energy assistant for a tenant in a shared house.
You have access to the tenant's actual appliance usage records. Always answer based on their real data below.

CRITICAL RULES:
1. Never use asterisks (*) or markdown formatting. Plain text only.
2. Always refer to the tenant's actual logged appliances when answering — do not give generic answers.
3. If asked what they use the most, sort their appliances by monthly_cost descending and answer from that.
4. If asked what consumes the most electricity, refer to their highest wattage or highest monthly cost appliance.
5. If the question is unrelated to energy, electricity, or their usage — politely redirect.
6. Respond in the same language the user used (Filipino or English).

TENANT'S APPLIANCE LOGS:
${historyText}

TENANT'S DAILY KWH LOGS THIS MONTH:
${dailyText}

TENANT'S QUESTION:
${userMessageText}`;

      const aiResponse = await generateEnergyInsights(contextPrompt);
      const cleanedResponse = aiResponse.replace(/\*/g, '').trim();

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: cleanedResponse,
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.mainWrapper, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      {/* 📌 PERMANENT STICKY TOP BAR: Labas sa ScrollView at KeyboardAvoidingView para hindi gagalaw o aalog */}
      <View style={[styles.topBarContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.topBarTitle, { color: themeColors.primary }]}>FairWatt AI</Text>
        <Text style={[styles.topBarSubtitle, { color: themeColors.textSecondary }]}>Generated by AI • Energy Assistant</Text>
      </View>

      <View style={[styles.keyboardAvoidingView, { flex: 1 }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.sender === 'user' ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'user'
                    ? [styles.userBubble, { backgroundColor: themeColors.primary }]
                    : [styles.aiBubble, { backgroundColor: themeColors.card, borderColor: themeColors.border }],
                ]}
              >
                <Text 
                  style={[
                    item.sender === 'user' ? styles.userText : [styles.aiText, { color: themeColors.text }],
                    { fontFamily: 'Poppins_400Regular' }
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            loading ? <ActivityIndicator style={{ margin: 10 }} color={themeColors.primary} /> : null
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* INPUT LAYOUT */}
        <View style={[styles.inputContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F1F5F9', color: themeColors.text }]}
            placeholder="Ask anything about energy saving..."
            placeholderTextColor={themeColors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: themeColors.primary }]} 
            onPress={handleSendMessage}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { 
    flex: 1, 
    alignItems: 'center',
    width: '100%',
  },
  topBarContainer: {
    width: '100%',
    maxWidth: 600,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  topBarTitle: {
    ...Fonts.h3,
    fontWeight: '700',
    textAlign: 'center',
  },
  topBarSubtitle: {
    ...Fonts.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 600,
    flex: 1,
  },
  chatContainer: { 
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  messageBubble: { 
    padding: 14, 
    borderRadius: Radius.card - 6, 
    marginBottom: 12, 
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  userBubble: { 
    alignSelf: 'flex-end',
    maxWidth: '80%',
  } as ViewStyle, 
  aiBubble: { 
    alignSelf: 'flex-start',
    maxWidth: '80%',
    borderWidth: 1.5,
  } as ViewStyle,
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  userText: { 
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
  },
  aiText: { 
    fontSize: 14,
    lineHeight: 22,
  },
  inputContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16,
    paddingVertical: 12, 
    borderTopWidth: 1.5, 
    alignItems: 'center',
    width: '100%',
  },
  input: { 
    flex: 1, 
    paddingHorizontal: 16,
    height: 48,
    borderRadius: Radius.button + 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  sendButton: { 
    width: 44,
    height: 44,
    borderRadius: 22, 
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});