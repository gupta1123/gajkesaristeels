import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const AnalyticsChart = () => {
  const data = [
    { name: "Week 1", visits: 10, sales: 5 },
    { name: "Week 2", visits: 15, sales: 8 },
    { name: "Week 3", visits: 12, sales: 6 },
    { name: "Week 4", visits: 20, sales: 12 },
  ];

  return (
    <Card>
      <CardContent>
        <LineChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="visits" stroke="#8884d8" />
          <Line type="monotone" dataKey="sales" stroke="#82ca9d" />
        </LineChart>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;