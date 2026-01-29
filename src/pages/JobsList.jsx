import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const JobsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({
    title: '',
    location: '',
    category: ''
  });
  const [filters, setFilters] = useState({
    type: 'all',
    experience: 'all',
    salary: 'all',
    posted: 'all'
  });
  const [sortBy, setSortBy] = useState('newest');
  const [user, setUser] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Parse URL query parameters
    const params = new URLSearchParams(location.search);
    const initialSearch = {
      title: params.get('title') || '',
      location: params.get('location') || '',
      category: params.get('category') || ''
    };
    
    setSearchQuery(initialSearch);
    loadJobs();
  }, [location]);

  useEffect(() => {
    filterAndSortJobs();
  }, [jobs, searchQuery, filters, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/jobs`);
      if (response.ok) {
        const jobsData = await response.json();
        // Filter only active jobs
        const activeJobs = jobsData.filter(job => job.status === 'active');
        setJobs(activeJobs);
        setFilteredJobs(activeJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortJobs = () => {
    let filtered = [...jobs];

    // Search filters
    if (searchQuery.title) {
      const term = searchQuery.title.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.companyName.toLowerCase().includes(term)
      );
    }

    if (searchQuery.location) {
      const term = searchQuery.location.toLowerCase();
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(term)
      );
    }

    if (searchQuery.category) {
      filtered = filtered.filter(job =>
        job.category?.toLowerCase() === searchQuery.category.toLowerCase()
      );
    }

    // Additional filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(job => job.type === filters.type);
    }

    if (filters.experience !== 'all') {
      filtered = filtered.filter(job => {
        if (!job.experience) return false;
        if (filters.experience === 'entry') return job.experience.includes('Entry');
        if (filters.experience === 'mid') return job.experience.includes('Mid');
        if (filters.experience === 'senior') return job.experience.includes('Senior');
        return true;
      });
    }

    if (filters.posted !== 'all') {
      const now = new Date();
      filtered = filtered.filter(job => {
        const postedDate = new Date(job.postedDate);
        const diffDays = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
        
        if (filters.posted === 'today') return diffDays === 0;
        if (filters.posted === 'week') return diffDays <= 7;
        if (filters.posted === 'month') return diffDays <= 30;
        return true;
      });
    }

    // Sort jobs
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          return new Date(b.postedDate) - new Date(a.postedDate);
        case 'oldest':
          return new Date(a.postedDate) - new Date(b.postedDate);
        case 'salary_high':
          return parseSalary(b.salary) - parseSalary(a.salary);
        case 'salary_low':
          return parseSalary(a.salary) - parseSalary(b.salary);
        case 'applicants_high':
          return (b.applicants || 0) - (a.applicants || 0);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const parseSalary = (salaryString) => {
    if (!salaryString) return 0;
    // Extract numbers from salary string
    const matches = salaryString.match(/\$?(\d+(,\d+)*(\.\d+)?)/g);
    if (matches) {
      const numbers = matches.map(num => parseFloat(num.replace(/[$,]/g, '')));
      return Math.max(...numbers);
    }
    return 0;
  };

  const getUniqueLocations = () => {
    const locations = jobs.map(job => job.location);
    return ['all', ...new Set(locations)].filter(Boolean);
  };

  const getUniqueJobTypes = () => {
    const types = jobs.map(job => job.type);
    return ['all', ...new Set(types)].filter(Boolean);
  };

  const getUniqueCategories = () => {
    const categories = jobs.map(job => job.category).filter(Boolean);
    return ['all', ...new Set(categories)].filter(Boolean);
  };

  const handleQuickApply = (job) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role === 'seeker') {
      // Apply for job
      alert(`Applying for ${job.title} at ${job.companyName}`);
      // In a real app, you would call the apply API here
    } else {
      alert('Company accounts cannot apply for jobs');
    }
  };

  const handleSaveJob = (jobId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Save job to localStorage
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    if (!savedJobs.includes(jobId)) {
      savedJobs.push(jobId);
      localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
      alert('Job saved successfully!');
    } else {
      alert('Job already saved');
    }
  };

  const clearFilters = () => {
    setSearchQuery({ title: '', location: '', category: '' });
    setFilters({ type: 'all', experience: 'all', salary: 'all', posted: 'all' });
    setSortBy('newest');
  };

  const getJobCategory = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('frontend') || titleLower.includes('react') || titleLower.includes('javascript')) return 'Frontend';
    if (titleLower.includes('backend') || titleLower.includes('node') || titleLower.includes('python')) return 'Backend';
    if (titleLower.includes('full stack') || titleLower.includes('full-stack')) return 'Full Stack';
    if (titleLower.includes('devops') || titleLower.includes('aws')) return 'DevOps';
    if (titleLower.includes('mobile') || titleLower.includes('android') || titleLower.includes('ios')) return 'Mobile';
    if (titleLower.includes('data') || titleLower.includes('analyst') || titleLower.includes('scientist')) return 'Data';
    if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux')) return 'Design';
    if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('director')) return 'Management';
    return 'Other';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Find Your Dream Job</h1>
          <p style={styles.heroSubtitle}>
            Discover {jobs.length}+ opportunities from top companies
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.searchContainer}>
          <div style={styles.searchGrid}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                value={searchQuery.title}
                onChange={(e) => setSearchQuery({...searchQuery, title: e.target.value})}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>📍</span>
              <input
                type="text"
                placeholder="Location or Remote"
                value={searchQuery.location}
                onChange={(e) => setSearchQuery({...searchQuery, location: e.target.value})}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🏷️</span>
              <select
                value={searchQuery.category}
                onChange={(e) => setSearchQuery({...searchQuery, category: e.target.value})}
                style={styles.searchInput}
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(category => (
                  category !== 'all' && <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button 
              style={styles.searchButton}
              onClick={() => filterAndSortJobs()}
            >
              Search Jobs
            </button>
          </div>
          
          <div style={styles.filterControls}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Job Type:</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                style={styles.filterSelect}
              >
                <option value="all">All Types</option>
                {getUniqueJobTypes().map(type => (
                  type !== 'all' && <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Experience:</label>
              <select
                value={filters.experience}
                onChange={(e) => setFilters({...filters, experience: e.target.value})}
                style={styles.filterSelect}
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
              </select>
            </div>
            
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Posted:</label>
              <select
                value={filters.posted}
                onChange={(e) => setFilters({...filters, posted: e.target.value})}
                style={styles.filterSelect}
              >
                <option value="all">Any Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>
            
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="salary_high">Highest Salary</option>
                <option value="salary_low">Lowest Salary</option>
                <option value="applicants_high">Most Applicants</option>
              </select>
            </div>
            
            <button
              onClick={clearFilters}
              style={styles.clearButton}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{jobs.length}</span>
            <span style={styles.statLabel}>Total Jobs</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {jobs.filter(job => job.type === 'Remote').length}
            </span>
            <span style={styles.statLabel}>Remote Jobs</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {[...new Set(jobs.map(job => job.companyName))].length}
            </span>
            <span style={styles.statLabel}>Companies</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {jobs.filter(job => job.type === 'Full-time').length}
            </span>
            <span style={styles.statLabel}>Full-time</span>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div style={styles.jobsSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Available Jobs ({filteredJobs.length})
          </h2>
          <p style={styles.sectionSubtitle}>
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        </div>

        {filteredJobs.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💼</div>
            <h3 style={styles.emptyTitle}>No Jobs Found</h3>
            <p style={styles.emptyText}>Try adjusting your search criteria</p>
            <button
              onClick={clearFilters}
              style={styles.clearFiltersButton}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={styles.jobsGrid}>
            {filteredJobs.map((job, index) => {
              const category = getJobCategory(job.title);
              const isNew = (new Date() - new Date(job.postedDate)) < 7 * 24 * 60 * 60 * 1000;
              
              return (
                <div key={job.id} style={styles.jobCard}>
                  <div style={styles.jobHeader}>
                    <div style={styles.companyLogo}>
                      {job.companyName?.charAt(0) || 'C'}
                    </div>
                    <div style={styles.jobInfo}>
                      <h3 style={styles.jobTitle}>{job.title}</h3>
                      <div style={styles.companyRow}>
                        <span style={styles.companyName}>{job.companyName}</span>
                        <span style={styles.jobCategory}>{category}</span>
                      </div>
                    </div>
                    <div style={styles.jobBadges}>
                      {isNew && <span style={styles.newBadge}>NEW</span>}
                      {job.type === 'Remote' && <span style={styles.remoteBadge}>🌍 Remote</span>}
                    </div>
                  </div>
                  
                  <div style={styles.jobDetails}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>📍</span>
                      <span>{job.location}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>💰</span>
                      <span>{job.salary || 'Competitive Salary'}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>⏰</span>
                      <span>{job.type}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>📅</span>
                      <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p style={styles.jobDescription}>
                    {job.description?.substring(0, 120)}...
                  </p>
                  
                  <div style={styles.jobSkills}>
                    <span style={styles.skillsLabel}>Skills:</span>
                    <div style={styles.skillsList}>
                      {['React', 'JavaScript', 'Node.js', 'CSS', 'API']
                        .slice(0, 3)
                        .map(skill => (
                          <span key={skill} style={styles.skillTag}>
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>
                  
                  <div style={styles.jobFooter}>
                    <div style={styles.jobStats}>
                      <span style={styles.applicants}>
                        👥 {job.applicants || 0} applicants
                      </span>
                      <span style={styles.urgency}>
                        ⚡ Apply soon
                      </span>
                    </div>
                    <div style={styles.jobActions}>
                      <button
                        onClick={() => handleSaveJob(job.id)}
                        style={styles.saveButton}
                      >
                        💾 Save
                      </button>
                      <button
                        onClick={() => handleQuickApply(job)}
                        style={styles.applyButton}
                      >
                        Quick Apply
                      </button>
                      <button
                        onClick={() => navigate(`/job/${job.id}`)}
                        style={styles.detailsButton}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Job Categories */}
      <div style={styles.categoriesSection}>
        <h2 style={styles.sectionTitle}>Popular Job Categories</h2>
        <div style={styles.categoriesGrid}>
          {[
            { name: 'Frontend Development', icon: '⚛️', jobs: jobs.filter(j => getJobCategory(j.title) === 'Frontend').length },
            { name: 'Backend Development', icon: '⚙️', jobs: jobs.filter(j => getJobCategory(j.title) === 'Backend').length },
            { name: 'Full Stack', icon: '🔗', jobs: jobs.filter(j => getJobCategory(j.title) === 'Full Stack').length },
            { name: 'Mobile Development', icon: '📱', jobs: jobs.filter(j => getJobCategory(j.title) === 'Mobile').length },
            { name: 'DevOps & Cloud', icon: '☁️', jobs: jobs.filter(j => getJobCategory(j.title) === 'DevOps').length },
            { name: 'Data Science', icon: '📊', jobs: jobs.filter(j => getJobCategory(j.title) === 'Data').length },
            { name: 'UI/UX Design', icon: '🎨', jobs: jobs.filter(j => getJobCategory(j.title) === 'Design').length },
            { name: 'Project Management', icon: '📋', jobs: jobs.filter(j => getJobCategory(j.title) === 'Management').length },
          ].map(category => (
            <div
              key={category.name}
              style={styles.categoryCard}
              onClick={() => {
                const categoryLower = category.name.split(' ')[0].toLowerCase();
                setSearchQuery(prev => ({ ...prev, title: categoryLower }));
              }}
            >
              <div style={styles.categoryIcon}>{category.icon}</div>
              <h3 style={styles.categoryName}>{category.name}</h3>
              <p style={styles.categoryJobs}>{category.jobs} Jobs</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Find Your Perfect Job?</h2>
          <p style={styles.ctaText}>
            Create a free profile and get matched with opportunities that fit your skills
          </p>
          <div style={styles.ctaButtons}>
            {user ? (
              user.role === 'seeker' ? (
                <button
                  onClick={() => navigate('/seeker-dashboard')}
                  style={styles.primaryCta}
                >
                  View Your Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/company-dashboard')}
                  style={styles.primaryCta}
                >
                  Post a Job
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup?role=seeker')}
                  style={styles.primaryCta}
                >
                  Sign Up as Job Seeker
                </button>
                <button
                  onClick={() => navigate('/signup?role=company')}
                  style={styles.secondaryCta}
                >
                  Post Jobs for Free
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    background: '#f8fafc',
    minHeight: '100vh',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  heroSection: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    padding: '80px 24px',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '16px',
    '@media (max-width: 768px)': {
      fontSize: '36px',
    },
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '1.6',
  },
  filtersSection: {
    background: '#ffffff',
    padding: '32px 24px',
    marginTop: '-40px',
    marginBottom: '40px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  searchContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  searchGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: '16px',
    marginBottom: '32px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  searchBox: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '20px',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    background: '#ffffff',
  },
  searchButton: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  filterControls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: '1',
    minWidth: '150px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
  },
  filterSelect: {
    padding: '10px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    background: '#ffffff',
  },
  clearButton: {
    padding: '10px 24px',
    background: 'transparent',
    border: '2px solid #e2e8f0',
    color: '#64748b',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '24px',
  },
  statsSection: {
    padding: '40px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
  },
  statCard: {
    background: '#ffffff',
    padding: '32px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  statNumber: {
    display: 'block',
    fontSize: '48px',
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  jobsSection: {
    padding: '40px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#64748b',
  },
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '24px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  jobCard: {
    background: '#ffffff',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  jobHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '20px',
  },
  companyLogo: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    flexShrink: 0,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  companyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  companyName: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '500',
  },
  jobCategory: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  jobBadges: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end',
  },
  newBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  remoteBadge: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  jobDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
    },
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#475569',
  },
  detailIcon: {
    fontSize: '16px',
    color: '#94a3b8',
  },
  jobDescription: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  jobSkills: {
    marginBottom: '24px',
  },
  skillsLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '8px',
    display: 'block',
  },
  skillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  skillTag: {
    background: '#e2e8f0',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  jobFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  jobStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  applicants: {
    fontSize: '13px',
    color: '#64748b',
  },
  urgency: {
    fontSize: '13px',
    color: '#dc2626',
    fontWeight: '500',
  },
  jobActions: {
    display: 'flex',
    gap: '12px',
  },
  saveButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: '2px solid #e2e8f0',
    color: '#64748b',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  applyButton: {
    padding: '8px 24px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  detailsButton: {
    padding: '8px 24px',
    background: 'transparent',
    border: '2px solid #3b82f6',
    color: '#3b82f6',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    background: '#ffffff',
    borderRadius: '16px',
    border: '2px dashed #e2e8f0',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '24px',
  },
  clearFiltersButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  categoriesSection: {
    padding: '80px 24px',
    background: '#f8fafc',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginTop: '40px',
  },
  categoryCard: {
    background: '#ffffff',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  categoryIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  categoryName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  categoryJobs: {
    fontSize: '14px',
    color: '#64748b',
  },
  ctaSection: {
    padding: '80px 24px',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    textAlign: 'center',
    marginTop: '40px',
  },
  ctaContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '16px',
  },
  ctaText: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  ctaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryCta: {
    padding: '16px 48px',
    background: '#ffffff',
    color: '#1e293b',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  secondaryCta: {
    padding: '16px 48px',
    background: 'transparent',
    color: '#ffffff',
    border: '2px solid #ffffff',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, background 0.2s',
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .job-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  }
  
  .category-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
  }
  
  input:focus, select:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
`;
document.head.appendChild(styleSheet);

export default JobsList;