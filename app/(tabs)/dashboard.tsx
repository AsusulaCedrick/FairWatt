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
// 🛠️ FIX: Dalawang talon (`../../`) na para tumpak na tumuro sa root Services folder mo
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
  const { user, isLoading } = useAuth();
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

  // ==========================================
  // 🔄 SECURITY ROUTE INTERCEPTOR GUARD
  // ==========================================
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A442E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
        <View style={styles.halfCard}>
          <Text style={styles.labelGray}>DAILY COST</Text>
          <Text style={styles.valueGreen}>₱ {totalDaily.toFixed(2)}</Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.labelGray}>APPLIANCES</Text>
          <Text style={styles.valueGreen}>{applianceCount}</Text>
        </View>
      </View>

      {applianceCount > 0 ? (
        <>
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>7-Day Trend</Text>
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

          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Top 10 Appliances</Text>
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

          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>By Category</Text>
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
          <Text style={styles.emptyText}>Add history to see energy insights.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#FFF",
  backgroundGradientTo: "#FFF",
  color: (opacity = 1) => `rgba(26, 68, 46, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  decimalPlaces: 0,
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#1A442E" }
};

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