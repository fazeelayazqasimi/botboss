import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const dummyCandidates = 
[
  {
    id: 1,
    name: "Ali Khan",
    email: "ali.khan@example.com",
    role: "Software Developer",
    score: 85,
    status: "Pending",
  },
  {
    id: 2,
    name: "Sara Ahmed",
    email: "sara.ahmed@example.com",
    role: "UI/UX Designer",
    score: 90,
    status: "Shortlisted",
  },
  {
    id: 3,
    name: "Hamza Raza",
    email: "hamza.raza@example.com",
    role: "Backend Developer",
    score: 78,
    status: "On Call",
  },
]

const Dashboard = () => {
  const [candidates, setCandidates] = useState(dummyCandidates)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Update candidate status
  const updateStatus = (id, newStatus) => {
    setCandidates(candidates.map(candidate =>
      candidate.id === id ? { ...candidate, status: newStatus } : candidate
    ))
  }

  // Delete candidate
  const deleteCandidate = (id) => {
    setCandidates(candidates.filter(candidate => candidate.id !== id))
  }

  // Filter candidates
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email.toLowerCase().includes(search.toLowerCase()) ||
      candidate.role.toLowerCase().includes(search.toLowerCase())
    
    const matchesRole = !roleFilter || candidate.role === roleFilter
    const matchesStatus = !statusFilter || candidate.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Get unique roles and statuses for filters
  const uniqueRoles = [...new Set(candidates.map(c => c.role))]
  const uniqueStatuses = ["All", ...new Set(candidates.map(c => c.status))]

  // Summary statistics
  const totalCandidates = candidates.length
  const avgScore = candidates.length > 0 ? 
    (candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length).toFixed(1) : 
    "0.0"
  const shortlistedCount = candidates.filter(c => c.status === "Shortlisted").length
  const pendingCount = candidates.filter(c => c.status === "Pending").length
  const onCallCount = candidates.filter(c => c.status === "On Call").length

  // Inline styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      margin: '0'
    },
    summaryContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    },
    summaryCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0'
    },
    summaryNumber: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0 0 8px 0'
    },
    summaryLabel: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '500',
      margin: '0'
    },
    filtersContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0'
    },
    filterRow: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      alignItems: 'flex-end'
    },
    filterGroup: {
      flex: '1',
      minWidth: '200px'
    },
    filterLabel: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#475569',
      marginBottom: '8px'
    },
    filterInput: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      backgroundColor: '#1e293b'
    },
    tableHeaderCell: {
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      borderBottom: '1px solid #334155'
    },
    tableRow: {
      borderBottom: '1px solid #f1f5f9',
      transition: 'background-color 0.2s'
    },
    tableRowHover: {
      backgroundColor: '#f8fafc'
    },
    tableCell: {
      padding: '16px 20px',
      fontSize: '14px',
      color: '#334155',
      borderBottom: '1px solid #f1f5f9'
    },
    statusBadge: (status) => ({
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block',
      backgroundColor: 
        status === 'Shortlisted' ? '#dcfce7' : 
        status === 'Pending' ? '#fef3c7' : 
        status === 'On Call' ? '#dbeafe' : 
        '#e5e7eb',
      color: 
        status === 'Shortlisted' ? '#166534' : 
        status === 'Pending' ? '#92400e' : 
        status === 'On Call' ? '#1e40af' : 
        '#374151'
    }),
    scoreCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    scoreBar: (score) => ({
      width: '80px',
      height: '6px',
      backgroundColor: '#e2e8f0',
      borderRadius: '3px',
      overflow: 'hidden'
    }),
    scoreFill: (score) => ({
      width: `${score}%`,
      height: '100%',
      backgroundColor: score >= 80 ? '#10b981' : 
                     score >= 60 ? '#f59e0b' : 
                     '#ef4444',
      borderRadius: '3px'
    }),
    scoreText: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    statusButton: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    shortlistButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    pendingButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    onCallButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    interviewButton: {
      padding: '8px 16px',
      backgroundColor: '#8b5cf6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block'
    },
    reminderButton: {
      padding: '8px 16px',
      backgroundColor: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    noResults: {
      textAlign: 'center',
      padding: '48px',
      color: '#64748b',
      fontSize: '16px'
    },
    resetButton: {
      padding: '10px 20px',
      backgroundColor: '#64748b',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    resetButtonHover: {
      backgroundColor: '#475569'
    }
  }

  // State for hover effects
  const [hoveredRow, setHoveredRow] = useState(null)
  const [resetHovered, setResetHovered] = useState(false)

  const handleResetFilters = () => {
    setSearch("")
    setRoleFilter("")
    setStatusFilter("")
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>HR Dashboard</h1>
        <p style={styles.subtitle}>Manage candidate applications and interviews</p>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryContainer}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryNumber}>{totalCandidates}</div>
          <p style={styles.summaryLabel}>Total Candidates</p>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryNumber}>{avgScore}</div>
          <p style={styles.summaryLabel}>Average Score</p>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryNumber}>{shortlistedCount}</div>
          <p style={styles.summaryLabel}>Shortlisted</p>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryNumber}>{onCallCount}</div>
          <p style={styles.summaryLabel}>On Call</p>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersContainer}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.filterInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Filter by Role</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Filter by Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={styles.select}
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status === "All" ? "" : status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            onMouseEnter={() => setResetHovered(true)}
            onMouseLeave={() => setResetHovered(false)}
            style={{
              ...styles.resetButton,
              ...(resetHovered && styles.resetButtonHover)
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Candidates Table */}
      <div style={styles.tableContainer}>
        {filteredCandidates.length === 0 ? (
          <div style={styles.noResults}>
            No candidates found. Try adjusting your search or filters.
          </div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Email</th>
                <th style={styles.tableHeaderCell}>Role</th>
                <th style={styles.tableHeaderCell}>Score</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr 
                  key={candidate.id}
                  style={{
                    ...styles.tableRow,
                    ...(hoveredRow === candidate.id && styles.tableRowHover)
                  }}
                  onMouseEnter={() => setHoveredRow(candidate.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {candidate.name}
                    </div>
                  </td>
                  <td style={styles.tableCell}>{candidate.email}</td>
                  <td style={styles.tableCell}>{candidate.role}</td>
                  <td style={styles.tableCell}>
                    <div style={styles.scoreCell}>
                      <div style={styles.scoreBar(candidate.score)}>
                        <div style={styles.scoreFill(candidate.score)}></div>
                      </div>
                      <span style={styles.scoreText}>{candidate.score}</span>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.statusBadge(candidate.status)}>
                      {candidate.status}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      {/* Status Update Buttons */}
                      <button
                        onClick={() => updateStatus(candidate.id, "Shortlisted")}
                        style={{
                          ...styles.statusButton,
                          ...styles.shortlistButton,
                          ...(candidate.status === "Shortlisted" && { opacity: 0.7 })
                        }}
                        disabled={candidate.status === "Shortlisted"}
                      >
                        Shortlist
                      </button>
                      
                      <button
                        onClick={() => updateStatus(candidate.id, "Pending")}
                        style={{
                          ...styles.statusButton,
                          ...styles.pendingButton,
                          ...(candidate.status === "Pending" && { opacity: 0.7 })
                        }}
                        disabled={candidate.status === "Pending"}
                      >
                        Pending
                      </button>
                      
                      <button
                        onClick={() => updateStatus(candidate.id, "On Call")}
                        style={{
                          ...styles.statusButton,
                          ...styles.onCallButton,
                          ...(candidate.status === "On Call" && { opacity: 0.7 })
                        }}
                        disabled={candidate.status === "On Call"}
                      >
                        On Call
                      </button>
                      
                      <button
                        onClick={() => deleteCandidate(candidate.id)}
                        style={{
                          ...styles.statusButton,
                          ...styles.deleteButton
                        }}
                      >
                        Delete
                      </button>
                      
                      {/* Additional Actions */}
                      <Link
                        to={`/interview/${candidate.id}`}
                        style={styles.interviewButton}
                      >
                        Interview
                      </Link>
                      
                      <button
                        style={styles.reminderButton}
                      >
                        Reminder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard