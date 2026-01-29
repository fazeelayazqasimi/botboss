import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function CompanyDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    hired: 0,
    pending: 0,
    interview: 0,
    rejected: 0
  });
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    type: 'Full-time',
    salary: '',
    experience: '',
    questions: '',
    category: 'IT'
  });
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState({
    dashboard: false,
    jobs: false,
    applications: false,
    postJob: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const API_URL = 'http://localhost:5000/api';
  const modalRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'company') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    loadDashboardData(parsedUser.id);
  }, [navigate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const loadDashboardData = async (companyId) => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true }));
      
      const [jobsResponse, appsResponse] = await Promise.all([
        fetch(`${API_URL}/company/${companyId}/jobs`),
        fetch(`${API_URL}/company/${companyId}/applications`)
      ]);
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
      }
      
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setApplications(appsData);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  useEffect(() => {
    const calculateStats = () => {
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => job.status === 'active').length;
      const totalApplications = applications.length;
      const shortlisted = applications.filter(app => app.status === 'shortlisted').length;
      const hired = applications.filter(app => app.status === 'hired').length;
      const pending = applications.filter(app => app.status === 'pending').length;
      const interview = applications.filter(app => app.status === 'interview').length;
      const rejected = applications.filter(app => app.status === 'rejected').length;
      
      setStats({ totalJobs, activeJobs, totalApplications, shortlisted, hired, pending, interview, rejected });
    };
    
    calculateStats();
  }, [jobs, applications]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, postJob: true }));
      
      const jobData = {
        ...newJob,
        companyId: user.id,
        companyName: user.companyName,
        status: 'active'
      };
      
      const endpoint = editingJob ? `${API_URL}/jobs/${editingJob.id}` : `${API_URL}/jobs`;
      const method = editingJob ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(jobData)
      });
      
      if (response.ok) {
        showNotification(editingJob ? 'Job updated successfully!' : 'Job posted successfully!');
        
        setNewJob({
          title: '',
          description: '',
          requirements: '',
          location: '',
          type: 'Full-time',
          salary: '',
          experience: '',
          questions: '',
          category: 'IT'
        });
        setEditingJob(null);
        
        await loadDashboardData(user.id);
        setActiveTab('jobs');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to process job', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Failed to process job', 'error');
    } finally {
      setLoading(prev => ({ ...prev, postJob: false }));
    }
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await loadDashboardData(user.id);
        showNotification('Job status updated');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      showNotification('Failed to update job status', 'error');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? All applications will also be deleted.')) return;
    
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        showNotification('Job deleted successfully');
        await loadDashboardData(user.id);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Failed to delete job', 'error');
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/applications/${appId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await loadDashboardData(user.id);
        showNotification('Application status updated');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      showNotification('Failed to update application status', 'error');
    }
  };

  const handleViewApplication = (application) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(10, 10, 10, 0.95); display: flex; align-items: center;
      justify-content: center; z-index: 1000; padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="background: #0f0f0f; border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; border: 1px solid #333; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
        <div style="padding: 32px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 2px solid #00ff00; padding-bottom: 16px;">
            <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);">Application Details</h2>
            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: none; border: none; font-size: 24px; color: #00ff00; cursor: pointer; padding: 8px;">×</button>
          </div>
          
          <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 32px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 24px; border-radius: 12px; border: 2px solid #00ff00;">
            <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #00ff00; font-size: 28px; font-weight: 600; border: 3px solid #333; text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);">
              ${application.candidateName?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 style="margin: 0 0 8px 0; color: #ffffff;">${application.candidateName}</h3>
              <p style="margin: 0; color: #cccccc;">${application.candidateEmail}</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 32px;">
            <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; border: 2px solid #333; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
              <p style="margin: 0 0 12px 0; color: #00ff00; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">Job Applied</p>
              <p style="margin: 0; font-weight: 700; color: #ffffff; font-size: 16px; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">${application.jobTitle}</p>
            </div>
            <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; border: 2px solid #333; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
              <p style="margin: 0 0 12px 0; color: #00ff00; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">Applied Date</p>
              <p style="margin: 0; font-weight: 700; color: #ffffff; font-size: 16px; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">${new Date(application.appliedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          ${application.additionalInfo ? `
          <div style="margin-bottom: 32px;">
            <h4 style="margin: 0 0 16px 0; color: #00ff00; font-size: 18px; font-weight: 600; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">Cover Letter / Additional Information</h4>
            <div style="background: #1a1a1a; padding: 24px; border-radius: 10px; border: 2px solid #333; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); min-height: 120px;">
              <p style="margin: 0; color: #cccccc; line-height: 1.8; white-space: pre-wrap;">${application.additionalInfo}</p>
            </div>
          </div>
          ` : ''}
          
          ${application.resumeUrl ? `
          <div style="margin-bottom: 32px;">
            <h4 style="margin: 0 0 16px 0; color: #00ff00; font-size: 18px; font-weight: 600; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">Resume / CV</h4>
            <a href="${application.resumeUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 28px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); color: #00ff00; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; transition: all 0.3s ease; border: 2px solid #00ff00; cursor: pointer; box-shadow: 0 0 15px rgba(0, 255, 0, 0.3); text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              View Resume/CV
            </a>
          </div>
          ` : ''}
          
          <div style="display: flex; gap: 16px; justify-content: flex-end; border-top: 2px solid #333; padding-top: 32px;">
            <select onchange="handleStatusChange('${application.id}', this.value)" 
              style="padding: 14px 20px; border-radius: 10px; border: 2px solid #333; font-size: 15px; font-weight: 600; background: #1a1a1a; color: #00ff00; outline: none; cursor: pointer; transition: all 0.3s ease; min-width: 180px; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">
              <option value="pending" ${application.status === 'pending' ? 'selected' : ''}>Pending Review</option>
              <option value="shortlisted" ${application.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
              <option value="interview" ${application.status === 'interview' ? 'selected' : ''}>Interview Scheduled</option>
              <option value="hired" ${application.status === 'hired' ? 'selected' : ''}>Hired</option>
              <option value="rejected" ${application.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>
            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="padding: 14px 32px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); color: #00ff00; border: 2px solid #00ff00; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 15px; transition: all 0.3s ease; text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);">
              Close Details
            </button>
          </div>
        </div>
      </div>
    `;
    
    window.handleStatusChange = (appId, newStatus) => {
      handleUpdateApplicationStatus(appId, newStatus);
      modal.remove();
    };
    
    document.body.appendChild(modal);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#1a2a1a', text: '#00ff00', border: '#00ff00' },
      shortlisted: { bg: '#0a2a0a', text: '#00ff88', border: '#00ff88' },
      interview: { bg: '#0a1a2a', text: '#0088ff', border: '#0088ff' },
      hired: { bg: '#0a2a1a', text: '#00ffaa', border: '#00ffaa' },
      rejected: { bg: '#2a0a0a', text: '#ff4444', border: '#ff4444' },
      active: { bg: '#0a2a0a', text: '#00ff00', border: '#00ff00' },
      closed: { bg: '#2a0a0a', text: '#ff4444', border: '#ff4444' },
      draft: { bg: '#1a1a1a', text: '#cccccc', border: '#333' }
    };
    return colors[status] || colors.pending;
  };

  // Filter and sort jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.postedDate || b.createdAt) - new Date(a.postedDate || a.createdAt);
      case 'oldest':
        return new Date(a.postedDate || a.createdAt) - new Date(b.postedDate || b.createdAt);
      case 'applicants_high':
        return (b.applicants || 0) - (a.applicants || 0);
      case 'applicants_low':
        return (a.applicants || 0) - (b.applicants || 0);
      default:
        return 0;
    }
  });

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportJobsToCSV = () => {
    if (jobs.length === 0) {
      showNotification('No jobs to export', 'error');
      return;
    }

    const headers = ['Title', 'Location', 'Type', 'Salary', 'Status', 'Applicants', 'Posted Date'];
    const csvContent = [
      headers.join(','),
      ...jobs.map(job => [
        `"${job.title}"`,
        `"${job.location}"`,
        `"${job.type}"`,
        `"${job.salary}"`,
        `"${job.status}"`,
        job.applicants || 0,
        `"${new Date(job.postedDate || job.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.companyName}_jobs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Jobs exported successfully');
  };

  const exportApplicationsToCSV = () => {
    if (applications.length === 0) {
      showNotification('No applications to export', 'error');
      return;
    }

    const headers = ['Candidate Name', 'Email', 'Job Title', 'Status', 'Applied Date', 'Resume URL'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        `"${app.candidateName || 'N/A'}"`,
        `"${app.candidateEmail || 'N/A'}"`,
        `"${app.jobTitle || 'N/A'}"`,
        `"${app.status || 'N/A'}"`,
        `"${new Date(app.appliedDate || app.createdAt).toLocaleDateString()}"`,
        `"${app.resumeUrl || 'N/A'}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.companyName}_applications_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Applications exported successfully');
  };

  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* Notification Toast */}
      {notification.show && (
        <div style={{
          ...styles.notification,
          background: notification.type === 'error' ? '#2a0a0a' : '#0a2a0a',
          border: notification.type === 'error' ? '1px solid #ff4444' : '1px solid #00ff00'
        }}>
          {notification.message}
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>🤖</div>
            <h2 style={styles.brandName}>BotBoss</h2>
          </div>
          <div style={styles.companyInfo}>
            <div style={styles.companyAvatar}>
              {user.companyName?.charAt(0) || 'C'}
            </div>
            <div style={styles.companyDetails}>
              <h3 style={styles.companyName}>{user.companyName}</h3>
              <p style={styles.companyEmail}>{user.email}</p>
              <div style={styles.roleBadge}>Company Admin</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: 'overview', icon: '📊', label: 'Dashboard' },
            { id: 'post-job', icon: '➕', label: 'Post Job' },
            { id: 'jobs', icon: '💼', label: 'Manage Jobs' },
            { id: 'applications', icon: '📋', label: 'Applications' },
            { id: 'analytics', icon: '📈', label: 'Analytics' }
          ].map(item => (
            <button
              key={item.id}
              style={activeTab === item.id ? styles.activeNavItem : styles.navItem}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'rgba(0, 255, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {activeTab === item.id && <div style={styles.activeIndicator}></div>}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.quickStats}>
            <div style={styles.quickStat}>
              <span style={styles.quickStatValue}>{stats.activeJobs}</span>
              <span style={styles.quickStatLabel}>Active Jobs</span>
            </div>
            <div style={styles.quickStat}>
              <span style={styles.quickStatValue}>{stats.totalApplications}</span>
              <span style={styles.quickStatLabel}>Applications</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={styles.logoutButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
              e.currentTarget.style.borderColor = '#ff4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(0, 255, 0, 0.3)';
            }}
          >
            <span style={styles.logoutIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'post-job' && (editingJob ? 'Edit Job Posting' : 'Create New Job Posting')}
              {activeTab === 'jobs' && 'Job Management'}
              {activeTab === 'applications' && 'Candidate Applications'}
              {activeTab === 'analytics' && 'Analytics & Insights'}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === 'overview' && 'Welcome back! Here\'s what\'s happening with your job postings.'}
              {activeTab === 'post-job' && 'Create a new job posting to attract top talent.'}
              {activeTab === 'jobs' && 'Manage and monitor all your job postings.'}
              {activeTab === 'applications' && 'Review and manage candidate applications.'}
              {activeTab === 'analytics' && 'Detailed insights and performance metrics.'}
            </p>
          </div>
          
          <div style={styles.headerActions}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search jobs, candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #00ff00';
                  e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #333';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={styles.searchIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
            
            <div style={styles.userProfile}>
              <div style={styles.userAvatar}>
                {user.name?.charAt(0) || 'A'}
              </div>
              <div style={styles.userInfo}>
                <p style={styles.userName}>{user.name}</p>
                <p style={styles.userTitle}>Company Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {loading.dashboard && activeTab === 'overview' && (
            <div style={styles.loadingOverlay}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading dashboard data...</p>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              {/* STATS CARDS */}
              <div style={styles.statsGrid}>
                {[
                  { label: 'Total Jobs', value: stats.totalJobs, change: '+12%', color: '#00ff00' },
                  { label: 'Active Jobs', value: stats.activeJobs, change: '+5%', color: '#00ff88' },
                  { label: 'Total Applications', value: stats.totalApplications, change: '+24%', color: '#0088ff' },
                  { label: 'Shortlisted', value: stats.shortlisted, change: '+18%', color: '#00ffaa' },
                  { label: 'Hired', value: stats.hired, change: '+8%', color: '#00aaff' },
                  { label: 'Pending Review', value: stats.pending, change: '+15%', color: '#ffaa00' }
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    style={styles.statCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 255, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    <div style={styles.statContent}>
                      <div style={styles.statHeader}>
                        <span style={styles.statLabel}>{stat.label}</span>
                        <span style={styles.statChange}>{stat.change}</span>
                      </div>
                      <div style={styles.statValue}>{stat.value.toLocaleString()}</div>
                    </div>
                    <div style={{...styles.statBar, background: stat.color, boxShadow: `0 0 10px ${stat.color}`}}></div>
                  </div>
                ))}
              </div>

              {/* QUICK ACTIONS */}
              <div style={styles.quickActions}>
                <h2 style={styles.sectionTitle}>Quick Actions</h2>
                <div style={styles.actionsGrid}>
                  <button 
                    onClick={() => setActiveTab('post-job')} 
                    style={styles.actionButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00ff00';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={styles.actionIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <span style={styles.actionLabel}>Create New Job</span>
                    <span style={styles.actionDescription}>Post a new job vacancy</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('applications')} 
                    style={styles.actionButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00ff00';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={styles.actionIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <span style={styles.actionLabel}>Review Applications</span>
                    <span style={styles.actionDescription}>View candidate submissions</span>
                  </button>
                  
                  <button 
                    onClick={exportJobsToCSV} 
                    style={styles.actionButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00ff00';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={styles.actionIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </div>
                    <span style={styles.actionLabel}>Export Jobs</span>
                    <span style={styles.actionDescription}>Download job data</span>
                  </button>
                  
                  <button 
                    onClick={exportApplicationsToCSV} 
                    style={styles.actionButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00ff00';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={styles.actionIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <span style={styles.actionLabel}>Export Applications</span>
                    <span style={styles.actionDescription}>Download candidate data</span>
                  </button>
                </div>
              </div>

              {/* RECENT ACTIVITY */}
              <div style={styles.activityGrid}>
                <div style={styles.activityCard}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Recent Job Postings</h3>
                    <button 
                      onClick={() => setActiveTab('jobs')} 
                      style={styles.viewAllButton}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#00ff88';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#00ff00';
                      }}
                    >
                      View All
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                  <div style={styles.activityList}>
                    {jobs.slice(0, 5).map(job => (
                      <div 
                        key={job.id} 
                        style={styles.activityItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 255, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={styles.activityItemContent}>
                          <h4 style={styles.activityItemTitle}>{job.title}</h4>
                          <p style={styles.activityItemMeta}>{job.location} • {job.type}</p>
                        </div>
                        <div style={styles.activityItemMeta}>
                          <span style={styles.applicantCount}>{job.applicants || 0} applicants</span>
                          <span style={{...styles.statusBadge, ...getStatusStyle(job.status)}}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.activityCard}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Recent Applications</h3>
                    <button 
                      onClick={() => setActiveTab('applications')} 
                      style={styles.viewAllButton}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#00ff88';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#00ff00';
                      }}
                    >
                      View All
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                  <div style={styles.activityList}>
                    {applications.slice(0, 5).map(app => (
                      <div 
                        key={app.id} 
                        style={styles.activityItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 255, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={styles.candidateAvatar}>
                          {app.candidateName?.charAt(0) || 'C'}
                        </div>
                        <div style={styles.activityItemContent}>
                          <h4 style={styles.activityItemTitle}>{app.candidateName}</h4>
                          <p style={styles.activityItemMeta}>{app.jobTitle}</p>
                        </div>
                        <span style={{...styles.statusBadge, ...getStatusStyle(app.status)}}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POST JOB TAB */}
          {activeTab === 'post-job' && (
            <div style={styles.formContainer}>
              <div style={styles.formCard}>
                <div style={styles.formHeader}>
                  <h2 style={styles.formTitle}>
                    {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                  </h2>
                  <p style={styles.formSubtitle}>
                    Fill in the details below to create a new job posting. All fields marked with * are required.
                  </p>
                </div>
                
                <form onSubmit={handlePostJob}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Job Title *</label>
                      <input
                        type="text"
                        value={newJob.title}
                        onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                        placeholder="e.g., Senior Frontend Developer"
                        style={styles.formInput}
                        required
                        onFocus={(e) => {
                          e.target.style.border = '2px solid #00ff00';
                          e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '2px solid #333';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Location *</label>
                      <input
                        type="text"
                        value={newJob.location}
                        onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                        placeholder="e.g., Remote, New York, London"
                        style={styles.formInput}
                        required
                        onFocus={(e) => {
                          e.target.style.border = '2px solid #00ff00';
                          e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '2px solid #333';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Employment Type *</label>
                      <select
                        value={newJob.type}
                        onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                        style={styles.formInput}
                        required
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Salary Range *</label>
                      <input
                        type="text"
                        value={newJob.salary}
                        onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                        placeholder="e.g., $80,000 - $100,000"
                        style={styles.formInput}
                        required
                        onFocus={(e) => {
                          e.target.style.border = '2px solid #00ff00';
                          e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '2px solid #333';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Experience Level</label>
                      <select
                        value={newJob.experience}
                        onChange={(e) => setNewJob({...newJob, experience: e.target.value})}
                        style={styles.formInput}
                      >
                        <option value="">Select Experience Level</option>
                        <option value="Entry Level">Entry Level (0-2 years)</option>
                        <option value="Mid Level">Mid Level (2-5 years)</option>
                        <option value="Senior Level">Senior Level (5+ years)</option>
                        <option value="Lead">Lead/Manager Level</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Job Category</label>
                      <select
                        value={newJob.category}
                        onChange={(e) => setNewJob({...newJob, category: e.target.value})}
                        style={styles.formInput}
                      >
                        <option value="IT">Information Technology</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                        <option value="HR">Human Resources</option>
                        <option value="Design">Design</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Job Description *</label>
                    <textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                      placeholder="Describe the role, responsibilities, and expectations..."
                      style={{...styles.formInput, ...styles.textarea}}
                      required
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #00ff00';
                        e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid #333';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div style={styles.characterCount}>
                      {newJob.description.length}/2000 characters
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Requirements & Skills *</label>
                    <textarea
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                      placeholder="List required skills, qualifications, and experience..."
                      style={{...styles.formInput, ...styles.textarea}}
                      required
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #00ff00';
                        e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid #333';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div style={styles.characterCount}>
                      {newJob.requirements.length}/1000 characters
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Interview Questions (Optional)</label>
                    <textarea
                      value={newJob.questions}
                      onChange={(e) => setNewJob({...newJob, questions: e.target.value})}
                      placeholder="Enter questions for candidates (one per line)..."
                      style={{...styles.formInput, ...styles.textarea, minHeight: '100px'}}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #00ff00';
                        e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '2px solid #333';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <p style={styles.helperText}>These questions will be used during the interview process</p>
                  </div>

                  <div style={styles.formActions}>
                    {editingJob && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingJob(null);
                          setNewJob({
                            title: '',
                            description: '',
                            requirements: '',
                            location: '',
                            type: 'Full-time',
                            salary: '',
                            experience: '',
                            questions: '',
                            category: 'IT'
                          });
                        }}
                        style={styles.cancelButton}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                          e.currentTarget.style.borderColor = '#ff4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#1a1a1a';
                          e.currentTarget.style.borderColor = '#333';
                        }}
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      style={styles.submitButton}
                      disabled={loading.postJob}
                      onMouseEnter={(e) => {
                        if (!loading.postJob) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading.postJob) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                        }
                      }}
                    >
                      {loading.postJob ? (
                        <>
                          <div style={styles.buttonSpinner}></div>
                          Processing...
                        </>
                      ) : editingJob ? 'Update Job Posting' : 'Publish Job Posting'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MANAGE JOBS TAB */}
          {activeTab === 'jobs' && (
            <div>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Job Management</h2>
                  <p style={styles.sectionSubtitle}>Total {jobs.length} job postings • {stats.activeJobs} active</p>
                </div>
                <div style={styles.controls}>
                  <div style={styles.filterGroup}>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="draft">Draft</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="applicants_high">Most Applicants</option>
                      <option value="applicants_low">Fewest Applicants</option>
                    </select>
                  </div>
                  <div style={styles.buttonGroup}>
                    <button 
                      onClick={exportJobsToCSV} 
                      style={styles.exportButton}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00ff00';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Export CSV
                    </button>
                    <button
                      onClick={() => setActiveTab('post-job')}
                      style={styles.primaryButton}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Create New Job
                    </button>
                  </div>
                </div>
              </div>

              {sortedJobs.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIllustration}>
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="1">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <h3 style={styles.emptyTitle}>No Jobs Found</h3>
                  <p style={styles.emptyDescription}>
                    {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Create your first job posting to start attracting talent'}
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('post-job');
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    style={styles.primaryButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                    }}
                  >
                    Create Your First Job
                  </button>
                </div>
              ) : (
                <div style={styles.tableContainer}>
                  {sortedJobs.map(job => (
                    <div 
                      key={job.id} 
                      style={styles.tableRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 255, 0, 0.05)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={styles.jobInfo}>
                        <div>
                          <h4 style={styles.jobTitle}>{job.title}</h4>
                          <div style={styles.jobMeta}>
                            <span style={styles.jobMetaItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {job.location}
                            </span>
                            <span style={styles.jobMetaItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                              {job.type}
                            </span>
                            <span style={styles.jobMetaItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              {job.salary}
                            </span>
                          </div>
                          <p style={styles.jobDate}>
                            Posted: {new Date(job.postedDate || job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div style={styles.jobStats}>
                        <div style={styles.applicantCount}>
                          <span style={styles.applicantNumber}>{job.applicants || 0}</span>
                          <span style={styles.applicantLabel}>Applicants</span>
                        </div>
                        <select
                          value={job.status}
                          onChange={(e) => handleUpdateJobStatus(job.id, e.target.value)}
                          style={{
                            ...styles.statusSelect,
                            background: getStatusColor(job.status).bg,
                            color: getStatusColor(job.status).text,
                            borderColor: getStatusColor(job.status).border
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="closed">Closed</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                      <div style={styles.jobActions}>
                        <button
                          onClick={() => {
                            setEditingJob(job);
                            setNewJob({
                              title: job.title,
                              description: job.description,
                              requirements: job.requirements,
                              location: job.location,
                              type: job.type,
                              salary: job.salary,
                              experience: job.experience || '',
                              questions: job.questions || '',
                              category: job.category || 'IT'
                            });
                            setActiveTab('post-job');
                          }}
                          style={styles.editButton}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          style={styles.deleteButton}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Candidate Applications</h2>
                  <p style={styles.sectionSubtitle}>Total {applications.length} applications • {stats.shortlisted} shortlisted</p>
                </div>
                <div style={styles.controls}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Applications</option>
                    <option value="pending">Pending Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button 
                    onClick={exportApplicationsToCSV} 
                    style={styles.exportButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00ff00';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIllustration}>
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="1">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                  </div>
                  <h3 style={styles.emptyTitle}>No Applications Found</h3>
                  <p style={styles.emptyDescription}>
                    {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'When candidates apply to your jobs, they will appear here'}
                  </p>
                </div>
              ) : (
                <div style={styles.tableContainer}>
                  {filteredApplications.map(app => (
                    <div 
                      key={app.id} 
                      style={styles.tableRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 255, 0, 0.05)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={styles.applicantInfo}>
                        <div style={styles.applicantAvatar}>
                          {app.candidateName?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h4 style={styles.applicantName}>{app.candidateName}</h4>
                          <p style={styles.applicantEmail}>{app.candidateEmail}</p>
                          <p style={styles.applicantJob}>{app.jobTitle}</p>
                        </div>
                      </div>
                      <div style={styles.applicationDetails}>
                        <p style={styles.applicationDate}>
                          Applied: {new Date(app.appliedDate || app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {app.resumeUrl && (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.resumeLink}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            View Resume
                          </a>
                        )}
                      </div>
                      <div style={styles.applicationStatus}>
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                          style={{
                            ...styles.statusSelect,
                            background: getStatusColor(app.status).bg,
                            color: getStatusColor(app.status).text,
                            borderColor: getStatusColor(app.status).border
                          }}
                        >
                          <option value="pending">Pending Review</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div style={styles.applicationActions}>
                        <button
                          onClick={() => handleViewApplication(app)}
                          style={styles.viewButton}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div>
              <div style={styles.analyticsHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Analytics & Insights</h2>
                  <p style={styles.sectionSubtitle}>Performance metrics and hiring insights</p>
                </div>
                <div style={styles.dateRange}>
                  <select style={styles.filterSelect}>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last 6 months</option>
                    <option>Last year</option>
                  </select>
                </div>
              </div>
              
              <div style={styles.analyticsGrid}>
                <div style={styles.analyticsCard}>
                  <h3 style={styles.analyticsTitle}>Application Distribution</h3>
                  <div style={styles.chartContainer}>
                    {[
                      { label: 'Pending', value: stats.pending, color: '#ffaa00' },
                      { label: 'Shortlisted', value: stats.shortlisted, color: '#00ff88' },
                      { label: 'Interview', value: stats.interview, color: '#0088ff' },
                      { label: 'Hired', value: stats.hired, color: '#00ffaa' },
                      { label: 'Rejected', value: stats.rejected, color: '#ff4444' }
                    ].map((item, index) => (
                      <div key={index} style={styles.chartItem}>
                        <div style={styles.chartLabel}>
                          <div style={{...styles.chartColor, background: item.color, boxShadow: `0 0 5px ${item.color}`}}></div>
                          <span style={styles.chartLabelText}>{item.label}</span>
                        </div>
                        <div style={styles.chartBarContainer}>
                          <div 
                            style={{
                              ...styles.chartBar,
                              width: `${(item.value / Math.max(stats.totalApplications, 1)) * 100}%`,
                              background: item.color,
                              boxShadow: `0 0 5px ${item.color}`
                            }}
                          ></div>
                        </div>
                        <span style={styles.chartValue}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.analyticsCard}>
                  <h3 style={styles.analyticsTitle}>Job Status Overview</h3>
                  <div style={styles.chartContainer}>
                    {[
                      { label: 'Active Jobs', value: stats.activeJobs, color: '#00ff00' },
                      { label: 'Closed Jobs', value: stats.totalJobs - stats.activeJobs, color: '#ff4444' }
                    ].map((item, index) => (
                      <div key={index} style={styles.chartItem}>
                        <div style={styles.chartLabel}>
                          <div style={{...styles.chartColor, background: item.color, boxShadow: `0 0 5px ${item.color}`}}></div>
                          <span style={styles.chartLabelText}>{item.label}</span>
                        </div>
                        <div style={styles.chartBarContainer}>
                          <div 
                            style={{
                              ...styles.chartBar,
                              width: `${(item.value / Math.max(stats.totalJobs, 1)) * 100}%`,
                              background: item.color,
                              boxShadow: `0 0 5px ${item.color}`
                            }}
                          ></div>
                        </div>
                        <span style={styles.chartValue}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.analyticsCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Top Performing Jobs</h3>
                  <span style={styles.cardSubtitle}>By number of applications</span>
                </div>
                <div style={styles.topJobsList}>
                  {jobs
                    .sort((a, b) => (b.applicants || 0) - (a.applicants || 0))
                    .slice(0, 5)
                    .map((job, index) => (
                      <div 
                        key={job.id} 
                        style={styles.topJobItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 255, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={styles.topJobRank}>{index + 1}</div>
                        <div style={styles.topJobInfo}>
                          <h4 style={styles.topJobTitle}>{job.title}</h4>
                          <p style={styles.topJobMeta}>{job.location} • {job.type}</p>
                        </div>
                        <div style={styles.topJobStats}>
                          <span style={styles.topJobApplicants}>{job.applicants || 0} applicants</span>
                          <span style={styles.topJobStatus}>{job.status}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <div style={styles.footerContent}>
            <p>© {new Date().getFullYear()} {user.companyName}. All rights reserved.</p>
            <p>Need assistance? Contact our support team at support@botboss.com</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

const getStatusStyle = (status) => {
  const styles = {
    active: { background: 'rgba(0, 255, 0, 0.1)', color: '#00ff00', border: '2px solid #00ff00' },
    hired: { background: 'rgba(0, 255, 170, 0.1)', color: '#00ffaa', border: '2px solid #00ffaa' },
    shortlisted: { background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', border: '2px solid #00ff88' },
    interview: { background: 'rgba(0, 136, 255, 0.1)', color: '#0088ff', border: '2px solid #0088ff' },
    pending: { background: 'rgba(255, 170, 0, 0.1)', color: '#ffaa00', border: '2px solid #ffaa00' },
    closed: { background: 'rgba(255, 0, 0, 0.1)', color: '#ff4444', border: '2px solid #ff4444' },
    rejected: { background: 'rgba(255, 0, 0, 0.1)', color: '#ff4444', border: '2px solid #ff4444' },
    draft: { background: 'rgba(255, 255, 255, 0.1)', color: '#cccccc', border: '2px solid #333' }
  };
  return styles[status] || styles.pending;
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0a0a0a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflowX: 'hidden'
  },
  
  notification: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '16px 24px',
    borderRadius: '10px',
    color: '#00ff00',
    fontWeight: '600',
    zIndex: 9999,
    boxShadow: '0 8px 24px rgba(0, 255, 0, 0.2)',
    animation: 'slideIn 0.3s ease',
    maxWidth: '400px',
    backdropFilter: 'blur(10px)',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  
  // Sidebar Styles
  sidebar: {
    width: '280px',
    background: '#0f0f0f',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)',
    borderRight: '1px solid #333'
  },
  sidebarHeader: {
    padding: '32px 24px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderBottom: '1px solid #333'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px'
  },
  logo: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    fontWeight: '700',
    fontSize: '28px',
    border: '2px solid #00ff00',
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
  },
  brandName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#00ff00',
    margin: 0,
    letterSpacing: '-0.5px',
    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
  },
  companyInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  companyAvatar: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    fontWeight: 'bold',
    fontSize: '22px',
    border: '2px solid #00ff00',
    boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  companyDetails: {
    flex: 1,
    minWidth: 0
  },
  companyName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 6px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  companyEmail: {
    fontSize: '13px',
    color: '#cccccc',
    margin: '0 0 10px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    background: 'rgba(0, 255, 0, 0.1)',
    color: '#00ff00',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid rgba(0, 255, 0, 0.3)',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '24px 16px',
    overflowY: 'auto'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    color: '#cccccc',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    position: 'relative',
    width: '100%'
  },
  activeNavItem: {
    background: 'rgba(0, 255, 0, 0.1)',
    color: '#00ff00',
    borderLeft: '4px solid #00ff00',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  navIcon: {
    fontSize: '20px',
    width: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navLabel: {
    flex: 1
  },
  activeIndicator: {
    position: 'absolute',
    right: '20px',
    width: '8px',
    height: '8px',
    background: '#00ff00',
    borderRadius: '50%',
    boxShadow: '0 0 5px #00ff00'
  },
  sidebarFooter: {
    marginTop: 'auto',
    padding: '24px',
    borderTop: '1px solid #333',
    background: 'rgba(10, 10, 10, 0.5)'
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  quickStat: {
    textAlign: 'center',
    padding: '12px',
    background: 'rgba(0, 255, 0, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(0, 255, 0, 0.2)'
  },
  quickStatValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#00ff00',
    marginBottom: '4px',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  quickStatLabel: {
    fontSize: '12px',
    color: '#cccccc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    background: 'rgba(0, 255, 0, 0.1)',
    border: '1px solid rgba(0, 255, 0, 0.3)',
    color: '#00ff00',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  logoutIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  // Main Content Styles
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    background: '#0a0a0a'
  },
  header: {
    background: '#0f0f0f',
    padding: '28px 40px',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 20px rgba(0, 0, 0, 0.5)'
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#cccccc',
    margin: 0,
    maxWidth: '600px',
    lineHeight: 1.6
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  searchContainer: {
    position: 'relative',
    width: '320px'
  },
  searchInput: {
    width: '100%',
    padding: '14px 20px 14px 48px',
    border: '2px solid #333',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: '#1a1a1a',
    color: '#ffffff',
    fontWeight: '500'
  },
  searchIcon: {
    position: 'absolute',
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#00ff00',
    filter: 'drop-shadow(0 0 2px rgba(0, 255, 0, 0.5))'
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  userAvatar: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    fontWeight: '700',
    fontSize: '20px',
    border: '2px solid #00ff00',
    boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  userInfo: {
    textAlign: 'right'
  },
  userName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 4px 0'
  },
  userTitle: {
    fontSize: '13px',
    color: '#cccccc',
    margin: 0
  },
  
  // Content Area
  content: {
    padding: '40px',
    flex: 1,
    position: 'relative'
  },
  
  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  statCard: {
    background: '#0f0f0f',
    padding: '28px',
    borderRadius: '16px',
    border: '1px solid #333',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease'
  },
  statContent: {
    position: 'relative',
    zIndex: 2
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  statLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#cccccc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statChange: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#00ff00',
    background: 'rgba(0, 255, 0, 0.1)',
    padding: '6px 12px',
    borderRadius: '20px',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  statValue: {
    fontSize: '42px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0',
    letterSpacing: '-1px',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.3)'
  },
  statBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '4px',
    borderRadius: '0 0 16px 16px'
  },
  
  // Quick Actions
  quickActions: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 24px 0',
    letterSpacing: '-0.5px',
    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px'
  },
  actionButton: {
    background: '#0f0f0f',
    border: '2px solid #333',
    padding: '28px 24px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
    textAlign: 'left',
    position: 'relative',
    overflow: 'hidden'
  },
  actionIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    marginBottom: '8px',
    border: '2px solid #333'
  },
  actionLabel: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.3)'
  },
  actionDescription: {
    fontSize: '14px',
    color: '#cccccc',
    margin: '0',
    lineHeight: 1.6
  },
  
  // Activity Grid
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '32px',
    marginBottom: '40px'
  },
  activityCard: {
    background: '#0f0f0f',
    borderRadius: '16px',
    border: '1px solid #333',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    borderBottom: '2px solid #00ff00',
    paddingBottom: '16px'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    textShadow: '0 0 5px rgba(0, 255, 0, 0.3)'
  },
  viewAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#00ff00',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
    transition: 'all 0.3s ease',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    borderBottom: '1px solid #333',
    transition: 'all 0.3s ease'
  },
  candidateAvatar: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    fontWeight: 'bold',
    fontSize: '18px',
    marginRight: '16px',
    flexShrink: 0,
    border: '2px solid #333'
  },
  activityItemContent: {
    flex: 1,
    minWidth: 0
  },
  activityItemTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 6px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  activityItemMeta: {
    fontSize: '14px',
    color: '#cccccc',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  applicantCount: {
    background: 'rgba(0, 136, 255, 0.1)',
    color: '#0088ff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    textShadow: '0 0 3px rgba(0, 136, 255, 0.5)',
    border: '1px solid rgba(0, 136, 255, 0.3)'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize',
    border: '2px solid',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  
  // Form Styles
  formContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%'
  },
  formCard: {
    background: '#0f0f0f',
    borderRadius: '20px',
    border: '1px solid #333',
    padding: '40px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
  },
  formHeader: {
    marginBottom: '40px',
    borderBottom: '2px solid #00ff00',
    paddingBottom: '24px'
  },
  formTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px',
    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
  },
  formSubtitle: {
    fontSize: '16px',
    color: '#cccccc',
    margin: 0,
    lineHeight: 1.6
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    marginBottom: '32px'
  },
  formGroup: {
    marginBottom: '28px'
  },
  formLabel: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    color: '#cccccc',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  formInput: {
    width: '100%',
    padding: '16px 20px',
    fontSize: '15px',
    border: '2px solid #333',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: '#1a1a1a',
    color: '#ffffff',
    fontWeight: '500',
    boxSizing: 'border-box'
  },
  textarea: {
    minHeight: '160px',
    resize: 'vertical',
    lineHeight: 1.6,
    fontFamily: 'inherit'
  },
  characterCount: {
    fontSize: '13px',
    color: '#cccccc',
    textAlign: 'right',
    marginTop: '8px'
  },
  helperText: {
    fontSize: '14px',
    color: '#888',
    marginTop: '8px',
    fontStyle: 'italic',
    lineHeight: 1.6
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '48px',
    paddingTop: '32px',
    borderTop: '2px solid #333'
  },
  cancelButton: {
    padding: '16px 32px',
    background: '#1a1a1a',
    color: '#cccccc',
    border: '2px solid #333',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  submitButton: {
    padding: '18px 48px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#00ff00',
    border: '2px solid #00ff00',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  buttonSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(0, 255, 0, 0.3)',
    borderTop: '3px solid #00ff00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  // Section Header
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#cccccc',
    margin: '8px 0 0 0'
  },
  controls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    gap: '12px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  filterSelect: {
    padding: '12px 20px',
    border: '2px solid #333',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    background: '#1a1a1a',
    color: '#ffffff',
    minWidth: '180px',
    transition: 'all 0.3s ease'
  },
  exportButton: {
    padding: '12px 24px',
    background: '#1a1a1a',
    color: '#cccccc',
    border: '2px solid #333',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease'
  },
  primaryButton: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#00ff00',
    border: '2px solid #00ff00',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.5)'
  },
  
  // Table Styles
  tableContainer: {
    background: '#0f0f0f',
    borderRadius: '16px',
    border: '1px solid #333',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '24px',
    padding: '24px 32px',
    borderBottom: '1px solid #333',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  },
  jobInfo: {
    minWidth: 0
  },
  jobTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 12px 0',
    lineHeight: 1.4
  },
  jobMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '12px'
  },
  jobMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#cccccc',
    fontWeight: '500'
  },
  jobDate: {
    fontSize: '13px',
    color: '#888',
    margin: 0
  },
  jobStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center'
  },
  applicantCount: {
    textAlign: 'center'
  },
  applicantNumber: {
    display: 'block',
    fontSize: '28px',
    fontWeight: '800',
    color: '#00ff00',
    lineHeight: 1,
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  applicantLabel: {
    fontSize: '13px',
    color: '#cccccc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statusSelect: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '2px solid',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
    maxWidth: '160px',
    transition: 'all 0.3s ease'
  },
  jobActions: {
    display: 'flex',
    gap: '12px'
  },
  editButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#00ff00',
    border: '2px solid #00ff00',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    flex: 1
  },
  deleteButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #2a0a0a 0%, #1a0a0a 100%)',
    color: '#ff4444',
    border: '2px solid #ff4444',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    flex: 1
  },
  
  // Applicant Styles
  applicantInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  applicantAvatar: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    fontWeight: 'bold',
    fontSize: '22px',
    flexShrink: 0,
    border: '2px solid #00ff00',
    boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  applicantName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 6px 0'
  },
  applicantEmail: {
    fontSize: '14px',
    color: '#cccccc',
    margin: '0 0 6px 0'
  },
  applicantJob: {
    fontSize: '15px',
    color: '#888',
    margin: 0,
    fontWeight: '500'
  },
  applicationDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  applicationDate: {
    fontSize: '14px',
    color: '#cccccc',
    margin: 0,
    fontWeight: '500'
  },
  resumeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#00ff00',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    maxWidth: 'fit-content',
    border: '2px solid #00ff00'
  },
  applicationStatus: {
    display: 'flex',
    justifyContent: 'center'
  },
  applicationActions: {
    display: 'flex',
    justifyContent: 'center'
  },
  viewButton: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#00ff00',
    border: '2px solid #00ff00',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    width: '100%',
    justifyContent: 'center'
  },
  
  // Analytics Styles
  analyticsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '32px',
    marginBottom: '40px'
  },
  analyticsCard: {
    background: '#0f0f0f',
    borderRadius: '16px',
    border: '1px solid #333',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  },
  analyticsTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 28px 0',
    borderBottom: '2px solid #00ff00',
    paddingBottom: '16px',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.3)'
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  chartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  chartLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '140px'
  },
  chartColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    flexShrink: 0
  },
  chartLabelText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#cccccc'
  },
  chartBarContainer: {
    flex: 1,
    height: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  chartBar: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.8s ease'
  },
  chartValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    minWidth: '60px',
    textAlign: 'right',
    textShadow: '0 0 3px rgba(0, 255, 0, 0.3)'
  },
  
  // Top Jobs List
  topJobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  topJobItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    borderBottom: '1px solid #333',
    transition: 'all 0.3s ease'
  },
  topJobRank: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ff00',
    fontWeight: '700',
    fontSize: '18px',
    flexShrink: 0,
    border: '2px solid #00ff00',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  topJobInfo: {
    flex: 1,
    minWidth: 0
  },
  topJobTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 6px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  topJobMeta: {
    fontSize: '14px',
    color: '#cccccc',
    margin: 0
  },
  topJobStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end'
  },
  topJobApplicants: {
    background: 'rgba(0, 136, 255, 0.1)',
    color: '#0088ff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid rgba(0, 136, 255, 0.3)'
  },
  topJobStatus: {
    fontSize: '13px',
    color: '#cccccc',
    fontWeight: '500'
  },
  
  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    background: '#0f0f0f',
    borderRadius: '16px',
    border: '2px dashed #333',
    margin: '40px 0'
  },
  emptyIllustration: {
    marginBottom: '32px',
    opacity: 0.7
  },
  emptyTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 16px 0',
    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
  },
  emptyDescription: {
    fontSize: '16px',
    color: '#cccccc',
    margin: '0 0 32px 0',
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.6
  },
  
  // Loading States
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    background: '#0a0a0a'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 10, 10, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderRadius: '16px'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(0, 255, 0, 0.1)',
    borderTop: '4px solid #00ff00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#00ff00',
    marginTop: '20px',
    textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
  },
  
  // Footer
  footer: {
    padding: '32px 40px',
    background: '#0f0f0f',
    color: '#cccccc',
    fontSize: '14px',
    borderTop: '1px solid #333',
    marginTop: 'auto'
  },
  footerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  input:focus, textarea:focus, select:focus {
    border-color: #00ff00 !important;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3) !important;
  }
  
  button:hover {
    transform: translateY(-2px) !important;
  }
  
  button:active {
    transform: translateY(0) !important;
  }
  
  a:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .fade-in {
    animation: fadeIn 0.6s ease;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #00ff00;
  }
  
  @media (max-width: 1200px) {
    .table-row {
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .job-actions {
      grid-column: span 2;
      justify-content: center;
    }
  }
  
  @media (max-width: 768px) {
    .dashboard-container {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      height: auto;
      position: static;
    }
    
    .main-content {
      padding: 24px;
    }
    
    .header {
      flex-direction: column;
      gap: 20px;
      padding: 24px;
    }
    
    .search-container {
      width: 100%;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .activity-grid {
      grid-template-columns: 1fr;
    }
    
    .analytics-grid {
      grid-template-columns: 1fr;
    }
    
    .table-row {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .footer-content {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }
  }
`;
document.head.appendChild(styleSheet);

export default CompanyDashboard;