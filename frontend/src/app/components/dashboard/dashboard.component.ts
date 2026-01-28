import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DailyAggregate } from '../../models/aggregate.model';
import { Trip } from '../../models/trip.model';
import { SummaryStats } from '../../models/summary.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Date filters
  startDate: string = '';
  endDate: string = '';
  serviceType: string = '';
  
  // Data
  summary: SummaryStats | null = null;
  aggregates: DailyAggregate[] = [];
  trips: Trip[] = [];
  
  // Loading states
  loadingSummary = false;
  loadingChart = false;
  loadingTable = false;
  
  // Error states
  summaryError: string = '';
  chartError: string = '';
  tripError: string = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalRecords = 0;
  totalPages = 0;
  
  // Full date labels for tooltips
  private fullDateLabels: string[] = [];
  private revenueFullDateLabels: string[] = [];
  
  // Filter change subject for debouncing
  private filterChange$ = new Subject<void>();
  
  // Chart configurations
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: (context: any) => {
            // Show full date with year in tooltip
            const dataIndex = context[0].dataIndex;
            return this.fullDateLabels[dataIndex] || context[0].label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          maxTicksLimit: 15,
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Trips',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };
  
  public lineChartType: ChartType = 'line';
  
  // Pie chart for service type distribution
  public pieChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const dataset = context.dataset.data as number[];
            const total = dataset.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };
  
  public pieChartType: ChartType = 'doughnut';
  
  // Bar chart for revenue
  public revenueChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  
  public revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        callbacks: {
          title: (context: any) => {
            // Show full date with year in tooltip
            const dataIndex = context[0].dataIndex;
            return this.revenueFullDateLabels[dataIndex] || context[0].label;
          },
          label: function(context) {
            const value = context.parsed.y ?? 0;
            return ' $' + value.toLocaleString('en-US', {minimumFractionDigits: 2});
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 15,
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true
        }
      },
      y: {
        title: {
          display: true,
          text: 'Revenue ($)',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };
  
  public revenueChartType: ChartType = 'bar';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    // Set default date range to January 2020 for fast loading
    const defaultStart = new Date('2020-01-01');
    const defaultEnd = new Date('2020-01-31');
    this.startDate = this.formatDateForInput(defaultStart);
    this.endDate = this.formatDateForInput(defaultEnd);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.loadData();
  }

  onFilterChange(): void {
    // Reset to page 1 when filters change
    this.currentPage = 1;
    // Load data immediately (date pickers trigger on selection, not typing)
    this.loadData();
  }

  loadData(): void {
    this.loadSummary();
    this.loadAggregates();
    this.loadTrips();
  }
  
  loadSummary(): void {
    this.loadingSummary = true;
    this.summaryError = '';
    
    this.apiService.getSummary(
      this.startDate,
      this.endDate,
      this.serviceType || undefined
    ).subscribe({
      next: (data) => {
        this.summary = data;
        this.loadingSummary = false;
        this.updatePieChart();
      },
      error: (err) => {
        console.error('Error loading summary:', err);
        this.summaryError = 'Failed to load summary statistics.';
        this.loadingSummary = false;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadAggregates(): void {
    this.loadingChart = true;
    this.chartError = '';
    
    this.apiService.getDailyAggregates(
      this.startDate,
      this.endDate,
      this.serviceType || undefined,
      1,
      1000  // Get all for chart
    ).subscribe({
      next: (response) => {
        this.aggregates = response.data;
        this.updateCharts();
        this.loadingChart = false;
        
        if (this.aggregates.length === 0) {
          this.chartError = 'No data available for selected date range.';
        }
      },
      error: (err) => {
        console.error('Error loading aggregates:', err);
        this.chartError = 'Failed to load chart data. Please try again.';
        this.loadingChart = false;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadTrips(): void {
    this.loadingTable = true;
    this.tripError = '';
    
    this.apiService.getTrips(
      this.startDate,
      this.endDate,
      this.serviceType || undefined,
      undefined,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.trips = response.data;
        this.totalRecords = response.pagination.total_records;
        this.totalPages = response.pagination.total_pages;
        this.loadingTable = false;
        
        if (this.trips.length === 0 && !this.tripError) {
          this.tripError = 'Trip records hidden for performance. Use summary cards and charts above for insights.';
        }
      },
      error: (err) => {
        console.error('Error loading trips:', err);
        this.tripError = err.status === 504 || err.statusText === 'Gateway Timeout' 
          ? 'Request timed out. Try a smaller date range.' 
          : 'Failed to load trip records.';
        this.loadingTable = false;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  updateCharts(): void {
    if (this.aggregates.length === 0) return;
    
    // Calculate date range to determine label format
    const dates = this.aggregates.map(a => new Date(a.metric_date + 'T00:00:00'));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const daysDiff = Math.floor((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Group data by date and service type
    const dateMap = new Map<string, Map<string, number>>();
    const revenueMap = new Map<string, number>();
    const dateToSortKey = new Map<string, string>();
    const dateToFullDate = new Map<string, string>();
    
    this.aggregates.forEach(agg => {
      // Parse the date string correctly
      const date = new Date(agg.metric_date + 'T00:00:00');
      const sortKey = agg.metric_date; // Keep ISO format for sorting
      
      // Format date label based on date range
      let dateStr: string;
      if (daysDiff <= 60) {
        // Short range: show "Jan 5"
        dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (daysDiff <= 365) {
        // Medium range: show "Jan 2020"
        dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        // Long range: show "2020" (year only)
        dateStr = date.toLocaleDateString('en-US', { year: 'numeric' });
      }
      
      // Full date for tooltip
      const fullDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      if (!dateMap.has(sortKey)) {
        dateMap.set(sortKey, new Map());
        dateToSortKey.set(sortKey, dateStr);
        dateToFullDate.set(sortKey, fullDate);
      }
      
      const serviceMap = dateMap.get(sortKey)!;
      serviceMap.set(agg.service_type, (serviceMap.get(agg.service_type) || 0) + agg.total_trips);
      
      // Revenue by date
      revenueMap.set(sortKey, (revenueMap.get(sortKey) || 0) + agg.total_revenue);
    });
    
    // Sort dates by ISO string
    const sortedKeys = Array.from(dateMap.keys()).sort();
    const sortedDates = sortedKeys.map(key => dateToSortKey.get(key)!);
    
    // Store full dates for tooltips
    this.fullDateLabels = sortedKeys.map(key => dateToFullDate.get(key)!);
    this.revenueFullDateLabels = this.fullDateLabels;
    
    // Get unique service types
    const serviceTypes = Array.from(new Set(this.aggregates.map(a => a.service_type)));
    
    // Color palette with matching point colors
    const colors: { [key: string]: { border: string, bg: string, point: string } } = {
      'yellow': { border: '#f1c40f', bg: '#f1c40f40', point: '#f1c40f' },
      'green': { border: '#2ecc71', bg: '#2ecc7140', point: '#2ecc71' },
      'fhv': { border: '#3498db', bg: '#3498db40', point: '#3498db' },
      'fhvhv': { border: '#9b59b6', bg: '#9b59b640', point: '#9b59b6' }
    };
    
    // Build line chart datasets
    const datasets = serviceTypes.map(serviceType => {
      const data = sortedKeys.map(key => {
        const serviceMap = dateMap.get(key);
        return serviceMap?.get(serviceType) || 0;
      });
      
      const colorScheme = colors[serviceType] || { border: '#95a5a6', bg: '#95a5a620', point: '#95a5a6' };
      return {
        label: serviceType.toUpperCase(),
        data: data,
        borderColor: colorScheme.border,
        backgroundColor: colorScheme.bg,
        pointBackgroundColor: colorScheme.point,
        pointBorderColor: colorScheme.border,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true
      };
    });
    
    this.lineChartData = {
      labels: sortedDates,
      datasets: datasets
    };
    
    // Build revenue bar chart
    this.revenueChartData = {
      labels: sortedDates,
      datasets: [{
        label: 'Revenue',
        data: sortedKeys.map(key => revenueMap.get(key) || 0),
        backgroundColor: '#667eea',
        borderColor: '#5568d3',
        borderWidth: 1
      }]
    };
  }
  
  updatePieChart(): void {
    if (!this.summary || !this.summary.by_service_type.length) {
      return;
    }
    
    const colors = ['#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    
    this.pieChartData = {
      labels: this.summary.by_service_type.map(s => s.service_type.toUpperCase()),
      datasets: [{
        data: this.summary.by_service_type.map(s => s.total_trips),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }

  onPageChange(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) {
      return;
    }
    this.currentPage = newPage;
    this.loadTrips();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  exportData(): void {
    // Export current view data to CSV
    const headers = ['Date', 'Service Type', 'Total Trips', 'Total Revenue', 'Avg Distance', 'Avg Duration (min)', 'Avg Fare'];
    const rows = this.aggregates.map(agg => [
      agg.metric_date,
      agg.service_type,
      agg.total_trips,
      agg.total_revenue.toFixed(2),
      (agg.avg_trip_distance || 0).toFixed(2),
      ((agg.avg_trip_duration_sec || 0) / 60).toFixed(1),
      (agg.avg_fare_amount || 0).toFixed(2)
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyc-tlc-data-${this.startDate}-${this.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
