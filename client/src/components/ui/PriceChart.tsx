
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { PriceDataPoint } from '@/hooks/usePriceHistory';
import { Bitcoin, TrendingUp, TrendingDown } from 'lucide-react';
import { SiEthereum } from 'react-icons/si';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  token: 'bvix' | 'evix';
  data: PriceDataPoint[];
  currentPrice: string;
  isConnected: boolean;
}

export function PriceChart({ token, data, currentPrice, isConnected }: PriceChartProps) {
  const isUpTrend = data.length >= 2 ? parseFloat(currentPrice) > data[data.length - 2].price : true;
  
  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }),
    datasets: [
      {
        label: `${token.toUpperCase()} Price`,
        data: data.map(point => point.price),
        borderColor: token === 'bvix' ? '#f97316' : '#3b82f6',
        backgroundColor: token === 'bvix' 
          ? 'rgba(249, 115, 22, 0.1)' 
          : 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: token === 'bvix' ? '#f97316' : '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: token === 'bvix' ? '#f97316' : '#3b82f6',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toFixed(4)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxTicksLimit: 6,
          color: '#6b7280',
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return `$${value.toFixed(2)}`;
          }
        }
      }
    }
  };

  const priceChange = data.length >= 2 
    ? ((parseFloat(currentPrice) - data[0].price) / data[0].price) * 100 
    : 0;

  return (
    <Card className="bg-white dark:bg-gray-800 border shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${token === 'bvix' ? 'bg-orange-100' : 'bg-blue-100'} rounded-xl flex items-center justify-center`}>
              {token === 'bvix' ? (
                <Bitcoin className={token === 'bvix' ? 'text-orange-500' : 'text-blue-500'} size={20} />
              ) : (
                <SiEthereum className="text-blue-500" size={20} />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {token.toUpperCase()} Price History
              </CardTitle>
              <p className="text-sm text-gray-500">24-hour chart</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold text-lg ${token === 'bvix' ? 'text-orange-600' : 'text-blue-600'}`}>
                ${parseFloat(currentPrice).toFixed(4)}
              </span>
              {isConnected && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  LIVE
                </span>
              )}
            </div>
            {data.length >= 2 && (
              <div className={`flex items-center gap-1 text-sm ${isUpTrend ? 'text-green-600' : 'text-red-600'}`}>
                {isUpTrend ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          {data.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📈</div>
                <p className="text-sm">Collecting price data...</p>
                <p className="text-xs">Charts will appear as data accumulates</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
