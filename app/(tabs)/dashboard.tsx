import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator 
} from "react-native";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getDashboardData } from "../../Services/consumptionService";

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

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const { user, isLoading, isDarkMode } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);
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
    backgroundGradientFrom: isDarkMode ? "#1E1E1E" : "#FFF",
    backgroundGradientTo: isDarkMode ? "#1E1E1E" : "#FFF",
    color: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(26, 68, 46, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    decimalPlaces: 0,
    propsForDots: { r: "4", strokeWidth: "2", stroke: isDarkMode ? "#fff" : "#1A442E" }
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
      setTotalMonthly(data.totalMonthly);
      setTotalDaily(data.totalDaily);
      setApplianceCount(data.applianceCount);
      setPieData(data.pieData);
      setTopAppliances(data.topTenData);
      setLineData(data.trendData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isLoading, router]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDarkMode ? "#121212" : "#F5F7FA" }]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#1A442E"} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#F5F7FA" }]}>
      <ScreenHeader
        title="Energy Dashboard"
        subtitle="Live insights from appliance consumption and monthly cost trends."
      />

      {/* SUMMARY CARD */}
      <View style={styles.mainCard}>
        <Text style={styles.labelWhite}>ESTIMATED MONTHLY BILL</Text>
        <Text style={styles.valueWhite}>
          ₱ {totalMonthly.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.halfCard, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFF" }]}>
          <Text style={[styles.labelGray, { color: isDarkMode ? "#aaa" : "#64748B" }]}>DAILY COST</Text>
          <Text style={[styles.valueGreen, { color: isDarkMode ? "#fff" : "#1A442E" }]}>₱ {totalDaily.toFixed(2)}</Text>
        </View>
        <View style={[styles.halfCard, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFF" }]}>
          <Text style={[styles.labelGray, { color: isDarkMode ? "#aaa" : "#64748B" }]}>APPLIANCES</Text>
          <Text style={[styles.valueGreen, { color: isDarkMode ? "#fff" : "#1A442E" }]}>{applianceCount}</Text>
        </View>
      </View>

      {applianceCount > 0 ? (
        <>
          <View style={[styles.chartBox, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFF" }]}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? "#fff" : "#1A442E" }]}>7-Day Trend</Text>
            <LineChart
              data={lineData}
              width={screenWidth - 60}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.rounded}
              fromZero
              yAxisLabel="₱"
              yAxisSuffix=""
            />
          </View>

          <View style={[styles.chartBox, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFF" }]}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? "#fff" : "#1A442E" }]}>Top 10 Appliances</Text>
            <BarChart
              data={topAppliances}
              width={screenWidth - 60}
              height={250}
              chartConfig={chartConfig}
              yAxisLabel="₱"
              yAxisSuffix=""
              fromZero
              style={styles.rounded}
              verticalLabelRotation={30}
            />
          </View>

          <View style={[styles.chartBox, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFF" }]}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? "#fff" : "#1A442E" }]}>By Category</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={180}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: isDarkMode ? "#aaa" : "#64748B" }]}>Add history to see energy insights.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ❌ Inalis natin dito ang duplicate na 'const chartConfig' para walang variable conflict error ang code mo.

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F5F7FA", 
    padding: 20, 
    paddingTop: 50 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#F5F7FA"
  },
  mainCard: { 
    backgroundColor: "#1A442E", 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 10 
  },
  labelWhite: { 
    color: "#FFF", 
    fontSize: 12, 
    opacity: 0.8 
  },
  valueWhite: { 
    color: "#FFF", 
    fontSize: 30, 
    fontWeight: "bold" 
  },
  row: { 
    flex: 1,
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20 
  },
  halfCard: { 
    backgroundColor: "#FFF", 
    width: "48%", 
    padding: 15, 
    borderRadius: 15, 
    elevation: 2 
  },
  labelGray: { 
    fontSize: 10, 
    color: "#64748B", 
    fontWeight: "bold" 
  },
  valueGreen: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#1A442E" 
  },
  chartBox: { 
    backgroundColor: "#FFF", 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 20, 
    elevation: 2 
  },
  chartTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#1A442E", 
    marginBottom: 15 
  },
  rounded: { 
    borderRadius: 16 
  },
  emptyBox: { 
    padding: 40, 
    alignItems: 'center' 
  },
  emptyText: { 
    color: '#64748B', 
    fontSize: 14, 
    fontStyle: 'italic' 
  }
});