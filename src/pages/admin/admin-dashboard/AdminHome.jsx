import React, { useState, useEffect, useRef } from 'react';
import { adminService, appointmentService, api } from '../../../services';
import Chart from 'chart.js/auto';
import './AdminHome.css';

export default function AdminHome() {
  const [pendingReportsCount, setPendingReportsCount] = useState('--');
  const [totalReportsCount, setTotalReportsCount] = useState('--');
  const [totalAdmins, setTotalAdmins] = useState('--');
  const [monthInfo, setMonthInfo] = useState(null);
  const [adminSlots, setAdminSlots] = useState([]);
  const [totalCounts, setTotalCounts] = useState({
    totalSlots: '--',
    bookedSlots: '--',
    availableSlots: '--'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search reports state
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalReports: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Chart references
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Mock data for the pie chart - this would be replaced with real data from API
  const reportUploadData = {
    labels: ['Reports Uploaded', 'Patients Without Reports'],
    datasets: [{
      data: [65, 35], // 65% of patients have uploaded reports, 35% haven't
      backgroundColor: ['#4ecdc4', '#ff6b6b'],
      borderWidth: 1
    }]
  };

  // Fetch pending reports count
  useEffect(() => {
    const fetchPendingReports = async () => {
      try {
        const response = await adminService.getReportsWithoutFeedback(1, 1);
        // Extract total count from pagination info
        const totalReports = response?.pagination?.totalReports ||
                            response?.totalReports ||
                            response?.total || 0;
        setPendingReportsCount(totalReports);
      } catch (err) {
        console.error('Error fetching pending reports:', err);
        setError('Failed to load pending reports count');
      }
    };

    fetchPendingReports();
  }, []);

  // Fetch total admins count
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const admins = await adminService.getAdmins();
        setTotalAdmins(Array.isArray(admins) ? admins.length : 0);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admins:', err);
        setError('Failed to load admins count');
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  // Fetch total reports count
  useEffect(() => {
    const fetchTotalReportsCount = async () => {
      try {
        // Get the admin token from localStorage
        const adminToken = localStorage.getItem('authToken');

        if (!adminToken) {
          console.warn('No admin token available for fetching total reports. Please login first.');
          return;
        }

        // Try to get all reports to get the total count
        try {
          const totalResponse = await api.get('/admin/reports/count', {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });

          const data = totalResponse.data || totalResponse;
          const totalCount = data?.count || data?.totalReports || data?.total || 0;
          setTotalReportsCount(totalCount);
          console.log('Total reports count:', totalCount);
        } catch (totalErr) {
          console.error('Error fetching total reports count:', totalErr);
          // Fallback: If the count endpoint doesn't exist, estimate based on pending reports
          // This is just a placeholder - in a real app, you'd implement a proper endpoint
          setTotalReportsCount(pendingReportsCount * 3); // Rough estimate for demo purposes
        }
      } catch (err) {
        console.error('Error in fetchTotalReportsCount:', err);
        setTotalReportsCount('--');
      }
    };

    fetchTotalReportsCount();
  }, [pendingReportsCount]);

  // Fetch attendees slots count for the month
  useEffect(() => {
    fetchAttendeesCount();
  }, []);

  // Function to fetch attendees slots count for the month using the provided API
  const fetchAttendeesCount = async () => {
    try {
      // Get the admin token from localStorage
      const adminToken = localStorage.getItem('authToken');

      if (!adminToken) {
        console.warn('No admin token available. Please login first.');
        return;
      }

      // Make the API request using the api service
      const response = await api.get('/admin/availability/availability-count', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Update the state with the slot count
      // Handle both direct response and response.data formats
      const data = response.data || response;

      if (data && data.success) {
        // Set month information
        if (data.month) {
          setMonthInfo(data.month);
          console.log(`Month: ${data.month.name}`);
          console.log(`Date Range: ${data.month.startDate} to ${data.month.endDate}`);
        }

        // Set admin-specific data
        if (Array.isArray(data.admins)) {
          setAdminSlots(data.admins);
          console.log(`Loaded data for ${data.admins.length} admins`);
        }

        // Set total counts
        if (data.totalCounts) {
          setTotalCounts(data.totalCounts);
          console.log('Total counts:', data.totalCounts);
        }
      } else {
        console.warn('Unexpected response format or error:', data);
        setMonthInfo(null);
        setAdminSlots([]);
        setTotalCounts({
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0
        });
      }
    } catch (err) {
      console.error('Error fetching attendees count:', err);

      // Handle different error scenarios
      if (err.response) {
        switch (err.response.status) {
          case 401:
            // Authentication error - could redirect to login
            console.error('Authentication required. Please login again.');
            break;
          case 403:
            console.error('You do not have permission to access this resource.');
            break;
          default:
            console.error(`Error ${err.response.status}: ${err.response.data?.error || 'Unknown error'}`);
        }
      }

      setError('Failed to load availability counts');
      setMonthInfo(null);
      setAdminSlots([]);
      setTotalCounts({
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0
      });
    }
  };

  // Function to search reports by patient email
  const searchReportsByEmail = async (page = 1) => {
    if (!searchEmail.trim()) {
      setSearchError('Please enter a patient email to search');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      // Get the admin token from localStorage
      const adminToken = localStorage.getItem('authToken');

      if (!adminToken) {
        setSearchError('No admin token available. Please login first.');
        setSearchLoading(false);
        return;
      }

      // Prepare query parameters
      const params = new URLSearchParams({
        email: searchEmail.trim(),
        page: page,
        limit: pagination.limit
      });

      // Make the API request
      const response = await api.get(`/admin/reports/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle the response
      const data = response.data || response;

      if (data && data.success) {
        setSearchResults(data.reports || []);
        setPagination({
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 10,
          totalReports: data.pagination?.totalReports || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false
        });
        console.log('Search results:', data.reports);
      } else {
        setSearchError(data.message || 'Failed to search reports');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching reports:', err);

      // Handle different error scenarios
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setSearchError('Authentication required. Please login again.');
            break;
          case 403:
            setSearchError('You do not have permission to access this resource.');
            break;
          default:
            setSearchError(`Error ${err.response.status}: ${err.response.data?.error || 'Unknown error'}`);
        }
      } else {
        setSearchError('Failed to search reports. Please try again later.');
      }

      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchReportsByEmail(1); // Reset to first page on new search
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    searchReportsByEmail(newPage);
  };

  // Initialize and update the chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: reportUploadData,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: {
            top: 10,
            bottom: 20,
            left: 20,
            right: 20
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 14
              },
              padding: 20
            }
          },
          title: {
            display: true,
            text: 'Patient Report Upload Statistics',
            font: {
              size: 18,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value}%`;
              }
            }
          }
        }
      }
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [loading]); // Re-render chart when loading state changes

  return (
    <div className="dashboard-home">
      <h2>Admin Dashboard</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="stats-grid">
        {/* First row - 3 cards */}
        <div className="stat-card">
          <h3>{totalAdmins}</h3>
          <p>Total Admins</p>
        </div>
        <div className="stat-card">
          <h3>{pendingReportsCount}</h3>
          <p>Pending Reports Count</p>
        </div>
        <div className="stat-card">
          <h3>{totalCounts.availableSlots}</h3>
          <p>Available Slots</p>
          {monthInfo && <span className="period-info">{monthInfo.name}</span>}
        </div>

        {/* Second row - 3 cards */}
        <div className="stat-card">
          <h3>{totalReportsCount}</h3>
          <p>Total Reports Count</p>
        </div>
        <div className="stat-card">
          <h3>{totalCounts.bookedSlots}</h3>
          <p>Booked Slots</p>
          {monthInfo && <span className="period-info">{monthInfo.name}</span>}
        </div>
        <div className="stat-card">
          <h3>{totalCounts.totalSlots}</h3>
          <p>Total Slots</p>
          {monthInfo && <span className="period-info">{monthInfo.name}</span>}
        </div>
      </div>

      {/* Admin-specific availability stats */}
      <div className="admin-availability-section">
        <h3>Admin Availability Breakdown</h3>
        {loading ? (
          <p className="loading-message">Loading admin availability data...</p>
        ) : adminSlots.length > 0 ? (
          <div className="admin-slots-table">
            <table>
              <thead>
                <tr>
                  <th>Admin Name</th>
                  <th>Email</th>
                  <th>Available Slots</th>
                  <th>Booked Slots</th>
                  <th>Total Slots</th>
                </tr>
              </thead>
              <tbody>
                {adminSlots.map(admin => (
                  <tr key={admin.adminId}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{admin.availableSlots}</td>
                    <td>{admin.bookedSlots}</td>
                    <td>{admin.totalSlots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">No admin availability data found for the current month.</p>
        )}
      </div>

      {/* Search Reports Section */}
      <div className="search-reports-section">
        <h3>Search Patient Reports</h3>
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-container">
            <input
              type="email"
              placeholder="Enter patient email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="search-input"
              required
            />
            <button type="submit" className="search-button" disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {searchError && <div className="search-error">{searchError}</div>}

        {searchResults.length > 0 ? (
          <div className="search-results">
            <h4>Search Results ({pagination.totalReports} reports found)</h4>
            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Patient Name</th>
                    <th>Patient Email</th>
                    <th>Uploaded At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(report => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{report.patient?.fullName}</td>
                      <td>{report.patient?.email}</td>
                      <td>{new Date(report.uploadedAt).toLocaleDateString()}</td>
                      <td>
                        <a
                          href={report.fullFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-report-link"
                        >
                          View Report
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || searchLoading}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || searchLoading}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : searchLoading ? (
          <p className="search-loading">Searching for reports...</p>
        ) : searchEmail && !searchError ? (
          <p className="no-results">No reports found for this patient email.</p>
        ) : null}
      </div>

      {/* Chart container */}
      <div className="chart-container">
        <canvas ref={chartRef} id="reportUploadChart"></canvas>
      </div>      {loading && (
        <p style={{marginTop: '1rem', color: '#888', textAlign: 'center'}}>Loading dashboard stats...</p>
      )}
    </div>
  );
}
