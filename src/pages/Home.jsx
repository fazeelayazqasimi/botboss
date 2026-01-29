import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    activeSeekers: 0,
    companiesCount: 0,
    successfulHires: 0,
    interviewCompleted: 0,
    satisfactionRate: 94
  });
  const [categories, setCategories] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    jobs: true,
    companies: true
  });
  const [searchQuery, setSearchQuery] = useState({
    title: '',
    location: ''
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const userData = localStorage.getItem('user');
    
    if (loggedIn === 'true' && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
    
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading({ stats: true, jobs: true, companies: true });
      
      await loadStatistics();
      await loadRecentJobs();
      await loadCategories();
      await loadTopCompanies();
      
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading({ stats: false, jobs: false, companies: false });
    }
  };

  const loadStatistics = async () => {
    try {
      const jobsResponse = await fetch(`${API_URL}/jobs`);
      const jobs = await jobsResponse.json();
      
      const appsResponse = await fetch(`${API_URL}/applications`);
      const applications = await appsResponse.json();
      
      const usersResponse = await fetch(`${API_URL}/users`);
      const users = await usersResponse.json();
      
      const activeJobs = jobs.filter(job => job.status === 'active').length;
      const totalApplications = applications.length;
      const shortlistedCandidates = applications.filter(app => app.status === 'shortlisted').length;
      const activeSeekers = users.filter(u => u.role === 'seeker').length;
      const companiesCount = users.filter(u => u.role === 'company').length;
      const successfulHires = applications.filter(app => app.status === 'hired').length;
      const interviewCompleted = applications.filter(app => app.interviewStatus === 'completed').length;
      
      setStats({
        activeJobs,
        totalApplications,
        shortlistedCandidates,
        activeSeekers,
        companiesCount,
        successfulHires,
        interviewCompleted,
        satisfactionRate: 94
      });
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadRecentJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs`);
      if (response.ok) {
        const jobs = await response.json();
        const recent = jobs
          .filter(job => job.status === 'active')
          .sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate))
          .slice(0, 8);
        setRecentJobs(recent);
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error);
    }
  };

  const loadCategories = () => {
    const categoriesData = [
      { name: 'IT & Software', count: 45, color: '#00ff88' },
      { name: 'Marketing', count: 32, color: '#10b981' },
      { name: 'Finance', count: 28, color: '#f59e0b' },
      { name: 'Design', count: 24, color: '#8b5cf6' },
      { name: 'Sales', count: 20, color: '#ef4444' },
      { name: 'Human Resources', count: 18, color: '#ec4899' },
      { name: 'Engineering', count: 35, color: '#06b6d4' },
      { name: 'Healthcare', count: 22, color: '#84cc16' }
    ];
    setCategories(categoriesData);
  };

  const loadTopCompanies = async () => {
    try {
      const jobsResponse = await fetch(`${API_URL}/jobs`);
      const jobs = await jobsResponse.json();
      
      const companiesMap = {};
      jobs.forEach(job => {
        if (job.companyName) {
          if (!companiesMap[job.companyName]) {
            companiesMap[job.companyName] = {
              name: job.companyName,
              jobsCount: 0,
              logo: job.companyName.charAt(0)
            };
          }
          companiesMap[job.companyName].jobsCount++;
        }
      });
      
      const companiesList = Object.values(companiesMap)
        .sort((a, b) => b.jobsCount - a.jobsCount)
        .slice(0, 6);
      
      setTopCompanies(companiesList);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.title || searchQuery.location) {
      navigate(`/jobs?title=${encodeURIComponent(searchQuery.title)}&location=${encodeURIComponent(searchQuery.location)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  };

  const handleQuickApply = (jobId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (user.role === 'seeker') {
      alert('Apply feature will be implemented!');
    } else {
      alert('Company accounts cannot apply for jobs');
    }
  };

  const getCategoryStats = (categoryName) => {
    const stats = {
      'IT & Software': { avgSalary: '$85,000', growth: '+15%' },
      'Marketing': { avgSalary: '$65,000', growth: '+12%' },
      'Finance': { avgSalary: '$75,000', growth: '+8%' },
      'Design': { avgSalary: '$70,000', growth: '+20%' },
      'Sales': { avgSalary: '$60,000', growth: '+10%' },
      'Human Resources': { avgSalary: '$55,000', growth: '+6%' },
      'Engineering': { avgSalary: '$90,000', growth: '+18%' },
      'Healthcare': { avgSalary: '$72,000', growth: '+14%' }
    };
    return stats[categoryName] || { avgSalary: '$65,000', growth: '+10%' };
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* ===== TOP NAVBAR ===== */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          <div style={styles.logoSection}>
            <div style={styles.logo}>
              <div style={styles.logoSquare}></div>
              <div style={styles.logoCircle}></div>
            </div>
            <span style={styles.logoText}>BOTBOSS</span>
          </div>
          
          {/* <div style={styles.navLinks}>
            <Link to="/" style={styles.navLink}>Home</Link>
            <Link to="/jobs" style={styles.navLink}>Jobs</Link>
            <Link to="/companies" style={styles.navLink}>Companies</Link>
            <Link to="/careers" style={styles.navLink}>Careers</Link>
            <Link to="/contact" style={styles.navLink}>Contact</Link>
          </div> */}
          
          {isLoggedIn ? (
            <div style={styles.userSection}>
              <div style={styles.userInfo}>
                <div style={styles.avatarCircle}>{user?.name?.charAt(0).toUpperCase()}</div>
                <div style={styles.userDetails}>
                  <span style={styles.userName}>{user?.name}</span>
                  <span style={styles.userRole}>
                    {user?.role === 'company' ? 'Company' : 'Job Seeker'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/dashboard')} 
                style={styles.dashboardButton}
              >
                Dashboard
              </button>
              <button onClick={handleLogout} style={styles.logoutButton}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.loginBtn}>Login</Link>
              <Link to="/signup" style={styles.signupBtn}>Sign up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            {isLoggedIn && (
              <div style={styles.welcomeBadge}>
                <span style={styles.waveEmoji}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#00ff88" strokeWidth="2"/>
                    <path d="M7 14C7 14 8.5 16 12 16C15.5 16 17 14 17 14" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 9H8.01" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 9H16.01" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span style={styles.welcomeText}>
                  Welcome back, {user?.name}! 
                  {user?.role === 'company' ? ' Ready to hire?' : ' Ready for your next opportunity?'}
                </span>
              </div>
            )}
            
            <h1 style={styles.heroTitle}>
              Find Your Perfect <span style={styles.highlightText}>Career Match</span> with AI-Powered Hiring
            </h1>
            
            <p style={styles.heroSubtitle}>
              Connect with top companies, showcase your skills through AI interviews, 
              and get hired faster than ever before.
            </p>
            
            <form onSubmit={handleSearch} style={styles.searchContainer}>
              <div style={styles.searchGrid}>
                <div style={styles.searchBox}>
                  <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#cccccc" strokeWidth="1.5"/>
                    <path d="M16 16L21 21" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Job title, keywords, or company" 
                    style={styles.searchInput}
                    value={searchQuery.title}
                    onChange={(e) => setSearchQuery({...searchQuery, title: e.target.value})}
                  />
                </div>
                
                <div style={styles.searchBox}>
                  <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none">
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#cccccc" strokeWidth="1.5"/>
                    <path d="M19 10C19 15 12 20 12 20C12 20 5 15 5 10C5 6.5 8 4 12 4C16 4 19 6.5 19 10Z" stroke="#cccccc" strokeWidth="1.5"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Location or Remote" 
                    style={styles.searchInput}
                    value={searchQuery.location}
                    onChange={(e) => setSearchQuery({...searchQuery, location: e.target.value})}
                  />
                </div>
                
                <button type="submit" style={styles.searchButton}>
                  <span>Search Jobs</span>
                  <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>
            
            <div style={styles.quickStats}>
              <span style={styles.quickStat}>
                <strong style={styles.statNumber}>{stats.activeJobs}+</strong> Active Jobs
              </span>
              <span style={styles.quickStat}>
                <strong style={styles.statNumber}>{stats.companiesCount}+</strong> Companies
              </span>
              <span style={styles.quickStat}>
                <strong style={styles.statNumber}>{stats.activeSeekers}+</strong> Active Seekers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIVE STATISTICS ===== */}
      <section style={styles.liveStatsSection}>
        <div style={styles.statsContainer}>
          {loading.stats ? (
            <div style={styles.loadingGrid}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={styles.statCardSkeleton}></div>
              ))}
            </div>
          ) : (
            <>
              <StatCard 
                value={stats.activeJobs} 
                label="Active Jobs" 
                color="#00ff88"
                trend="+12%"
              />
              <StatCard 
                value={stats.totalApplications} 
                label="Total Applications" 
                color="#10b981"
                trend="+24%"
              />
              <StatCard 
                value={stats.shortlistedCandidates} 
                label="Shortlisted" 
                color="#f59e0b"
                trend="+18%"
              />
              <StatCard 
                value={stats.activeSeekers} 
                label="Active Seekers" 
                color="#8b5cf6"
                trend="+15%"
              />
              <StatCard 
                value={stats.companiesCount} 
                label="Companies" 
                color="#ef4444"
                trend="+8%"
              />
              <StatCard 
                value={stats.successfulHires} 
                label="Successful Hires" 
                color="#ec4899"
                trend="+32%"
              />
              <StatCard 
                value={stats.interviewCompleted} 
                label="AI Interviews" 
                color="#06b6d4"
                trend="+45%"
              />
              <StatCard 
                value={`${stats.satisfactionRate}%`} 
                label="Satisfaction Rate" 
                color="#84cc16"
                trend="+5%"
              />
            </>
          )}
        </div>
      </section>

      {/* ===== JOB CATEGORIES ===== */}
      <section style={styles.categoriesSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Explore Job Categories</h2>
            <p style={styles.sectionSubtitle}>
              Browse jobs by industry and find your perfect match
            </p>
          </div>
          
          <div style={styles.categoriesGrid}>
            {categories.map((category, index) => {
              const categoryStats = getCategoryStats(category.name);
              return (
                <div 
                  key={index} 
                  style={styles.categoryCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={{...styles.categoryIcon, background: category.color}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 21V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12L20 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={styles.categoryContent}>
                    <h3 style={styles.categoryName}>{category.name}</h3>
                    <div style={styles.categoryStatsContainer}>
                      <span style={styles.categoryStat}>
                        <strong>{category.count}</strong> Jobs
                      </span>
                      <span style={styles.categoryStat}>
                        Avg: {categoryStats.avgSalary}
                      </span>
                      <span style={{...styles.categoryStat, color: '#00ff88'}}>
                        {categoryStats.growth}
                      </span>
                    </div>
                    <button 
                      style={styles.browseButton}
                      onClick={() => navigate(`/jobs?category=${encodeURIComponent(category.name)}`)}
                    >
                      Browse Jobs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== RECENT JOBS ===== */}
      <section style={styles.recentJobsSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionHeaderLeft}>
              <h2 style={styles.sectionTitle}>Recently Posted Jobs</h2>
              <p style={styles.sectionSubtitle}>
                Latest opportunities from top companies
              </p>
            </div>
            <button 
              style={styles.viewAllButton}
              onClick={() => navigate('/jobs')}
            >
              View All Jobs
            </button>
          </div>
          
          {loading.jobs ? (
            <div style={styles.jobsGrid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={styles.jobCardSkeleton}></div>
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="16" width="48" height="36" rx="4" stroke="#cccccc" strokeWidth="2"/>
                  <rect x="16" y="24" width="32" height="4" rx="2" fill="#cccccc" opacity="0.3"/>
                  <rect x="16" y="32" width="24" height="4" rx="2" fill="#cccccc" opacity="0.3"/>
                  <rect x="16" y="40" width="20" height="4" rx="2" fill="#cccccc" opacity="0.3"/>
                </svg>
              </div>
              <h3 style={styles.emptyTitle}>No Jobs Posted Yet</h3>
              <p style={styles.emptyText}>Be the first to post a job!</p>
            </div>
          ) : (
            <div style={styles.jobsGrid}>
              {recentJobs.map((job, index) => (
                <div 
                  key={index} 
                  style={styles.jobCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={styles.jobCardHeader}>
                    <div style={{...styles.companyLogo, background: '#00ff88'}}>
                      {job.companyName?.charAt(0) || 'C'}
                    </div>
                    <div style={styles.jobCardInfo}>
                      <h3 style={styles.jobCardTitle}>{job.title}</h3>
                      <p style={styles.jobCardCompany}>{job.companyName}</p>
                    </div>
                    <span style={styles.jobBadge}>New</span>
                  </div>
                  
                  <div style={styles.jobCardDetails}>
                    <div style={styles.jobCardDetail}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 8.5C9.10457 8.5 10 7.60457 10 6.5C10 5.39543 9.10457 4.5 8 4.5C6.89543 4.5 6 5.39543 6 6.5C6 7.60457 6.89543 8.5 8 8.5Z" stroke="#00ff88" strokeWidth="1.2"/>
                        <path d="M13.5 6.5C13.5 11 8 14 8 14C8 14 2.5 11 2.5 6.5C2.5 4.5 4 2.5 8 2.5C12 2.5 13.5 4.5 13.5 6.5Z" stroke="#00ff88" strokeWidth="1.2"/>
                      </svg>
                      <span>{job.location}</span>
                    </div>
                    <div style={styles.jobCardDetail}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="4" width="12" height="10" rx="2" stroke="#00ff88" strokeWidth="1.2"/>
                        <path d="M5 2V6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M11 2V6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      <span>{job.type}</span>
                    </div>
                    <div style={styles.jobCardDetail}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M11 5.5L8 3L5 5.5" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 10.5L8 13L11 10.5" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{job.salary}</span>
                    </div>
                    <div style={styles.jobCardDetail}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.5" stroke="#00ff88" strokeWidth="1.2"/>
                        <path d="M8 4V8L10 10" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p style={styles.jobCardDescription}>
                    {job.description?.substring(0, 100)}...
                  </p>
                  
                  <div style={styles.jobCardActions}>
                    <button 
                      style={styles.quickApplyButton}
                      onClick={() => handleQuickApply(job.id)}
                    >
                      Quick Apply
                    </button>
                    <button 
                      style={styles.viewDetailsButton}
                      onClick={() => navigate(`/job/${job.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== TOP COMPANIES ===== */}
      <section style={styles.companiesSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Top Hiring Companies</h2>
            <p style={styles.sectionSubtitle}>
              Leading companies actively hiring on our platform
            </p>
          </div>
          
          {loading.companies ? (
            <div style={styles.companiesGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={styles.companyCardSkeleton}></div>
              ))}
            </div>
          ) : (
            <div style={styles.companiesGrid}>
              {topCompanies.map((company, index) => (
                <div 
                  key={index} 
                  style={styles.companyCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={styles.companyLogoLarge}>
                    {company.logo}
                  </div>
                  <h3 style={styles.companyNameText}>{company.name}</h3>
                  <p style={styles.companyJobs}>
                    {company.jobsCount} Open Positions
                  </p>
                  <button 
                    style={styles.viewCompanyButton}
                    onClick={() => navigate(`/company/${company.name}`)}
                  >
                    View Jobs
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={styles.howItWorksSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>How It Works</h2>
            <p style={styles.sectionSubtitle}>
              Get hired in 4 simple steps with our AI-powered platform
            </p>
          </div>
          
          <div style={styles.stepsContainer}>
            <div style={styles.stepCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.stepTitle}>Create Profile</h3>
              <p style={styles.stepDescription}>
                Sign up and build your professional profile with skills and experience
              </p>
            </div>
            
            <div style={styles.stepArrow}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 5L21 12L14 19" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div style={styles.stepCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.stepTitle}>Browse & Apply</h3>
              <p style={styles.stepDescription}>
                Explore thousands of jobs and apply with one click
              </p>
            </div>
            
            <div style={styles.stepArrow}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 5L21 12L14 19" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div style={styles.stepCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.stepTitle}>AI Interview</h3>
              <p style={styles.stepDescription}>
                Complete AI-powered video interviews at your convenience
              </p>
            </div>
            
            <div style={styles.stepArrow}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 5L21 12L14 19" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div style={styles.stepCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.stepNumber}>4</div>
              <h3 style={styles.stepTitle}>Get Hired</h3>
              <p style={styles.stepDescription}>
                Receive offers and start your new career journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={styles.testimonialsSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Success Stories</h2>
            <p style={styles.sectionSubtitle}>
              Hear from candidates and companies who found success
            </p>
          </div>
          
          <div style={styles.testimonialsGrid}>
            <div style={styles.testimonialCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.testimonialContent}>
                "Found my dream job in 2 weeks! The AI interview helped me showcase my skills better than any traditional interview."
              </div>
              <div style={styles.testimonialAuthor}>
                <div style={styles.authorAvatar}>A</div>
                <div>
                  <h4 style={styles.authorName}>Ahmed Khan</h4>
                  <p style={styles.authorRole}>Senior Developer at TechNova</p>
                </div>
              </div>
            </div>
            
            <div style={styles.testimonialCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.testimonialContent}>
                "Hired 5 amazing developers in one month. The AI screening saved us 80% of recruitment time."
              </div>
              <div style={styles.testimonialAuthor}>
                <div style={styles.authorAvatar}>S</div>
                <div>
                  <h4 style={styles.authorName}>Sara Ahmed</h4>
                  <p style={styles.authorRole}>HR Director at DevCore</p>
                </div>
              </div>
            </div>
            
            <div style={styles.testimonialCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.testimonialContent}>
                "As a fresh graduate, I struggled with interviews. The AI practice interviews boosted my confidence."
              </div>
              <div style={styles.testimonialAuthor}>
                <div style={styles.authorAvatar}>B</div>
                <div>
                  <h4 style={styles.authorName}>Bilal Raza</h4>
                  <p style={styles.authorRole}>Junior Frontend Developer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContainer}>
          <h2 style={styles.ctaTitle}>
            Ready to Transform Your Career Journey?
          </h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of professionals and companies using our platform
          </p>
          <div style={styles.ctaButtons}>
            {isLoggedIn ? (
              <button 
                style={styles.primaryCta} 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  style={styles.primaryCta} 
                  onClick={() => navigate('/signup?role=seeker')}
                >
                  Start Job Search
                </button>
                <button 
                  style={styles.secondaryCta}
                  onClick={() => navigate('/signup?role=company')}
                >
                  Post Jobs Free
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerTop}>
            <div style={styles.footerBrand}>
              <div style={styles.footerLogo}>
                <div style={styles.logo}>
                  <div style={styles.logoSquare}></div>
                  <div style={styles.logoCircle}></div>
                </div>
                <span style={styles.logoText}>BOTBOSS</span>
              </div>
              <p style={styles.footerTagline}>
                AI-Powered Hiring Platform connecting talent with opportunity
              </p>
              <div style={styles.footerStats}>
                <div style={styles.footerStat}>
                  <strong style={styles.footerStatNumber}>{stats.activeJobs}</strong>
                  <span>Active Jobs</span>
                </div>
                <div style={styles.footerStat}>
                  <strong style={styles.footerStatNumber}>{stats.companiesCount}</strong>
                  <span>Companies</span>
                </div>
                <div style={styles.footerStat}>
                  <strong style={styles.footerStatNumber}>{stats.activeSeekers}</strong>
                  <span>Job Seekers</span>
                </div>
              </div>
            </div>
            
            <div style={styles.footerLinks}>
              <div style={styles.footerColumn}>
                <h4 style={styles.footerHeading}>For Job Seekers</h4>
                <a style={styles.footerLink}>Browse Jobs</a>
                <a style={styles.footerLink}>Career Advice</a>
                <a style={styles.footerLink}>Resume Builder</a>
                <a style={styles.footerLink}>Interview Prep</a>
              </div>
              
              <div style={styles.footerColumn}>
                <h4 style={styles.footerHeading}>For Companies</h4>
                <a style={styles.footerLink}>Post Jobs</a>
                <a style={styles.footerLink}>Talent Search</a>
                <a style={styles.footerLink}>Employer Branding</a>
                <a style={styles.footerLink}>Pricing</a>
              </div>
              
              <div style={styles.footerColumn}>
                <h4 style={styles.footerHeading}>Resources</h4>
                <a style={styles.footerLink}>Blog</a>
                <a style={styles.footerLink}>Help Center</a>
                <a style={styles.footerLink}>Community</a>
                <a style={styles.footerLink}>API Docs</a>
              </div>
              
              <div style={styles.footerColumn}>
                <h4 style={styles.footerHeading}>Company</h4>
                <a style={styles.footerLink}>About Us</a>
                <a style={styles.footerLink}>Careers</a>
                <a style={styles.footerLink}>Contact</a>
                <a style={styles.footerLink}>Privacy Policy</a>
              </div>
            </div>
          </div>
          
          <div style={styles.footerBottom}>
            <p style={styles.copyright}>
              © {new Date().getFullYear()} BOTBOSS. All rights reserved.
            </p>
            <div style={styles.footerSocial}>
              <span style={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M23 3.00005C22.0424 3.67552 20.9821 4.19216 19.86 4.53005C19.2577 3.83756 18.4573 3.34674 17.567 3.12397C16.6767 2.90121 15.7395 2.95724 14.8821 3.2845C14.0247 3.61176 13.2884 4.19445 12.773 4.95376C12.2575 5.71308 11.9877 6.61238 12 7.53005V8.53005C10.2426 8.57561 8.50127 8.18586 6.93101 7.39549C5.36074 6.60512 4.01032 5.43868 3 4.00005C3 4.00005 -1 13 8 17C5.94053 18.398 3.48716 19.099 1 19C10 24 21 19 21 7.50005C20.9991 7.2215 20.9723 6.94364 20.92 6.67005C21.9406 5.66354 22.6608 4.39276 23 3.00005Z" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 9H2V21H6V9Z" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="4" cy="4" r="2" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="#cccccc" strokeWidth="1.5"/>
                  <circle cx="15.5" cy="8.5" r="1.5" fill="#cccccc"/>
                  <path d="M16 21H8C4.68629 21 2 18.3137 2 15V8C2 4.68629 4.68629 2 8 2H16C19.3137 2 21.9999 4.68629 21.9999 8V15C22 18.3137 19.3137 21 16 21Z" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ===== COMPONENTS ===== */

const StatCard = ({ value, label, color, trend }) => (
  <div style={styles.statCardStyle}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    }}
  >
    <div style={styles.statContentStyle}>
      <h3 style={styles.statValueStyle}>{value}</h3>
      <p style={styles.statLabelStyle}>{label}</p>
      <span style={{...styles.trendStyle, color}}>{trend}</span>
    </div>
    <div style={{...styles.statLine, background: color}} />
  </div>
);

/* ===== STYLES ===== */

const styles = {
  pageContainer: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: "#0a0a0a",
    color: "#ffffff",
    minHeight: "100vh",
  },
  
  // Navbar
  navbar: {
    background: "#1a1a1a",
    borderBottom: "1px solid #2a2a2a",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  
  navContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
  },
  
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  logo: {
    position: "relative",
    width: "40px",
    height: "40px",
  },
  
  logoSquare: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "32px",
    height: "32px",
    border: "2px solid #00ff88",
    borderRadius: "4px",
  },
  
  logoCircle: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "16px",
    height: "16px",
    border: "2px solid #00ff88",
    borderRadius: "50%",
  },
  
  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  navLinks: {
    display: "flex",
    gap: "32px",
    flex: 1,
    justifyContent: "center",
  },
  
  navLink: {
    textDecoration: "none",
    color: "#cccccc",
    fontWeight: "500",
    fontSize: "15px",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 16px",
    background: "#0a0a0a",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
  },
  
  avatarCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
  },
  
  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  
  userName: {
    fontSize: "14px",
    fontWeight: "600",
  },
  
  userRole: {
    fontSize: "12px",
    color: "#cccccc",
  },
  
  dashboardButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  logoutButton: {
    padding: "10px",
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#cccccc",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  
  authButtons: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  
  loginBtn: {
    textDecoration: "none",
    color: "#ffffff",
    fontWeight: "500",
    fontSize: "15px",
    padding: "10px 20px",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  
  signupBtn: {
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    padding: "12px 28px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
    transition: "all 0.2s",
  },
  
  // Hero Section
  heroSection: {
    padding: "100px 24px",
    background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
  },
  
  heroContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  
  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  },
  
  welcomeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 24px",
    background: "rgba(0, 255, 136, 0.1)",
    borderRadius: "50px",
    marginBottom: "32px",
    border: "1px solid rgba(0, 255, 136, 0.2)",
  },
  
  waveEmoji: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  welcomeText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#00ff88",
  },
  
  heroTitle: {
    fontSize: "56px",
    fontWeight: "800",
    lineHeight: "1.1",
    marginBottom: "24px",
    background: "linear-gradient(135deg, #ffffff 0%, #cccccc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  highlightText: {
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  heroSubtitle: {
    fontSize: "18px",
    color: "#cccccc",
    marginBottom: "48px",
    lineHeight: "1.6",
  },
  
  searchContainer: {
    marginBottom: "48px",
  },
  
  searchGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "16px",
  },
  
  searchBox: {
    position: "relative",
  },
  
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "20px",
    height: "20px",
  },
  
  searchInput: {
    width: "100%",
    padding: "16px 16px 16px 48px",
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    fontSize: "16px",
    color: "#ffffff",
    outline: "none",
    transition: "all 0.2s",
  },
  
  searchButton: {
    padding: "16px 32px",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  
  buttonIcon: {
    width: "18px",
    height: "18px",
  },
  
  quickStats: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    flexWrap: "wrap",
  },
  
  quickStat: {
    padding: "12px 24px",
    background: "#1a1a1a",
    color: "#cccccc",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #2a2a2a",
  },
  
  statNumber: {
    color: "#ffffff",
    marginRight: "8px",
  },
  
  // Live Stats Section
  liveStatsSection: {
    padding: "80px 24px",
    background: "#0a0a0a",
  },
  
  statsContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
  },
  
  loadingGrid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
  },
  
  statCardSkeleton: {
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "32px",
    animation: "pulse 2s infinite",
    border: "1px solid #2a2a2a",
  },
  
  statCardStyle: {
    background: "#1a1a1a",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  
  statContentStyle: {
    position: "relative",
    zIndex: 2,
  },
  
  statValueStyle: {
    fontSize: "36px",
    fontWeight: "800",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #ffffff 0%, #666 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  statLabelStyle: {
    fontSize: "14px",
    color: "#cccccc",
    margin: "0 0 12px 0",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  
  trendStyle: {
    fontSize: "14px",
    fontWeight: "600",
    background: "rgba(0, 255, 136, 0.1)",
    padding: "4px 12px",
    borderRadius: "20px",
    display: "inline-block",
  },
  
  statLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "3px",
    transition: "all 0.3s",
  },
  
  // Categories Section
  categoriesSection: {
    padding: "80px 24px",
    background: "#0a0a0a",
  },
  
  sectionContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  
  sectionHeader: {
    marginBottom: "48px",
    textAlign: "center",
    color: "#fff !important",
  },
  
  
  sectionTitle: {
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#fff !important" ,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  sectionSubtitle: {
    fontSize: "18px",
    color: "#cccccc",
    maxWidth: "600px",
    margin: "0 auto",
  },
  
  categoriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  
  categoryCard: {
    background: "#1a1a1a",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  
  categoryIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  
  categoryContent: {
    flex: 1,
  },
  
  categoryName: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 12px 0",
    color: "#ffffff",
  },
  
  categoryStatsContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  
  categoryStat: {
    fontSize: "14px",
    color: "#cccccc",
  },
  
  browseButton: {
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#00ff88",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  
  // Recent Jobs Section
  recentJobsSection: {
    padding: "80px 24px",
    background: "#0a0a0a",
  },
  
  sectionHeaderLeft: {
    textAlign: "left",
  },
  
  viewAllButton: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid #00ff88",
    color: "#00ff88",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  jobsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "24px",
  },
  
  jobCardSkeleton: {
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "32px",
    animation: "pulse 2s infinite",
    height: "250px",
    border: "1px solid #2a2a2a",
  },
  
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#1a1a1a",
    borderRadius: "16px",
    border: "1px dashed #2a2a2a",
  },
  
  emptyIcon: {
    marginBottom: "20px",
    opacity: 0.5,
  },
  
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#ffffff",
  },
  
  emptyText: {
    fontSize: "16px",
    color: "#cccccc",
    marginBottom: "24px",
  },
  
  jobCard: {
    background: "#1a1a1a",
    padding: "28px",
    borderRadius: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s",
  },
  
  jobCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },
  
  companyLogo: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0a0a0a",
    fontWeight: "700",
    fontSize: "24px",
    flexShrink: 0,
  },
  
  jobCardInfo: {
    flex: 1,
  },
  
  jobCardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 6px 0",
    color: "#ffffff",
  },
  
  jobCardCompany: {
    fontSize: "14px",
    color: "#cccccc",
    margin: 0,
  },
  
  jobBadge: {
    background: "rgba(0, 255, 136, 0.1)",
    color: "#00ff88",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid rgba(0, 255, 136, 0.2)",
  },
  
  jobCardDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  
  jobCardDetail: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#cccccc",
  },
  
  jobCardDescription: {
    fontSize: "14px",
    color: "#cccccc",
    lineHeight: "1.6",
    marginBottom: "24px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  
  jobCardActions: {
    display: "flex",
    gap: "12px",
  },
  
  quickApplyButton: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  viewDetailsButton: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#cccccc",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  // Companies Section
  companiesSection: {
    padding: "80px 24px",
    background: "#0a0a0a",
  },
  
  companiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "24px",
  },
  
  companyCardSkeleton: {
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "32px",
    animation: "pulse 2s infinite",
    height: "200px",
    border: "1px solid #2a2a2a",
  },
  
  companyCard: {
    background: "#1a1a1a",
    padding: "32px 24px",
    borderRadius: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  
  companyLogoLarge: {
    width: "64px",
    height: "64px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0a0a0a",
    fontWeight: "700",
    fontSize: "28px",
    margin: "0 auto 16px",
  },
  
  companyNameText: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 8px 0",
    color: "#ffffff",
  },
  
  companyJobs: {
    fontSize: "14px",
    color: "#cccccc",
    margin: "0 0 20px 0",
  },
  
  viewCompanyButton: {
    padding: "10px 20px",
    background: "transparent",
    border: "1px solid #00ff88",
    color: "#00ff88",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
  },
  
  // How It Works Section
  howItWorksSection: {
    padding: "80px 24px",
    background: "#0a0a0a",
  },
  
  stepsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    flexWrap: "wrap",
  },
  
  stepCard: {
    background: "#1a1a1a",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    flex: "1",
    minWidth: "200px",
    transition: "all 0.3s",
  },
  
  stepNumber: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 auto 20px",
  },
  
  stepTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 12px 0",
    color: "#ffffff",
  },
  
  stepDescription: {
    fontSize: "14px",
    color: "#cccccc",
    lineHeight: "1.6",
  },
  
  stepArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Testimonials Section
  testimonialsSection: {
    padding: "80px 24px",
    background: "#0a0a0a",
  },
  
  testimonialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  
  testimonialCard: {
    background: "#1a1a1a",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s",
  },
  
  testimonialContent: {
    fontSize: "16px",
    color: "#cccccc",
    lineHeight: "1.6",
    marginBottom: "24px",
    position: "relative",
    paddingLeft: "24px",
  },
  
  testimonialAuthor: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  
  authorAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "20px",
    flexShrink: 0,
  },
  
  authorName: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 4px 0",
    color: "#ffffff",
  },
  
  authorRole: {
    fontSize: "14px",
    color: "#cccccc",
    margin: 0,
  },
  
  // CTA Section
  ctaSection: {
    padding: "100px 24px",
    background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
    borderTop: "1px solid #2a2a2a",
    borderBottom: "1px solid #2a2a2a",
  },
  
  ctaContainer: {
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  },
  
  ctaTitle: {
    fontSize: "48px",
    fontWeight: "700",
    marginBottom: "16px",
    background: "linear-gradient(135deg, #ffffff 0%, #cccccc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  ctaSubtitle: {
    fontSize: "18px",
    color: "#cccccc",
    marginBottom: "40px",
    lineHeight: "1.6",
  },
  
  ctaButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  
  primaryCta: {
    padding: "16px 40px",
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  secondaryCta: {
    padding: "16px 40px",
    background: "transparent",
    color: "#00ff88",
    border: "1px solid #00ff88",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  // Footer
  footer: {
    background: "#0a0a0a",
    padding: "60px 24px 24px",
  },
  
  footerContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  
  footerTop: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "40px",
    marginBottom: "40px",
  },
  
  footerBrand: {
    flex: "1 1 300px",
  },
  
  footerLogo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  
  footerTagline: {
    color: "#cccccc",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  
  footerStats: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  
  footerStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 16px",
    background: "#1a1a1a",
    borderRadius: "8px",
    minWidth: "100px",
    border: "1px solid #2a2a2a",
  },
  
  footerStatNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "4px",
  },
  
  footerLinks: {
    display: "flex",
    gap: "60px",
    flexWrap: "wrap",
  },
  
  footerColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "150px",
  },
  
  footerHeading: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#ffffff",
  },
  
  footerLink: {
    color: "#cccccc",
    fontSize: "14px",
    cursor: "pointer",
    transition: "color 0.2s",
    textDecoration: "none",
  },
  
  footerBottom: {
    paddingTop: "24px",
    borderTop: "1px solid #2a2a2a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  
  copyright: {
    color: "#cccccc",
    fontSize: "14px",
  },
  
  footerSocial: {
    display: "flex",
    gap: "16px",
  },
  
  socialIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  input:focus, textarea:focus, select:focus {
    border-color: #00ff88 !important;
    box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.1) !important;
    outline: none;
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 255, 136, 0.2) !important;
  }
  
  .category-card:hover,
  .job-card:hover,
  .company-card:hover,
  .testimonial-card:hover,
  .step-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 255, 136, 0.1) !important;
    border-color: #00ff88 !important;
  }
  
  a:hover {
    color: #00ff88 !important;
  }
  
  .footer-link:hover {
    color: #ffffff !important;
  }
  
  .social-icon:hover {
    transform: translateY(-2px);
  }
  
  .social-icon:hover svg {
    stroke: #00ff88;
  }
  
  .nav-link:hover {
    background: rgba(0, 255, 136, 0.1);
    color: #00ff88 !important;
  }
  
  .stat-card:hover {
    border-color: #00ff88 !important;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #2a2a2a;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #00ff88;
  }
  
  select option {
    background: #1a1a1a;
    color: #ffffff;
  }
  
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: #ffffff;
    -webkit-box-shadow: 0 0 0px 1000px #0a0a0a inset;
    transition: background-color 5000s ease-in-out 0s;
  }
`
document.head.appendChild(styleSheet);

export default Home;