import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CompaniesList = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    industry: 'all',
    size: 'all',
    location: 'all'
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, filters]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      // Load users to get companies
      const usersResponse = await fetch(`${API_URL}/users`);
      const users = await usersResponse.json();
      
      // Load jobs to get company job counts
      const jobsResponse = await fetch(`${API_URL}/jobs`);
      const jobs = await jobsResponse.json();
      
      // Filter only companies
      const companyUsers = users.filter(user => user.role === 'company');
      
      // Enrich company data with job counts and details
      const enrichedCompanies = companyUsers.map(company => {
        const companyJobs = jobs.filter(job => job.companyId === company.id);
        const activeJobs = companyJobs.filter(job => job.status === 'active');
        
        // Get company details from jobs
        const companyJob = jobs.find(job => job.companyId === company.id);
        
        return {
          id: company.id,
          name: company.companyName || company.name,
          email: company.email,
          logo: company.companyName?.charAt(0) || 'C',
          description: companyJob?.description || 'Leading company in their industry',
          location: companyJob?.location || 'Multiple Locations',
          industry: getIndustryFromName(company.companyName || company.name),
          size: getCompanySize(companyJobs.length),
          website: company.website || '#',
          jobsCount: activeJobs.length,
          totalJobs: companyJobs.length,
          activeJobs: activeJobs.length,
          rating: 4.5 + Math.random() * 0.5, // Random rating for demo
          founded: 2000 + Math.floor(Math.random() * 25) // Random founding year
        };
      });
      
      setCompanies(enrichedCompanies);
      setFilteredCompanies(enrichedCompanies);
      
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIndustryFromName = (name) => {
    const industries = [
      'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
      'Manufacturing', 'Consulting', 'Media', 'Retail', 'Automotive'
    ];
    
    if (name.toLowerCase().includes('tech') || name.toLowerCase().includes('soft')) return 'Technology';
    if (name.toLowerCase().includes('bank') || name.toLowerCase().includes('finan')) return 'Finance';
    if (name.toLowerCase().includes('health') || name.toLowerCase().includes('med')) return 'Healthcare';
    if (name.toLowerCase().includes('shop') || name.toLowerCase().includes('store')) return 'E-commerce';
    
    return industries[Math.floor(Math.random() * industries.length)];
  };

  const getCompanySize = (jobsCount) => {
    if (jobsCount > 50) return 'Large (500+ employees)';
    if (jobsCount > 20) return 'Medium (100-500 employees)';
    if (jobsCount > 5) return 'Small (50-100 employees)';
    return 'Startup (1-50 employees)';
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(term) ||
        company.industry.toLowerCase().includes(term) ||
        company.location.toLowerCase().includes(term) ||
        company.description.toLowerCase().includes(term)
      );
    }

    // Industry filter
    if (filters.industry !== 'all') {
      filtered = filtered.filter(company => company.industry === filters.industry);
    }

    // Size filter
    if (filters.size !== 'all') {
      filtered = filtered.filter(company => {
        if (filters.size === 'large') return company.size.includes('Large');
        if (filters.size === 'medium') return company.size.includes('Medium');
        if (filters.size === 'small') return company.size.includes('Small');
        if (filters.size === 'startup') return company.size.includes('Startup');
        return true;
      });
    }

    // Location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(company => company.location.toLowerCase().includes(filters.location.toLowerCase()));
    }

    setFilteredCompanies(filtered);
  };

  const getUniqueIndustries = () => {
    const industries = companies.map(c => c.industry);
    return ['all', ...new Set(industries)].filter(Boolean);
  };

  const getUniqueLocations = () => {
    const locations = companies.map(c => c.location);
    return ['all', ...new Set(locations)].filter(Boolean);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Discover Top Companies</h1>
          <p style={styles.heroSubtitle}>
            Explore {companies.length}+ companies actively hiring on our platform
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.searchContainer}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search companies by name, industry, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.filterRow}>
            <select
              value={filters.industry}
              onChange={(e) => setFilters({...filters, industry: e.target.value})}
              style={styles.filterSelect}
            >
              <option value="all">All Industries</option>
              {getUniqueIndustries().map(industry => (
                industry !== 'all' && <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            
            <select
              value={filters.size}
              onChange={(e) => setFilters({...filters, size: e.target.value})}
              style={styles.filterSelect}
            >
              <option value="all">All Company Sizes</option>
              <option value="startup">Startup</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            
            <select
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              style={styles.filterSelect}
            >
              <option value="all">All Locations</option>
              {getUniqueLocations().map(location => (
                location !== 'all' && <option key={location} value={location}>{location}</option>
              ))}
            </select>
            
            <button
              onClick={() => setFilters({ industry: 'all', size: 'all', location: 'all' })}
              style={styles.clearButton}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{companies.length}</span>
            <span style={styles.statLabel}>Total Companies</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {companies.reduce((sum, company) => sum + company.activeJobs, 0)}
            </span>
            <span style={styles.statLabel}>Active Jobs</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {companies.filter(c => c.size.includes('Large')).length}
            </span>
            <span style={styles.statLabel}>Large Companies</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {companies.filter(c => c.industry === 'Technology').length}
            </span>
            <span style={styles.statLabel}>Tech Companies</span>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div style={styles.companiesSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Featured Companies ({filteredCompanies.length})
          </h2>
          <p style={styles.sectionSubtitle}>
            Discover opportunities at leading organizations
          </p>
        </div>

        {filteredCompanies.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏢</div>
            <h3 style={styles.emptyTitle}>No Companies Found</h3>
            <p style={styles.emptyText}>Try adjusting your search criteria</p>
          </div>
        ) : (
          <div style={styles.companiesGrid}>
            {filteredCompanies.map((company, index) => (
              <div key={company.id} style={styles.companyCard}>
                <div style={styles.companyHeader}>
                  <div style={styles.companyLogo}>
                    {company.logo}
                  </div>
                  <div style={styles.companyInfo}>
                    <h3 style={styles.companyName}>{company.name}</h3>
                    <div style={styles.companyMeta}>
                      <span style={styles.companyIndustry}>{company.industry}</span>
                      <span style={styles.companySize}>{company.size}</span>
                    </div>
                    <div style={styles.rating}>
                      {'⭐'.repeat(Math.floor(company.rating))}
                      <span style={styles.ratingText}>{company.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <p style={styles.companyDescription}>
                  {company.description}
                </p>
                
                <div style={styles.companyDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailIcon}>📍</span>
                    <span>{company.location}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailIcon}>💼</span>
                    <span>{company.activeJobs} Active Jobs</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailIcon}>🏢</span>
                    <span>Founded {company.founded}</span>
                  </div>
                </div>
                
                <div style={styles.companyActions}>
                  <button
                    onClick={() => navigate(`/company/${company.id}`)}
                    style={styles.viewJobsButton}
                  >
                    View Jobs ({company.activeJobs})
                  </button>
                  <button
                    onClick={() => navigate(`/company-details/${company.id}`)}
                    style={styles.viewCompanyButton}
                  >
                    View Company
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Industry Spotlight */}
      <div style={styles.industriesSection}>
        <h2 style={styles.sectionTitle}>Popular Industries</h2>
        <div style={styles.industriesGrid}>
          {['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Manufacturing'].map(industry => {
            const industryCompanies = companies.filter(c => c.industry === industry);
            const industryJobs = industryCompanies.reduce((sum, c) => sum + c.activeJobs, 0);
            
            return (
              <div key={industry} style={styles.industryCard}>
                <div style={styles.industryIcon}>
                  {industry === 'Technology' && '💻'}
                  {industry === 'Finance' && '💰'}
                  {industry === 'Healthcare' && '🏥'}
                  {industry === 'E-commerce' && '🛒'}
                  {industry === 'Education' && '🎓'}
                  {industry === 'Manufacturing' && '🏭'}
                </div>
                <h3 style={styles.industryName}>{industry}</h3>
                <p style={styles.industryStats}>
                  {industryCompanies.length} Companies • {industryJobs} Jobs
                </p>
                <button
                  onClick={() => {
                    setFilters({...filters, industry});
                    setSearchTerm('');
                  }}
                  style={styles.exploreButton}
                >
                  Explore
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Is Your Company Hiring?</h2>
        <p style={styles.ctaText}>
          Join thousands of companies finding top talent on our platform
        </p>
        <button
          onClick={() => navigate('/signup?role=company')}
          style={styles.ctaButton}
        >
          Post Jobs for Free
        </button>
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
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '40px',
  },
  searchContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '24px',
  },
  searchIcon: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '20px',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '16px 20px 16px 52px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '12px 20px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    background: '#ffffff',
    minWidth: '200px',
    flex: '1',
  },
  clearButton: {
    padding: '12px 24px',
    background: 'transparent',
    border: '2px solid #e2e8f0',
    color: '#64748b',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
  companiesSection: {
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
  companiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  companyCard: {
    background: '#ffffff',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  companyHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '20px',
  },
  companyLogo: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    flexShrink: 0,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  companyMeta: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  companyIndustry: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  companySize: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  ratingText: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '600',
  },
  companyDescription: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  companyDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#475569',
  },
  detailIcon: {
    fontSize: '16px',
    color: '#94a3b8',
  },
  companyActions: {
    display: 'flex',
    gap: '12px',
  },
  viewJobsButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  viewCompanyButton: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: '2px solid #e2e8f0',
    color: '#64748b',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
  industriesSection: {
    padding: '80px 24px',
    background: '#f8fafc',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  industriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginTop: '40px',
  },
  industryCard: {
    background: '#ffffff',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    transition: 'transform 0.2s',
  },
  industryIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  industryName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
  },
  industryStats: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '20px',
  },
  exploreButton: {
    padding: '10px 24px',
    background: 'transparent',
    border: '2px solid #3b82f6',
    color: '#3b82f6',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  ctaSection: {
    padding: '80px 24px',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    textAlign: 'center',
    marginTop: '40px',
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
    maxWidth: '600px',
    margin: '0 auto 32px',
    lineHeight: '1.6',
  },
  ctaButton: {
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
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .company-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  }
  
  input:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
`;
document.head.appendChild(styleSheet);

export default CompaniesList;