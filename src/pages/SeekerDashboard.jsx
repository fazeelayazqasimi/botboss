import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SeekerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviewsCompleted: 0,
    pending: 0,
    shortlisted: 0
  });
  const [loading, setLoading] = useState({
    jobs: false,
    applications: false,
    profile: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: 'all',
    type: 'all',
    salary: 'all'
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'seeker') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    loadSeekerData(parsedUser.id);
  }, [navigate]);

  const loadSeekerData = async (seekerId) => {
    try {
      setLoading(prev => ({ ...prev, jobs: true }));
      
      const jobsResponse = await fetch(`${API_URL}/jobs`);
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setAvailableJobs(jobsData);
        await loadSeekerProfile(seekerId, jobsData);
      }
      
      await loadApplications(seekerId);
      
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  };

  const loadSeekerProfile = async (seekerId, jobsData) => {
    try {
      const profileData = localStorage.getItem(`profile_${seekerId}`);
      
      if (profileData) {
        const parsedProfile = JSON.parse(profileData);
        setProfile(parsedProfile);
        
        if (parsedProfile.skills) {
          const matched = calculateJobMatches(jobsData, parsedProfile);
          setMatchedJobs(matched);
        }
      } else {
        const emptyProfile = {
          seekerId: seekerId,
          skills: [],
          experience: '',
          education: '',
          location: '',
          preferredJobTypes: [],
          salaryExpectation: '',
          resumeUrl: ''
        };
        setProfile(emptyProfile);
        localStorage.setItem(`profile_${seekerId}`, JSON.stringify(emptyProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const calculateJobMatches = (jobs, profile) => {
    if (!profile.skills || profile.skills.length === 0) return jobs;
    
    const skills = profile.skills.map(s => s.toLowerCase());
    
    return jobs.map(job => {
      let score = 0;
      let matchedSkills = [];
      
      const jobText = `${job.title} ${job.description} ${job.requirements}`.toLowerCase();
      
      skills.forEach(skill => {
        if (jobText.includes(skill)) {
          score += 10;
          matchedSkills.push(skill);
        }
      });
      
      if (profile.location && job.location.toLowerCase().includes(profile.location.toLowerCase())) {
        score += 5;
      }
      
      if (profile.preferredJobTypes && profile.preferredJobTypes.includes(job.type)) {
        score += 3;
      }
      
      return {
        ...job,
        matchScore: score,
        matchedSkills,
        isGoodMatch: score >= 15
      };
    })
    .filter(job => job.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
  };

  const loadApplications = async (seekerId) => {
    try {
      setLoading(prev => ({ ...prev, applications: true }));
      
      const appsResponse = await fetch(`${API_URL}/applications`);
      if (appsResponse.ok) {
        const allApplications = await appsResponse.json();
        
        const seekerApplications = allApplications.filter(app => 
          app.candidateEmail === user.email
        );
        
        setAppliedJobs(seekerApplications);
        
        const totalApplications = seekerApplications.length;
        const pending = seekerApplications.filter(app => app.status === 'pending').length;
        const shortlisted = seekerApplications.filter(app => app.status === 'shortlisted').length;
        
        setStats({
          totalApplications,
          interviewsCompleted: 0,
          pending,
          shortlisted
        });
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  };

  const handleApplyJob = async (job) => {
    if (!user) return;
    
    if (!window.confirm(`Apply for "${job.title}" at ${job.companyName}?`)) return;
    
    try {
      const applicationData = {
        jobId: job.id,
        jobTitle: job.title,
        candidateName: user.name,
        candidateEmail: user.email,
        additionalInfo: `I'm interested in this position and my skills match your requirements.`,
        resumeUrl: profile?.resumeUrl || ''
      };
      
      const response = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('✅ Application submitted successfully!');
        
        await loadApplications(user.id);
        
        // ⬇️⬇️⬇️ YE NAYA CODE HAI - INTERVIEW KE LIYE ⬇️⬇️⬇️
        if (confirm('🎤 Would you like to start your AI interview now?')) {
          // Navigate to interview page with application ID and job ID
          navigate(`/interview/${result.application.id}/${job.id}`);
        }
        // ⬆️⬆️⬆️ NAYA CODE KHATAM ⬆️⬆️⬆️
        
      } else {
        const error = await response.json();
        alert(`${error.error || 'Failed to submit application'}`);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Failed to submit application');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSaveProfile = async (profileData) => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      setProfile(profileData);
      
      const matched = calculateJobMatches(availableJobs, profileData);
      setMatchedJobs(matched);
      
      alert('Profile saved successfully! Job recommendations updated.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handleUploadResume = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      alert('Please upload a PDF or DOC file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const resumeUrl = e.target.result;
      const updatedProfile = {
        ...profile,
        resumeUrl,
        resumeName: file.name,
        resumeSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      };
      
      handleSaveProfile(updatedProfile);
    };
    reader.readAsDataURL(file);
  };

  const filteredJobs = availableJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = filters.location === 'all' || 
                          job.location.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesType = filters.type === 'all' || job.type === filters.type;
    
    return matchesSearch && matchesLocation && matchesType;
  });

  const hasApplied = (jobId) => {
    return appliedJobs.some(app => app.jobId === jobId);
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
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <div style={styles.logoSquare}></div>
              <div style={styles.logoCircle}></div>
            </div>
          </div>
          <h2 style={styles.brandName}>BotBoss</h2>
        </div>

        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={styles.userName}>{user.name}</h3>
            <p style={styles.userEmail}>{user.email}</p>
            <div style={styles.userRoleBadge}>Job Seeker</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: 'browse', label: 'Browse Jobs' },
            { id: 'matched', label: 'Best Matches' },
            { id: 'applied', label: 'My Applications' },
            { id: 'interviews', label: 'Interviews' },
            { id: 'profile', label: 'My Profile' }
          ].map(item => (
            <button
              key={item.id}
              style={activeTab === item.id ? styles.activeNavItem : styles.navItem}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.05)'}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={styles.navIcon}>
                {item.id === 'browse' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.navSvg}>
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M14 14L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {item.id === 'matched' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.navSvg}>
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M10 15V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3 10H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M15 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {item.id === 'applied' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.navSvg}>
                    <path d="M13 3H7C5.34315 3 4 4.34315 4 6V14C4 15.6569 5.34315 17 7 17H13C14.6569 17 16 15.6569 16 14V6C16 4.34315 14.6569 3 13 3Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {item.id === 'interviews' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.navSvg}>
                    <path d="M15 7L19 4V16L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="2" y="4" width="11" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
                {item.id === 'profile' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.navSvg}>
                    <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 17C16 14.2386 13.3137 12 10 12C6.68629 12 4 14.2386 4 17" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
              <span style={styles.navLabel}>{item.label}</span>
              {(item.id === 'applied' && stats.totalApplications > 0) && (
                <span style={styles.badge}>{stats.totalApplications}</span>
              )}
              {(item.id === 'matched' && matchedJobs.length > 0) && (
                <span style={styles.badge}>{matchedJobs.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button 
            onClick={handleLogout} 
            style={styles.logoutButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.logoutSvg}>
              <path d="M7 17H5C3.89543 17 3 16.1046 3 15V5C3 3.89543 3.89543 3 5 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 14L17 10L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 10H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === 'browse' && 'Browse All Jobs'}
              {activeTab === 'matched' && 'Jobs Matching Your Profile'}
              {activeTab === 'applied' && 'My Applications'}
              {activeTab === 'interviews' && 'Interviews'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === 'browse' && 'Discover opportunities that match your skills'}
              {activeTab === 'matched' && 'Personalized recommendations based on your profile'}
              {activeTab === 'applied' && 'Track your applications and progress'}
              {activeTab === 'interviews' && 'Prepare and practice for success'}
              {activeTab === 'profile' && 'Manage your professional identity'}
            </p>
          </div>
          
          <div style={styles.headerActions}>
            {activeTab === 'browse' && (
              <div style={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                <div style={styles.searchIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="6.5" stroke="#d3d3d3" strokeWidth="1.5"/>
                    <path d="M14 14L17 17" stroke="#d3d3d3" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            )}
            
            <div style={styles.userMenu}>
              <div style={styles.userAvatarSmall}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={styles.userNameSmall}>{user.name}</p>
                <p style={styles.userRoleSmall}>Job Seeker</p>
              </div>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {/* BROWSE JOBS TAB */}
          {activeTab === 'browse' && (
            <div>
              {/* STATS CARDS */}
              <div style={styles.statsGrid}>
                {[
                  { label: 'Applications', value: stats.totalApplications, color: '#00ff88' },
                  { label: 'Shortlisted', value: stats.shortlisted, color: '#10b981' },
                  { label: 'Pending', value: stats.pending, color: '#f59e0b' },
                  { label: 'Best Matches', value: matchedJobs.length, color: '#8b5cf6' }
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    style={styles.statCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={styles.statContent}>
                      <h3 style={styles.statValue}>{stat.value}</h3>
                      <p style={styles.statLabel}>{stat.label}</p>
                    </div>
                    <div style={{...styles.statLine, background: stat.color}} />
                  </div>
                ))}
              </div>

              {/* FILTERS */}
              <div style={styles.filtersContainer}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Locations</option>
                    <option value="remote">Remote</option>
                    <option value="karachi">Karachi</option>
                    <option value="lahore">Lahore</option>
                    <option value="islamabad">Islamabad</option>
                  </select>
                </div>
                
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Job Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({...filters, sort: e.target.value})}
                    style={styles.filterSelect}
                  >
                    <option value="newest">Newest First</option>
                    <option value="salary_high">Highest Salary</option>
                    <option value="salary_low">Lowest Salary</option>
                  </select>
                </div>
              </div>

              {/* JOBS LIST */}
              {loading.jobs ? (
                <div style={styles.loadingState}>
                  <div style={styles.spinner}></div>
                  <p style={styles.loadingText}>Loading jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <rect x="8" y="16" width="48" height="36" rx="4" stroke="#d3d3d3" strokeWidth="2"/>
                      <rect x="16" y="24" width="32" height="4" rx="2" fill="#d3d3d3" opacity="0.3"/>
                      <rect x="16" y="32" width="24" height="4" rx="2" fill="#d3d3d3" opacity="0.3"/>
                      <rect x="16" y="40" width="20" height="4" rx="2" fill="#d3d3d3" opacity="0.3"/>
                    </svg>
                  </div>
                  <h3 style={styles.emptyTitle}>No Jobs Found</h3>
                  <p style={styles.emptyText}>Try adjusting your search or filters</p>
                </div>
              ) : (
                <div style={styles.jobsGrid}>
                  {filteredJobs.map((job, index) => {
                    const isApplied = hasApplied(job.id);
                    
                    return (
                      <div 
                        key={job.id} 
                        style={styles.jobCard}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-6px)';
                          e.currentTarget.style.borderColor = '#00ff88';
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 136, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = '#2a2a2a';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        <div style={styles.jobHeader}>
                          <div style={styles.companyLogo}>
                            {job.companyName?.charAt(0) || 'C'}
                          </div>
                          <div style={styles.jobTitleSection}>
                            <h3 style={styles.jobTitle}>{job.title}</h3>
                            <p style={styles.companyName}>{job.companyName}</p>
                          </div>
                          {isApplied && (
                            <div style={styles.appliedBadge}>
                              Applied
                            </div>
                          )}
                        </div>

                        <div style={styles.jobDetails}>
                          <div style={styles.jobDetail}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 8.5C9.10457 8.5 10 7.60457 10 6.5C10 5.39543 9.10457 4.5 8 4.5C6.89543 4.5 6 5.39543 6 6.5C6 7.60457 6.89543 8.5 8 8.5Z" stroke="#00ff88" strokeWidth="1.2"/>
                              <path d="M13.5 6.5C13.5 11 8 14 8 14C8 14 2.5 11 2.5 6.5C2.5 4.5 4 2.5 8 2.5C12 2.5 13.5 4.5 13.5 6.5Z" stroke="#00ff88" strokeWidth="1.2"/>
                            </svg>
                            <span>{job.location}</span>
                          </div>
                          <div style={styles.jobDetail}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="2" y="4" width="12" height="10" rx="2" stroke="#00ff88" strokeWidth="1.2"/>
                              <path d="M5 2V6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                              <path d="M11 2V6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                            <span>{job.type}</span>
                          </div>
                          <div style={styles.jobDetail}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 3V13" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                              <path d="M11 5.5L8 3L5 5.5" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M5 10.5L8 13L11 10.5" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{job.salary}</span>
                          </div>
                          <div style={styles.jobDetail}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6.5" stroke="#00ff88" strokeWidth="1.2"/>
                              <path d="M8 4V8L10 10" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                            <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p style={styles.jobDescription}>
                          {job.description.length > 120 
                            ? `${job.description.substring(0, 120)}...` 
                            : job.description}
                        </p>

                        <div style={styles.jobSkills}>
                          <div style={styles.skillsTags}>
                            {['React', 'Node.js', 'JavaScript'].map(skill => (
                              <span key={skill} style={styles.skillTag}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={styles.jobActions}>
                          <button
                            style={isApplied ? styles.viewButton : styles.applyButton}
                            onClick={() => isApplied ? 
                              setActiveTab('applied') : 
                              handleApplyJob(job)
                            }
                            disabled={isApplied}
                            onMouseEnter={(e) => {
                              if (!isApplied) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isApplied) {
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            {isApplied ? 'View Application' : 'Apply Now'}
                          </button>
                          <button style={styles.saveButton}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#d3d3d3';
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M4 4.5C4 3.67157 4.67157 3 5.5 3H10.5C11.3284 3 12 3.67157 12 4.5V13L8 11L4 13V4.5Z" stroke="currentColor" strokeWidth="1.2"/>
                            </svg>
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MATCHED JOBS TAB */}
          {activeTab === 'matched' && (
            <div>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Jobs Matching Your Profile</h2>
                  <p style={styles.sectionSubtitle}>
                    {matchedJobs.length} jobs found based on your skills and preferences
                  </p>
                </div>
                
                {profile?.skills && profile.skills.length > 0 ? (
                  <div style={styles.profileSkills}>
                    <span style={styles.skillsLabel}>Your Skills:</span>
                    <div style={styles.skillsList}>
                      {profile.skills.map((skill, index) => (
                        <span key={index} style={styles.skillTag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setActiveTab('profile')}
                    style={styles.addSkillsButton}
                  >
                    Add Your Skills
                  </button>
                )}
              </div>

              {matchedJobs.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="28" stroke="#d3d3d3" strokeWidth="2"/>
                      <path d="M32 20V32L40 36" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 style={styles.emptyTitle}>No Matches Found</h3>
                  <p style={styles.emptyText}>Complete your profile to get personalized job recommendations</p>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    style={styles.primaryButton}
                  >
                    Complete Your Profile
                  </button>
                </div>
              ) : (
                <div style={styles.matchedJobsGrid}>
                  {matchedJobs.map(job => {
                    const isApplied = hasApplied(job.id);
                    
                    return (
                      <div key={job.id} style={styles.matchedJobCard}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        <div style={styles.matchHeader}>
                          <div style={styles.companyLogoLarge}>
                            {job.companyName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <h3 style={styles.jobTitle}>{job.title}</h3>
                            <p style={styles.companyName}>{job.companyName}</p>
                          </div>
                          <div style={styles.matchScore}>
                            <div style={styles.scoreCircle}>
                              <span style={styles.scoreValue}>{job.matchScore}</span>
                              <span style={styles.scoreLabel}>Match</span>
                            </div>
                          </div>
                        </div>

                        <div style={styles.matchInfo}>
                          <div style={styles.matchDetails}>
                            <span>📍 {job.location}</span>
                            <span>💼 {job.type}</span>
                            <span>💰 {job.salary}</span>
                          </div>
                          
                          {job.matchedSkills && job.matchedSkills.length > 0 && (
                            <div style={styles.matchedSkills}>
                              <span style={styles.matchedLabel}>Matched Skills:</span>
                              <div style={styles.skillsList}>
                                {job.matchedSkills.map((skill, index) => (
                                  <span key={index} style={styles.matchedSkillTag}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {job.isGoodMatch && (
                            <div style={styles.goodMatchBadge}>
                              Good Match for You
                            </div>
                          )}
                        </div>

                        <div style={styles.jobActions}>
                          <button
                            style={isApplied ? styles.viewButton : styles.applyButton}
                            onClick={() => isApplied ? 
                              setActiveTab('applied') : 
                              handleApplyJob(job)
                            }
                            disabled={isApplied}
                          >
                            {isApplied ? 'View Application' : 'Apply Now'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applied' && (
            <div>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>My Applications</h2>
                  <p style={styles.sectionSubtitle}>
                    {stats.totalApplications} total applications • {stats.shortlisted} shortlisted
                  </p>
                </div>
              </div>

              {loading.applications ? (
                <div style={styles.loadingState}>
                  <div style={styles.spinner}></div>
                  <p style={styles.loadingText}>Loading applications...</p>
                </div>
              ) : appliedJobs.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <rect x="12" y="20" width="40" height="32" rx="4" stroke="#d3d3d3" strokeWidth="2"/>
                      <path d="M20 28H44" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 36H36" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 44H32" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 style={styles.emptyTitle}>No Applications Yet</h3>
                  <p style={styles.emptyText}>Browse jobs and start applying!</p>
                  <button 
                    onClick={() => setActiveTab('browse')}
                    style={styles.primaryButton}
                  >
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div style={styles.applicationsList}>
                  {appliedJobs.map(app => (
                    <div key={app.id} style={styles.applicationCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div style={styles.applicationHeader}>
                        <div>
                          <h3 style={styles.appJobTitle}>{app.jobTitle}</h3>
                          <p style={styles.appDate}>
                            Applied: {new Date(app.appliedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={styles.appStatusContainer}>
                          <span style={{
                            ...styles.statusBadge,
                            background: app.status === 'shortlisted' ? 'rgba(16, 185, 129, 0.1)' : 
                                       app.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 
                                       app.status === 'hired' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: app.status === 'shortlisted' ? '#10b981' : 
                                   app.status === 'rejected' ? '#ef4444' : 
                                   app.status === 'hired' ? '#22c55e' : '#f59e0b',
                            border: app.status === 'shortlisted' ? '1px solid rgba(16, 185, 129, 0.2)' : 
                                   app.status === 'rejected' ? '1px solid rgba(239, 68, 68, 0.2)' : 
                                   app.status === 'hired' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                          }}>
                            {app.status}
                          </span>
                          <span style={styles.appliedBadgeSmall}>
                            {new Date(app.appliedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={styles.applicationDetails}>
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>Application ID:</span>
                          <span style={styles.detailValue}>{app.id}</span>
                        </div>
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>Last Updated:</span>
                          <span style={styles.detailValue}>
                            {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        {app.resumeUrl && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>Resume:</span>
                            <a 
                              href={app.resumeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={styles.resumeLink}
                            >
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>

                      <div style={styles.applicationActions}>
                       <button 
  style={styles.actionButton}
  onClick={() => {
    // Navigate to interview page with this application
    navigate(`/interview/${app.id}/${app.jobId}`);
  }}
>
  🎤 Start Interview
</button>
                        <button 
                          style={styles.secondaryButton}
                          onClick={() => {
                            if (confirm('Are you sure you want to withdraw this application?')) {
                              alert('Withdrawal feature coming soon!');
                            }
                          }}
                        >
                          Withdraw
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INTERVIEWS TAB */}
          {activeTab === 'interviews' && (
            <div>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Interviews</h2>
                  <p style={styles.sectionSubtitle}>
                    Practice and prepare for your upcoming interviews
                  </p>
                </div>
              </div>

              <div style={styles.interviewCards}>
                <div style={styles.interviewCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={styles.interviewIcon}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M15 21L23 16V32L15 27" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="6" y="16" width="26" height="16" rx="4" stroke="#00ff88" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 style={styles.interviewTitle}>AI Mock Interview</h3>
                  <p style={styles.interviewDescription}>
                    Practice with AI-powered interviews tailored to your job applications
                  </p>
                  <button 
  style={styles.primaryButton}
  onClick={() => {
    // Check if user has any applications
    if (appliedJobs.length === 0) {
      alert('❌ Please apply to a job first!');
      setActiveTab('browse');
      return;
    }
    
    // Get the latest application
    const latestApp = appliedJobs[0];
    
    // Start interview for latest application
    navigate(`/interview/${latestApp.id}/${latestApp.jobId}`);
  }}
>
  Start Practice Interview
</button>
                </div>

                <div style={styles.interviewCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={styles.interviewIcon}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path d="M24 40C33.9411 40 42 31.9411 42 22C42 12.0589 33.9411 4 24 4C14.0589 4 6 12.0589 6 22C6 31.9411 14.0589 40 24 40Z" stroke="#00ff88" strokeWidth="2"/>
                      <path d="M24 28V14" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M30 22H18" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 style={styles.interviewTitle}>Interview Analytics</h3>
                  <p style={styles.interviewDescription}>
                    View your interview performance and improvement areas
                  </p>
                  <button 
                    style={styles.secondaryButton}
                    onClick={() => alert('Analytics coming soon!')}
                  >
                    View Analytics
                  </button>
                </div>

                <div style={styles.interviewCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={styles.interviewIcon}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="8" y="12" width="32" height="24" rx="4" stroke="#00ff88" strokeWidth="2"/>
                      <path d="M8 20H40" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 28H32" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 32H28" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 style={styles.interviewTitle}>Interview Preparation</h3>
                  <p style={styles.interviewDescription}>
                    Access resources and tips for common interview questions
                  </p>
                  <button 
                    style={styles.secondaryButton}
                    onClick={() => alert('Resources coming soon!')}
                  >
                    View Resources
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <ProfileSection 
              user={user}
              profile={profile}
              onSave={handleSaveProfile}
              onUploadResume={handleUploadResume}
              loading={loading.profile}
            />
          )}
        </div>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <p>© {new Date().getFullYear()} BotBoss. All rights reserved.</p>
          <p>Elevating careers through intelligent matching</p>
        </footer>
      </main>
    </div>
  );
}

// Profile Section Component
const ProfileSection = ({ user, profile, onSave, onUploadResume, loading }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    skills: profile?.skills || [],
    experience: profile?.experience || '',
    education: profile?.education || '',
    location: profile?.location || '',
    preferredJobTypes: profile?.preferredJobTypes || [],
    salaryExpectation: profile?.salaryExpectation || '',
    resumeUrl: profile?.resumeUrl || '',
    phone: profile?.phone || '',
    linkedin: profile?.linkedin || ''
  });

  const skillOptions = [
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Python', 'Django', 'Java',
    'Spring Boot', 'PHP', 'Laravel', 'JavaScript', 'TypeScript', 'HTML', 'CSS',
    'MongoDB', 'MySQL', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git',
    'REST API', 'GraphQL', 'React Native', 'Flutter', 'Swift', 'Kotlin'
  ];

  const jobTypeOptions = [
    'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'
  ];

  const handleSkillToggle = (skill) => {
    const currentSkills = [...formData.skills];
    if (currentSkills.includes(skill)) {
      setFormData({
        ...formData,
        skills: currentSkills.filter(s => s !== skill)
      });
    } else {
      setFormData({
        ...formData,
        skills: [...currentSkills, skill]
      });
    }
  };

  const handleJobTypeToggle = (type) => {
    const currentTypes = [...formData.preferredJobTypes];
    if (currentTypes.includes(type)) {
      setFormData({
        ...formData,
        preferredJobTypes: currentTypes.filter(t => t !== type)
      });
    } else {
      setFormData({
        ...formData,
        preferredJobTypes: [...currentTypes, type]
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setEditing(false);
  };

  return (
    <div style={styles.profileContainer}>
      <div style={styles.profileCard}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
      >
        <div style={styles.profileHeader}>
          <div style={styles.profileAvatar}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={styles.profileName}>{user.name}</h2>
            <p style={styles.profileEmail}>{user.email}</p>
            <p style={styles.profileRole}>Job Seeker</p>
          </div>
          <button
            style={editing ? styles.cancelButton : styles.editButton}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SKILLS SECTION */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Skills</h3>
            {editing ? (
              <div style={styles.skillsSelector}>
                <p style={styles.sectionDescription}>Select your skills:</p>
                <div style={styles.skillsGrid}>
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      style={
                        formData.skills.includes(skill) 
                          ? styles.skillButtonActive 
                          : styles.skillButton
                      }
                      onClick={() => handleSkillToggle(skill)}
                      onMouseEnter={(e) => {
                        if (!formData.skills.includes(skill)) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!formData.skills.includes(skill)) {
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                        }
                      }}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.skillsDisplay}>
                {formData.skills.length > 0 ? (
                  formData.skills.map((skill, index) => (
                    <span key={index} style={styles.skillTag}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p style={styles.noData}>No skills added yet</p>
                )}
              </div>
            )}
          </div>

          {/* BASIC INFO */}
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Experience Level</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="e.g., 3 years in web development"
                  style={styles.formInput}
                />
              ) : (
                <p style={styles.displayText}>{formData.experience || 'Not specified'}</p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Education</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  placeholder="e.g., BSCS from Karachi University"
                  style={styles.formInput}
                />
              ) : (
                <p style={styles.displayText}>{formData.education || 'Not specified'}</p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Location</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Karachi, Pakistan"
                  style={styles.formInput}
                />
              ) : (
                <p style={styles.displayText}>{formData.location || 'Not specified'}</p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Salary Expectation</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.salaryExpectation}
                  onChange={(e) => setFormData({...formData, salaryExpectation: e.target.value})}
                  placeholder="e.g., $50,000 - $70,000"
                  style={styles.formInput}
                />
              ) : (
                <p style={styles.displayText}>{formData.salaryExpectation || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* JOB PREFERENCES */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Job Preferences</h3>
            {editing ? (
              <div>
                <p style={styles.sectionDescription}>Preferred job types:</p>
                <div style={styles.jobTypesGrid}>
                  {jobTypeOptions.map(type => (
                    <button
                      key={type}
                      type="button"
                      style={
                        formData.preferredJobTypes.includes(type)
                          ? styles.jobTypeButtonActive
                          : styles.jobTypeButton
                      }
                      onClick={() => handleJobTypeToggle(type)}
                      onMouseEnter={(e) => {
                        if (!formData.preferredJobTypes.includes(type)) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!formData.preferredJobTypes.includes(type)) {
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                        }
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.jobTypesDisplay}>
                {formData.preferredJobTypes.length > 0 ? (
                  formData.preferredJobTypes.map((type, index) => (
                    <span key={index} style={styles.jobTypeTag}>
                      {type}
                    </span>
                  ))
                ) : (
                  <p style={styles.noData}>No preferences set</p>
                )}
              </div>
            )}
          </div>

          {/* RESUME */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Resume/CV</h3>
            {formData.resumeUrl ? (
              <div style={styles.resumeSection}>
                <div style={styles.resumeInfo}>
                  <div style={styles.resumeIcon}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M22 10V6C22 4.89543 21.1046 4 20 4H8C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12C26 10.8954 25.1046 10 24 10H22Z" stroke="#00ff88" strokeWidth="2"/>
                      <path d="M22 10V8C22 6.89543 21.1046 6 20 6H18" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 16H20" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 20H20" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 24H16" stroke="#00ff88" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p style={styles.resumeName}>Resume.pdf</p>
                    <p style={styles.resumeSize}>Uploaded • Click to update</p>
                  </div>
                </div>
                {editing && (
                  <div style={styles.uploadArea}>
                    <input
                      type="file"
                      id="resumeUpload"
                      accept=".pdf,.doc,.docx"
                      onChange={onUploadResume}
                      style={styles.fileInput}
                    />
                    <label htmlFor="resumeUpload" style={styles.uploadButton}>
                      Update Resume
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.uploadAreaLarge}>
                <div style={styles.uploadIcon}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M32 20V12C32 10.8954 31.1046 10 30 10H10C8.89543 10 8 10.8954 8 12V36C8 37.1046 8.89543 38 10 38H38C39.1046 38 40 37.1046 40 36V24C40 22.8954 39.1046 22 38 22H34" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M32 20V18C32 16.8954 31.1046 16 30 16H28" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M24 32V16" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M18 24L24 16L30 24" stroke="#d3d3d3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={styles.uploadText}>Upload your resume</p>
                <p style={styles.uploadSubtext}>PDF or DOC files (max 5MB)</p>
                <input
                  type="file"
                  id="resumeUpload"
                  accept=".pdf,.doc,.docx"
                  onChange={onUploadResume}
                  style={styles.fileInput}
                />
                <label htmlFor="resumeUpload" style={styles.uploadButtonLarge}>
                  Choose File
                </label>
              </div>
            )}
          </div>

          {/* SAVE BUTTON */}
          {editing && (
            <div style={styles.saveSection}>
              <button
                type="submit"
                style={styles.saveButton}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <p style={styles.saveNote}>
                Your profile helps us recommend better job matches
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// STYLES
const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0a0a0a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#ffffff'
  },
  
  // Sidebar Styles
  sidebar: {
    width: '280px',
    background: '#1a1a1a',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    borderRight: '1px solid #2a2a2a'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
    paddingBottom: '24px',
    borderBottom: '1px solid #2a2a2a'
  },
  logo: {
    width: '40px',
    height: '40px'
  },
  logoIcon: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  logoSquare: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '32px',
    height: '32px',
    border: '2px solid #00ff88',
    borderRadius: '4px'
  },
  logoCircle: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '16px',
    height: '16px',
    border: '2px solid #00ff88',
    borderRadius: '50%'
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  userInfo: {
    marginBottom: '40px'
  },
  userAvatar: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#0a0a0a',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  userName: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  userEmail: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: '0 0 12px 0'
  },
  userRoleBadge: {
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    border: '1px solid rgba(0, 255, 136, 0.2)'
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    color: '#d3d3d3',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.2s',
    position: 'relative'
  },
  activeNavItem: {
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    border: '1px solid rgba(0, 255, 136, 0.2)'
  },
  navIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navSvg: {
    width: '100%',
    height: '100%'
  },
  navLabel: {
    flex: 1
  },
  badge: {
    background: '#00ff88',
    color: '#0a0a0a',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    minWidth: '24px',
    textAlign: 'center'
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '24px',
    borderTop: '1px solid #2a2a2a'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#d3d3d3',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  logoutSvg: {
    width: '20px',
    height: '20px'
  },
  
  // Main Content
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto'
  },
  header: {
    background: '#1a1a1a',
    padding: '32px 40px',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #ffffff 0%, #d3d3d3666 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  searchBox: {
    position: 'relative',
    width: '320px'
  },
  searchInput: {
    width: '100%',
    padding: '14px 20px 14px 48px',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#d3d3d3'
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px'
  },
  userAvatarSmall: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  userNameSmall: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 2px 0'
  },
  userRoleSmall: {
    fontSize: '12px',
    color: '#d3d3d3',
    margin: 0
  },
  
  // Content Area
  content: {
    padding: '32px 40px',
    flex: 1
  },
  
  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    background: '#1a1a1a',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  statContent: {
    position: 'relative',
    zIndex: 2
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  statLabel: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  statLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    transition: 'all 0.3s'
  },
  
  // Filters
  filtersContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '180px'
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#d3d3d3',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  filterSelect: {
    padding: '12px 16px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s'
  },
  
  // Jobs Grid
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '24px'
  },
  jobCard: {
    background: '#1a1a1a',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    transition: 'all 0.3s',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  jobHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px'
  },
  companyLogo: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: '20px',
    flexShrink: 0
  },
  jobTitleSection: {
    flex: 1
  },
  jobTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 4px 0'
  },
  companyName: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: 0
  },
  appliedBadge: {
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid rgba(0, 255, 136, 0.2)'
  },
  jobDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  jobDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#d3d3d3'
  },
  jobDescription: {
    fontSize: '14px',
    color: '#d3d3d3',
    lineHeight: '1.6',
    marginBottom: '20px',
    opacity: 0.8
  },
  jobSkills: {
    marginBottom: '24px'
  },
  skillsTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  skillTag: {
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid rgba(0, 255, 136, 0.2)'
  },
  jobActions: {
    display: 'flex',
    gap: '12px'
  },
  applyButton: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  viewButton: {
    flex: 1,
    padding: '14px',
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '14px 20px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#d3d3d3',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  },
  
  // Section Styles
  sectionHeader: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#d3d3d3',
    margin: 0
  },
  
  // Matched Jobs
  matchedJobsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  matchedJobCard: {
    background: '#1a1a1a',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s'
  },
  matchHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  companyLogoLarge: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: '24px',
    flexShrink: 0
  },
  matchScore: {
    marginLeft: 'auto'
  },
  scoreCircle: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 255, 136, 0.3)'
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0a0a0a',
    lineHeight: 1
  },
  scoreLabel: {
    fontSize: '12px',
    color: 'rgba(10, 10, 10, 0.9)',
    marginTop: '2px'
  },
  matchInfo: {
    marginBottom: '20px'
  },
  matchDetails: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#d3d3d3'
  },
  matchedSkills: {
    marginBottom: '12px'
  },
  matchedLabel: {
    fontSize: '12px',
    color: '#d3d3d3',
    marginBottom: '8px',
    display: 'block'
  },
  matchedSkillTag: {
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    marginRight: '8px',
    marginBottom: '8px',
    display: 'inline-block',
    border: '1px solid rgba(0, 255, 136, 0.2)'
  },
  goodMatchBadge: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid rgba(245, 158, 11, 0.2)'
  },
  
  // Applications
  applicationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  applicationCard: {
    background: '#1a1a1a',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s'
  },
  applicationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  appJobTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  appDate: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: 0
  },
  appStatusContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end'
  },
  statusBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  appliedBadgeSmall: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#d3d3d3',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #2a2a2a'
  },
  applicationDetails: {
    background: '#0a0a0a',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #2a2a2a'
  },
  detailLabel: {
    fontSize: '14px',
    color: '#d3d3d3'
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff'
  },
  resumeLink: {
    color: '#00ff88',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  applicationActions: {
    display: 'flex',
    gap: '12px'
  },
  actionButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  secondaryButton: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#d3d3d3',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  // Interviews
  interviewCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  },
  interviewCard: {
    background: '#1a1a1a',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s'
  },
  interviewIcon: {
    marginBottom: '20px'
  },
  interviewTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 12px 0'
  },
  interviewDescription: {
    fontSize: '14px',
    color: '#d3d3d3',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  primaryButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s'
  },
  
  // Profile
  profileContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%'
  },
  profileCard: {
    background: '#1a1a1a',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #2a2a2a',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #2a2a2a'
  },
  profileAvatar: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a0a0a',
    fontSize: '36px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  profileName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 4px 0'
  },
  profileEmail: {
    fontSize: '16px',
    color: '#d3d3d3',
    margin: '0 0 4px 0'
  },
  profileRole: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: 0
  },
  editButton: {
    marginLeft: 'auto',
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cancelButton: {
    marginLeft: 'auto',
    padding: '10px 24px',
    background: '#d3d3d3',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 16px 0'
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: '0 0 16px 0'
  },
  skillsSelector: {
    marginBottom: '24px'
  },
  skillsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  skillButton: {
    padding: '8px 16px',
    background: '#1a1a1a',
    color: '#d3d3d3',
    border: '1px solid #2a2a2a',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  skillButtonActive: {
    padding: '8px 16px',
    background: '#00ff88',
    color: '#0a0a0a',
    border: '1px solid #00ff88',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  skillsDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  noData: {
    color: '#d3d3d3',
    fontStyle: 'italic'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    marginBottom: '32px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#d3d3d3',
    marginBottom: '8px'
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    color: '#ffffff'
  },
  displayText: {
    fontSize: '16px',
    color: '#ffffff',
    margin: 0,
    padding: '12px 0'
  },
  jobTypesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  jobTypeButton: {
    padding: '8px 16px',
    background: '#1a1a1a',
    color: '#d3d3d3',
    border: '1px solid #2a2a2a',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  jobTypeButtonActive: {
    padding: '8px 16px',
    background: '#00ff88',
    color: '#0a0a0a',
    border: '1px solid #00ff88',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  jobTypesDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  jobTypeTag: {
    background: 'rgba(0, 255, 136, 0.1)',
    color: '#00ff88',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid rgba(0, 255, 136, 0.2)'
  },
  resumeSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#0a0a0a',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #2a2a2a'
  },
  resumeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  resumeIcon: {
    width: '32px',
    height: '32px'
  },
  resumeName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 4px 0'
  },
  resumeSize: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: 0
  },
  uploadArea: {
    textAlign: 'center'
  },
  uploadAreaLarge: {
    border: '1px dashed #2a2a2a',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    background: '#0a0a0a'
  },
  uploadIcon: {
    marginBottom: '20px',
    color: '#d3d3d3'
  },
  uploadText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  uploadSubtext: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: '0 0 20px 0'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    padding: '10px 20px',
    background: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  uploadButtonLarge: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  saveSection: {
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #2a2a2a',
    textAlign: 'center'
  },
  saveButton: {
    padding: '14px 48px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'all 0.2s'
  },
  saveNote: {
    fontSize: '14px',
    color: '#d3d3d3',
    margin: 0
  },
  
  // Loading and Empty States
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    background: '#0a0a0a'
  },
  loadingState: {
    textAlign: 'center',
    padding: '80px 20px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #2a2a2a',
    borderTop: '3px solid #00ff88',
    borderRadius: '50%',
    margin: '0 auto 24px',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#d3d3d3',
    fontSize: '16px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    background: '#1a1a1a',
    borderRadius: '16px',
    border: '1px solid #2a2a2a'
  },
  emptyIcon: {
    marginBottom: '24px',
    opacity: 0.5
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 12px 0'
  },
  emptyText: {
    fontSize: '16px',
    color: '#d3d3d3',
    margin: '0 0 24px 0'
  },
  
  // Footer
  footer: {
    padding: '24px 40px',
    background: '#1a1a1a',
    color: '#d3d3d3',
    fontSize: '14px',
    textAlign: 'center',
    borderTop: '1px solid #2a2a2a',
    marginTop: 'auto'
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus, textarea:focus, select:focus {
    border-color: #00ff88 !important;
    box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.1) !important;
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
`;
document.head.appendChild(styleSheet);

export default SeekerDashboard;