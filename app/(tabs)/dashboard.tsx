import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getDashboardData } from "../../Services/consumptionService";
import { Colors, Fonts, Radius } from '../../constants/theme';
import { Spacing } from '../../constants/Spacing';

interface PieData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface ChartDataset {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

export default function DashboardScreen() {
  const { user, isLoading, isDarkMode } = useAuth();
  const router = useRouter();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const { width: screenWidth } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [totalMonthlyKwh, setTotalMonthlyKwh] = useState(0);
  const [totalDaily, setTotalDaily] = useState(0);
  const [applianceCount, setApplianceCount] = useState(0);
  
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [topAppliances, setTopAppliances] = useState<ChartDataset>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [lineData, setLineData] = useState<ChartDataset>({
    labels: [],
    datasets: [{ data: [] }]
  });

  const chartConfig = {
    backgroundGradientFrom: themeColors.card,
    backgroundGradientTo: themeColors.card,
    color: (opacity = 1) => isDarkMode ? `rgba(129, 199, 132, ${opacity})` : `rgba(27, 94, 32, ${opacity})`,
    labelColor: (opacity = 1) => themeColors.textSecondary,
    decimalPlaces: 0,
    propsForDots: { r: "4", strokeWidth: "2", stroke: isDarkMode ? "#81C784" : "#1B5E20" }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/AuthScreen');
      return;
    }

    if (isLoading || !user) {
      return;
    }

    const unsubscribe = getDashboardData((data) => {
      setTotalMonthlyKwh(data.totalMonthlyKwh ?? 0);
      setTotalDaily(data.totalDaily);
      setApplianceCount(data.applianceCount);
      // Clean up pie data color tags to match theme colors dynamically
      const themedPie = (data.pieData || []).map((item: any, index: number) => {
        const defaultColors = ['#1B5E20', '#43A047', '#FFB300', '#2196F3', '#E53935', '#9C27B0'];
        return {
          ...item,
          color: item.color || defaultColors[index % defaultColors.length],
          legendFontColor: themeColors.text,
          legendFontSize: 12
        };
      });
      setPieData(themedPie);
      setTopAppliances(data.topTenData);
      setLineData(data.trendData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isLoading, router, isDarkMode]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const isTrendDataEmpty = !lineData.datasets[0]?.data.length;
  
  // Calculate responsive sizes capped at the 600px wrapper width
  const contentWidth = Math.min(screenWidth, 600);
  const chartWidth = contentWidth - 76;
  const pieChartWidth = contentWidth - 40;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentWrapper}>
        <ScreenHeader
          title="Energy Dashboard"
          subtitle="Actual recorded usage for this month."
        />

        {/* SUMMARY CARD — Accumulated actual kWh for the current month */}
        <View style={[styles.mainCard, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.labelWhite}>ACCUMULATED MONTHLY USAGE</Text>
          <Text style={styles.valueWhite}>
            {totalMonthlyKwh.toFixed(3)} kWh
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.halfCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.labelGray, { color: themeColors.textSecondary }]}>DAILY COST</Text>
            <Text style={[styles.valueGreen, { color: themeColors.text }]}>₱ {totalDaily.toFixed(2)}</Text>
          </View>
          <View style={[styles.halfCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.labelGray, { color: themeColors.textSecondary }]}>APPLIANCES</Text>
            <Text style={[styles.valueGreen, { color: themeColors.text }]}>{applianceCount}</Text>
          </View>
        </View>

        {applianceCount > 0 ? (
          <>
            {!isTrendDataEmpty && (
              <View style={[styles.chartBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.chartTitle, { color: themeColors.primary }]}>7-Day Trend</Text>
                <LineChart
                  data={lineData}
                  width={chartWidth}
                  height={180}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.rounded}
                  fromZero
                  yAxisLabel="₱"
                  yAxisSuffix=""
                />
              </View>
            )}

            {topAppliances.labels.length > 0 && (
              <View style={[styles.chartBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.chartTitle, { color: themeColors.primary }]}>Top Appliances</Text>
                <BarChart
                  data={topAppliances}
                  width={chartWidth}
                  height={250}
                  chartConfig={chartConfig}
                  yAxisLabel="₱"
                  yAxisSuffix=""
                  fromZero
                  style={styles.rounded}
                  verticalLabelRotation={30}
                />
              </View>
            )}

            {pieData.length > 0 && (
              <View style={[styles.chartBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.chartTitle, { color: themeColors.primary }]}>By Category</Text>
                <View style={styles.pieContainer}>
                  <PieChart
                    data={pieData}
                    width={pieChartWidth}
                    height={180}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"10"}
                    absolute
                  />
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Add history to see energy insights.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: '100%',
  },
  scrollContent: {
    padding: 20, 
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
  },
  mainCard: { 
    padding: 22, 
    borderRadius: Radius.card, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
  },
  labelWhite: { 
    ...Fonts.caption,
    fontWeight: '700',
    color: "#FFF", 
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  valueWhite: { 
    color: "#FFF", 
    ...Fonts.h1,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 6,
  },
  row: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20,
    width: '100%',
    flexWrap: 'wrap',
  },
  halfCard: { 
    width: "48%", 
    padding: 16, 
    borderRadius: Radius.button + 4, 
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  labelGray: { 
    ...Fonts.caption,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  valueGreen: { 
    ...Fonts.h3,
    fontWeight: "700", 
    marginTop: 4,
  },
  chartBox: { 
    padding: 16, 
    borderRadius: Radius.card, 
    marginBottom: 20, 
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    width: '100%',
  },
  chartTitle: { 
    ...Fonts.h3,
    fontWeight: "700", 
    marginBottom: 16, 
  },
  rounded: { 
    borderRadius: Radius.button, 
  },
  emptyBox: { 
    padding: 40, 
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: { 
    ...Fonts.body,
    fontStyle: 'italic',
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    width: '100%',
  },
});