import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ChartData {
  date: string;
  totalCents: number;
}

interface SimpleChartProps {
  data: ChartData[];
  title: string;
}

export function SimpleChart({ data, title }: SimpleChartProps) {
  const colors = useColors();
  
  // Pegar os últimos 7 dias para o gráfico resumido
  const chartData = data.slice(-7);
  const maxRevenue = Math.max(...chartData.map(d => d.totalCents), 100);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{title}</Text>
      
      <View style={styles.chartArea}>
        {chartData.map((item, index) => {
          const barHeight = (item.totalCents / maxRevenue) * 100;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${Math.max(barHeight, 5)}%`, 
                      backgroundColor: colors.primary,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                {formatDate(item.date).split(" ")[0]}
              </Text>
            </View>
          );
        })}
      </View>
      
      {chartData.length === 0 && (
        <View style={styles.empty}>
          <Text style={{ color: colors.mutedForeground }}>Aguardando dados...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    marginBottom: 20,
  },
  chartArea: {
    flexDirection: "row",
    height: 120,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    height: "100%",
    width: 20,
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  bar: {
    width: "100%",
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  empty: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  }
});
