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
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      y: {
        display: true,
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
          label: function(context) {
            const value = context.parsed.y ?? 0;
            return ' $' + value.toLocaleString('en-US', {minimumFractionDigits: 2});
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
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
    // Set default date range to show data from 2020-05 (where we have data)
    this.startDate = '2020-05-01';
    this.endDate = '2020-05-31';
  }

  ngOnInit(): void {
    // Subscribe to filter changes with debouncing
    this.filterChange$.pipe(
      debounceTime(500),  // Wait 500ms after user stops typing
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadData();
    });
    
    this.loadData();
  }

  onFilterChange(): void {
    // Trigger debounced load
    this.filterChange$.next();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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
    this.loadingTable = false;
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
          this.tripError = 'No trip records found for selected filters.';
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
    // Group data by date and service type
    const dateMap = new Map<string, Map<string, number>>();
    const revenueMap = new Map<string, number>();
    
    this.aggregates.forEach(agg => {
      const dateStr = new Date(agg.metric_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, new Map());
      }
      
      const serviceMap = dateMap.get(dateStr)!;
      serviceMap.set(agg.service_type, (serviceMap.get(agg.service_type) || 0) + agg.total_trips);
      
      // Revenue by date
      revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + agg.total_revenue);
    });
    
    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    // Get unique service types
    const serviceTypes = Array.from(new Set(this.aggregates.map(a => a.service_type)));
    
    // Color palette
    const colors: { [key: string]: string } = {
      'yellow': '#f1c40f',
      'green': '#2ecc71',
      'fhv': '#3498db',
      'fhvhv': '#9b59b6'
    };
    
    // Build line chart datasets
    const datasets = serviceTypes.map(serviceType => {
      const data = sortedDates.map(date => {
        const serviceMap = dateMap.get(date);
        return serviceMap?.get(serviceType) || 0;
      });
      
      return {
        label: serviceType.toUpperCase(),
        data: data,
        borderColor: colors[serviceType] || '#95a5a6',
        backgroundColor: (colors[serviceType] || '#95a5a6') + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
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
        data: sortedDates.map(date => revenueMap.get(date) || 0),
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
