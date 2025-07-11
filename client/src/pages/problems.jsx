import { useState, useEffect } from 'react';
import { fetchProblems } from '../api/problems';
import '../styles.css';

// SVGs for sidebar
const ChevronLeft = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 15L9 10L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const ChevronRight = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 5L11 10L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const HomeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 4l9 5.5" /><path d="M4 10v10a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V10" /></svg>
);
const ProgressIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="8" width="4" height="12" rx="1" />
        <rect x="17" y="4" width="4" height="16" rx="1" />
    </svg>
);

const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));

const Problems = ({ onLoaded }) => {
    const [problems, setProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'rating', direction: 'desc' });
    const [search, setSearch] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [topicFilter, setTopicFilter] = useState('');
    const [ratingRange, setRatingRange] = useState({ min: '', max: '' });
    const [completedProblems, setCompletedProblems] = useState(() => {
        const saved = localStorage.getItem('completedProblems');
        return saved ? JSON.parse(saved) : [];
    });
    const [stats, setStats] = useState({ total: 0, completed: 0 });
    const [showTopics, setShowTopics] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const problemsPerPage = isMobile ? 10 : 20;
    const [difficultyStats, setDifficultyStats] = useState({ easy: { total: 0, completed: 0 }, medium: { total: 0, completed: 0 }, hard: { total: 0, completed: 0 } });
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [activePage, setActivePage] = useState('home');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState('');

    // Get the width of the search input (default or custom):
    const filterInputWidth = isMobile ? '98vw' : '260px';

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('completedProblems', JSON.stringify(completedProblems));
        setStats({
            total: problems.length,
            completed: completedProblems.length
        });
        const diffStats = { easy: { total: 0, completed: 0 }, medium: { total: 0, completed: 0 }, hard: { total: 0, completed: 0 } };
        for (const p of problems) {
            const diff = String(p.difficulty).toLowerCase();
            if (diffStats[diff] !== undefined) {
                diffStats[diff].total++;
                if (completedProblems.map(String).includes(String(p.id))) diffStats[diff].completed++;
            }
        }
        setDifficultyStats(diffStats);
    }, [completedProblems, problems]);

    useEffect(() => {
        const loadProblems = async () => {
            try {
                const data = await fetchProblems();
                if (!Array.isArray(data)) throw new Error('Invalid data format received from API');

                const validProblems = data.map((problem) => ({
                    ...problem,
                    difficulty: problem.difficulty || 'Unknown',
                    topics: Array.isArray(problem.topics) ? problem.topics : Array.isArray(problem.tags) ? problem.tags : [],
                    companies: Array.isArray(problem.companies) ? problem.companies : [],
                    rating: typeof problem.rating === 'number' ? problem.rating : 0,
                    title: problem.title || 'Untitled',
                    id: problem.id || 'N/A',
                }));

                setProblems(validProblems);
                onLoaded && onLoaded();
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        loadProblems();
    }, []);

    useEffect(() => {
        let filtered = problems;

        filtered = filtered.map((problem) => ({
            ...problem,
            id: String(problem.id || '').trim(),
            title: String(problem.title || '').trim(),
            difficulty: String(problem.difficulty || 'unknown').toLowerCase().trim(),
            rating: Number(problem.rating) || 0,
            topics: Array.isArray(problem.topics) ? problem.topics.map(t => String(t).trim()) : [],
            companies: Array.isArray(problem.companies) ? problem.companies.map(c => String(c).trim()) : []
        }));

        if (search) {
            const s = search.toLowerCase().trim();
            filtered = filtered.filter(
                (p) =>
                    p.id.toLowerCase().includes(s) ||
                    p.title.toLowerCase().includes(s) ||
                    p.companies.some((c) => c.toLowerCase().includes(s)) ||
                    p.topics.some((t) => t.toLowerCase().includes(s))
            );
        }

        if (companyFilter) {
            const company = companyFilter.trim();
            filtered = filtered.filter((p) =>
                p.companies.some(c => c.toLowerCase() === company.toLowerCase())
            );
        }

        if (difficultyFilter) {
            const difficulty = difficultyFilter.toLowerCase().trim();
            filtered = filtered.filter((p) => p.difficulty === difficulty);
        }

        if (topicFilter) {
            const topic = topicFilter.trim();
            filtered = filtered.filter((p) =>
                p.topics.some(t => t.toLowerCase() === topic.toLowerCase())
            );
        }

        if (ratingRange.min !== '' || ratingRange.max !== '') {
            const minRating = ratingRange.min !== '' ? Number(ratingRange.min) : 0;
            const maxRating = ratingRange.max !== '' ? Number(ratingRange.max) : Infinity;

            filtered = filtered.filter((p) => {
                const rating = Number(p.rating);
                return !isNaN(rating) && rating >= minRating && rating <= maxRating;
            });
        }

        const sortedProblems = [...filtered].sort((a, b) => {
            if (sortConfig.key === 'id') {
                return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
            }
            if (sortConfig.key === 'rating') {
                return sortConfig.direction === 'asc' ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0);
            }
            if (sortConfig.key === 'difficulty') {
                const order = { easy: 1, medium: 2, hard: 3 };
                return sortConfig.direction === 'asc'
                    ? (order[a.difficulty] || 0) - (order[b.difficulty] || 0)
                    : (order[b.difficulty] || 0) - (order[a.difficulty] || 0);
            }
            return 0;
        });

        setFilteredProblems(sortedProblems);
        setCurrentPage(1);
    }, [problems, search, companyFilter, difficultyFilter, topicFilter, ratingRange, sortConfig]);
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.body.classList.add('dark');
        }
    }, []);
    const toggleCompleted = (problemId) => {
        const idNum = Number(problemId);
        setCompletedProblems(prev => {
            if (prev.includes(idNum)) {
                return prev.filter(id => id !== idNum);
            } else {
                return [...prev, idNum];
            }
        });
    };

    const resetFilters = () => {
        setSearch('');
        setCompanyFilter('');
        setDifficultyFilter('');
        setTopicFilter('');
        setRatingRange({ min: '', max: '' });
        setSortConfig({ key: 'rating', direction: 'desc' });
    };

    const allCompanies = unique(problems.flatMap((p) => p.companies)).sort();
    const allDifficulties = unique(problems.map((p) => String(p.difficulty).toLowerCase()));
    const allTopics = unique(problems.flatMap((p) => p.topics)).sort();

    const indexOfLastProblem = currentPage * problemsPerPage;
    const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
    const currentProblems = filteredProblems.slice(indexOfFirstProblem, indexOfLastProblem);
    const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        return pageNumbers;
    };

    const handleFeedbackSubmit = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/feedback/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: feedback })
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            const data = await response.json();
            alert(`Feedback submitted successfully!`);
            setFeedback('');
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        }
    };

    const toggleCompanies = (problemId) => {
        setExpandedCompanies((prev) => ({
            ...prev,
            [problemId]: !prev[problemId],
        }));
    };

    // Sidebar collapsed state: always collapsed on mobile, always expanded on desktop by default
    useEffect(() => {
        if (isMobile) {
            setSidebarCollapsed(true);
        } else {
            setSidebarCollapsed(false);
        }
    }, [isMobile]);

    // Add this function to handle import
    const handleImportSolved = () => {
        setImportError('');
        let parsed;
        try {
            parsed = JSON.parse(importJson);
        } catch (e) {
            setImportError('Invalid JSON. Please paste the full JSON from LeetCode.');
            return;
        }
        if (!parsed.stat_status_pairs || !Array.isArray(parsed.stat_status_pairs)) {
            setImportError('JSON format not recognized. Please ensure you copied from https://leetcode.com/api/problems/all/');
            return;
        }
        // Use frontend_question_id for matching
        const solvedIds = parsed.stat_status_pairs
            .filter(pair => pair.status === 'ac')
            .map(pair => Number(pair.stat.frontend_question_id)); // Make sure it's a number

        if (solvedIds.length === 0) {
            setImportError('No solved problems found in the pasted JSON.');
            return;
        }
        // Find matching problems in our list
        const matchingIds = problems
            .filter(p => solvedIds.includes(Number(p.id))) // Make sure your local id is also a number
            .map(p => p.id);

        if (matchingIds.length === 0) {
            setImportError('No matching problems found in your dashboard.');
            return;
        }
        // Merge with current completedProblems
        const newCompleted = Array.from(new Set([...completedProblems, ...matchingIds]));
        setCompletedProblems(newCompleted);
        localStorage.setItem('completedProblems', JSON.stringify(newCompleted));
        setShowImportModal(false);
        setImportJson('');
        setImportError('');
        alert(`Imported ${matchingIds.length} solved problems!`);
    };

    if (loading) {
        return (
            <div className="problems-container">
                <div>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="problems-container">
                <div className="feedback-section">
                    <h2 style={{ color: 'red', marginBottom: '16px' }}>Error Loading Problems</h2>
                    <p style={{ marginBottom: '16px' }}>{error}</p>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            {/* Sidebar */}
            <aside style={{
                width: isMobile || sidebarCollapsed ? '60px' : '200px',
                background: theme === 'dark'
                    ? 'linear-gradient(180deg, #1e293b 0%, #334155 100%)'
                    : 'linear-gradient(180deg, var(--primary) 0%, var(--primary-hover) 100%)',
                boxShadow: '2px 0 16px 0 rgba(0,0,0,0.07)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2.5rem 0 1.5rem 0',
                minHeight: '100vh',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                transition: 'width 0.2s cubic-bezier(.4,2,.6,1)',
            }}>
                {/* Collapse/Expand Button */}
                <button
                    onClick={() => !isMobile && setSidebarCollapsed(c => !c)}
                    style={{
                        position: 'absolute',
                        top: 18,
                        left: sidebarCollapsed ? 10 : 18,
                        background: 'rgba(255,255,255,0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isMobile ? 'not-allowed' : 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        zIndex: 20,
                        transition: 'left 0.2s',
                        opacity: isMobile ? 0.5 : 1
                    }}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    disabled={isMobile}
                >
                    {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
                </button>
                <div style={{ height: '2.5rem', marginBottom: '2.5rem' }}></div>
                <nav style={{ width: '100%' }}>
                    <button
                        style={{
                            width: sidebarCollapsed ? 44 : '85%',
                            margin: '0.7rem auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            gap: sidebarCollapsed ? 0 : 14,
                            padding: sidebarCollapsed ? '0.9rem 0' : '0.9rem 1.2rem',
                            borderRadius: '999px',
                            border: 'none',
                            background: '#fff',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '1.08rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            transition: 'background 0.2s, color 0.2s, width 0.2s',
                            ...(activePage === 'home' ? { background: 'var(--primary)', color: '#fff' } : {})
                        }}
                        onClick={() => setActivePage('home')}
                        onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { if (activePage === 'home') { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; } else { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--primary)'; } }}
                    >
                        <HomeIcon />
                        {!sidebarCollapsed && <span>Home</span>}
                    </button>
                    <button
                        style={{
                            width: sidebarCollapsed ? 44 : '85%',
                            margin: '0.7rem auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            gap: sidebarCollapsed ? 0 : 14,
                            padding: sidebarCollapsed ? '0.9rem 0' : '0.9rem 1.2rem',
                            borderRadius: '999px',
                            border: 'none',
                            background: '#fff',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '1.08rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            transition: 'background 0.2s, color 0.2s, width 0.2s',
                            ...(activePage === 'progress' ? { background: 'var(--primary)', color: '#fff' } : {})
                        }}
                        onClick={() => setActivePage('progress')}
                        onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { if (activePage === 'progress') { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; } else { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--primary)'; } }}
                    >
                        <ProgressIcon />
                        {!sidebarCollapsed && <span>Progress</span>}
                    </button>
                </nav>
            </aside>
            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Topbar */}
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center',
                    background: 'var(--card-bg)',
                    borderBottom: '1px solid var(--border-color)',
                    padding: isMobile ? '0.7rem 0.7rem 0.2rem 0.7rem' : '1.1rem 2.2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 9,
                    position: 'relative',
                    minHeight: isMobile ? 90 : 60
                }}>
                    {/* Desktop: Title center, buttons right; Mobile: stacked */}
                    {!isMobile && <div style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: '2rem', color: 'var(--primary)', letterSpacing: '1px', minWidth: 0, marginLeft: '120px' }}>GrindLC</div>}
                    {/* Desktop: Title center, buttons right; Mobile: stacked */}
                    {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, justifyContent: 'flex-end' }}>
                            <button
                                className="theme-toggle-btn"
                                onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                style={{ fontSize: '1.7rem', background: 'none', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer', minWidth: 36 }}
                            >
                                {theme === 'dark' ? '🌞' : '🌙'}
                            </button>
                            <button
                                className="help-btn"
                                style={{ marginLeft: 0, fontSize: '1.08rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7, lineHeight: 1, padding: '0.3em 0.7em', borderRadius: 8, minWidth: 60 }}
                                onClick={() => alert(`\nWhat is Zerotrac Rating?\nZerotrac assigns a numeric difficulty rating (1000–3500+) to each LeetCode problem using user submissions and real solve statistics.\nYou can think of it as Leetcode contest rating.\nCredits: Ratings sourced from Zerotrac \n(https://github.com/zerotrac/leetcode_problem_rating)\n`)}
                                title="What is Zerotrac Rating?"
                            >
                                <span style={{ fontSize: '1.35em', display: 'flex', alignItems: 'center', lineHeight: 1 }}>❓</span>
                                <span style={{ position: 'relative', top: 1 }}>Help</span>
                            </button>
                        </div>
                    )}
                    {isMobile && (
                        <>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 2, marginBottom: 2 }}>
                                <button
                                    className="theme-toggle-btn"
                                    onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                    style={{ fontSize: '1.7rem', background: 'none', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer', minWidth: 36 }}
                                >
                                    {theme === 'dark' ? '🌞' : '🌙'}
                                </button>
                            </div>
                            <div style={{ width: '100%', textAlign: 'center', marginTop: 2, marginBottom: 2 }}>
                                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', letterSpacing: '1px', display: 'inline-block' }}>GrindLC</span>
                            </div>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 4, marginBottom: 2 }}>
                                <button
                                    className="help-btn"
                                    style={{ fontSize: '1.08rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7, lineHeight: 1, padding: '0.3em 0.7em', borderRadius: 8, minWidth: 60 }}
                                    onClick={() => alert(`\nWhat is Zerotrac Rating?\nZerotrac assigns a numeric difficulty rating (1000–3500+) to each LeetCode problem using user submissions and real solve statistics.\nYou can think of it as Leetcode contest rating.\nCredits: Ratings sourced from Zerotrac \n(https://github.com/zerotrac/leetcode_problem_rating)\n`)}
                                    title="What is Zerotrac Rating?"
                                >
                                    <span style={{ fontSize: '1.35em', display: 'flex', alignItems: 'center', lineHeight: 1 }}>❓</span>
                                    <span style={{ position: 'relative', top: 1 }}>Help</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
                {/* Main Content Switcher */}
                {activePage === 'home' ? (
                    <div className="problems-container">
                        <div className="problems-inner">
                            {/* Import Solved Button and Modal */}
                            <div style={{ marginBottom: 18, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <button
                                    style={{
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '0.6em 1.2em',
                                        fontWeight: 700,
                                        fontSize: '1.08rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                    }}
                                    onClick={() => setShowImportModal(true)}
                                >
                                    Import Solved from LeetCode
                                </button>
                                <button
                                    style={{
                                        background: '#f87171',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '0.6em 1.2em',
                                        fontWeight: 700,
                                        fontSize: '1.08rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                    }}
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to reset all "Done" marks? This cannot be undone.')) {
                                            setCompletedProblems([]);
                                            localStorage.setItem('completedProblems', JSON.stringify([]));
                                        }
                                    }}
                                >
                                    Reset All Done
                                </button>
                            </div>
                            {showImportModal && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    background: 'rgba(0,0,0,0.35)',
                                    zIndex: 9999,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <div style={{
                                        background: 'var(--card-bg)',
                                        borderRadius: 14,
                                        padding: '2.2rem 1.5rem',
                                        maxWidth: 420,
                                        width: '90vw',
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
                                        position: 'relative',
                                    }}>
                                        <h3 style={{ marginBottom: 12, color: 'var(--primary)', fontWeight: 800, fontSize: 22, textAlign: 'center' }}>Import Solved Problems</h3>
                                        <p style={{ fontSize: 15, marginBottom: 10, color: '#555', textAlign: 'center' }}>
                                            1. Log in to LeetCode and visit <a href="https://leetcode.com/api/problems/all/" target="_blank" rel="noopener noreferrer">this page</a>.<br />
                                            2. Copy all the text (Cmd+A, Cmd+C).<br />
                                            3. Paste it below and click Import.
                                        </p>
                                        <textarea
                                            value={importJson}
                                            onChange={e => setImportJson(e.target.value)}
                                            placeholder="Paste your LeetCode JSON here..."
                                            style={{ width: '100%', minHeight: 120, borderRadius: 8, border: '1px solid #bbb', padding: 10, fontSize: 15, marginBottom: 10, fontFamily: 'monospace' }}
                                        />
                                        {importError && <div style={{ color: 'red', marginBottom: 8, fontSize: 14 }}>{importError}</div>}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                            <button
                                                onClick={handleImportSolved}
                                                style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5em 1.2em', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                                            >
                                                Import
                                            </button>
                                            <button
                                                onClick={() => { setShowImportModal(false); setImportJson(''); setImportError(''); }}
                                                style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '0.5em 1.2em', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="filters-section">
                                <div className="filters-top">
                                    <input
                                        type="text"
                                        className="compact-filter"
                                        placeholder="Search problems..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ width: filterInputWidth, maxWidth: filterInputWidth, minWidth: 0, marginRight: isMobile ? 8 : 0 }}
                                    />
                                    <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="compact-filter" style={{ width: filterInputWidth, maxWidth: filterInputWidth, minWidth: 0, marginRight: isMobile ? 8 : 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        <option value="">All Companies</option>
                                        {allCompanies.map((company) => (
                                            <option key={company} value={company}>{company}</option>
                                        ))}
                                    </select>
                                    <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="compact-filter" style={{ width: filterInputWidth, maxWidth: filterInputWidth, minWidth: 0, marginRight: isMobile ? 8 : 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        <option value="">All Difficulties</option>
                                        {allDifficulties.map((diff) => (
                                            <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                                        ))}
                                    </select>
                                    <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="compact-filter" style={{ width: filterInputWidth, maxWidth: filterInputWidth, minWidth: 0, marginRight: isMobile ? 8 : 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        <option value="">All Topics</option>
                                        {allTopics.map((topic) => (
                                            <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                    <div className="rating-input-group compact-filter">
                                        <input
                                            type="number"
                                            placeholder="Min Rating"
                                            value={ratingRange.min}
                                            onChange={(e) => setRatingRange((prev) => ({ ...prev, min: e.target.value }))}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max Rating"
                                            value={ratingRange.max}
                                            onChange={(e) => setRatingRange((prev) => ({ ...prev, max: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="filters-bottom">
                                    <button onClick={() => setShowTopics(!showTopics)}
                                        style={{
                                            background: 'var(--primary)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '0.6em 1.2em',
                                            fontWeight: 700,
                                            fontSize: '1.08rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                        }}
                                    >
                                        {showTopics ? 'Hide Topics' : 'Show Topics'}
                                    </button>
                                    <button onClick={resetFilters}
                                        style={{
                                            background: '#f87171',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '0.6em 1.2em',
                                            fontWeight: 700,
                                            fontSize: '1.08rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                        }}
                                    >
                                        Reset All
                                    </button>
                                </div>
                            </div>

                            {isMobile ? (
                                <div>
                                    {currentProblems.map((problem, idx) => (
                                        <div key={problem.id} className={`problem-card${completedProblems.includes(Number(problem.id)) ? ' completed-row' : ''}`}>
                                            <h3>
                                                <a href={problem.url} target="_blank" rel="noopener noreferrer" style={{
                                                    color: 'var(--title-color)',
                                                    textDecoration: 'none'
                                                }}>
                                                    {problem.title}
                                                </a>
                                            </h3>
                                            <div className="meta">
                                                <span><b>ID:</b> {problem.id}</span>
                                                <span style={{ marginLeft: 8 }}><b>Difficulty:</b> <span className={`difficulty-badge difficulty-${problem.difficulty}`}>{problem.difficulty}</span></span>
                                                <span style={{ marginLeft: 8 }}><b>Rating:</b> {problem.rating || 'N/A'}</span>
                                            </div>
                                            {showTopics && problem.topics.length > 0 && (
                                                <div className="badges">
                                                    {problem.topics.slice(0, 3).map((topic, index) => (
                                                        <span key={index} className="topic-badge">{topic}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {problem.companies.length > 0 && (
                                                <div className="badges">
                                                    {(expandedCompanies[problem.id] ? problem.companies : problem.companies.slice(0, 3)).map((company, index) => (
                                                        <span key={index} className="company-badge">{company}</span>
                                                    ))}
                                                    {problem.companies.length > 3 && !expandedCompanies[problem.id] && (
                                                        <span
                                                            className="company-badge"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => toggleCompanies(problem.id)}
                                                        >
                                                            +{problem.companies.length - 3}
                                                        </span>
                                                    )}
                                                    {problem.companies.length > 3 && expandedCompanies[problem.id] && (
                                                        <span
                                                            className="company-badge"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => toggleCompanies(problem.id)}
                                                        >
                                                            …
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => toggleCompleted(problem.id)}
                                                className={`status-btn${completedProblems.includes(Number(problem.id)) ? ' completed' : ''}`}
                                                style={{ marginTop: 8 }}
                                            >
                                                {completedProblems.includes(Number(problem.id)) ? 'Done' : 'Mark Done'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="problems-table-container">
                                    <table className="problems-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                                        <colgroup>
                                            <col style={{ width: '6%' }} />
                                            <col style={{ width: '35%' }} />
                                            {showTopics && <col style={{ width: '22%' }} />}
                                            <col style={{ width: '20%' }} />
                                            <col style={{ width: '10%' }} />
                                            <col style={{ width: '10%' }} />
                                            <col style={{ width: '10%' }} />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th onClick={() => setSortConfig(prev => ({ key: 'id', direction: prev.key === 'id' && prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                                    ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th>Title</th>
                                                {showTopics && <th>Topics</th>}
                                                <th>Companies</th>
                                                <th onClick={() => setSortConfig(prev => ({ key: 'difficulty', direction: prev.key === 'difficulty' && prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                                    Difficulty {sortConfig.key === 'difficulty' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th
                                                    className={`sortable ${sortConfig.key === 'rating' ? 'sort-active' : ''} ${sortConfig.direction === 'asc' ? 'sort-asc' : ''}`}
                                                    onClick={() => setSortConfig(prev => ({
                                                        key: 'rating',
                                                        direction: prev.key === 'rating' && prev.direction === 'asc' ? 'desc' : 'asc'
                                                    }))}
                                                >
                                                    Rating <span className="sort-arrow">▲</span>
                                                </th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentProblems.map((problem, idx) => (
                                                <tr
                                                    key={problem.id}
                                                    className={completedProblems.includes(Number(problem.id)) ? 'completed-row' : ''}
                                                >
                                                    <td data-label="ID">{problem.id}</td>
                                                    <td data-label="Title">
                                                        <a href={problem.url} target="_blank" rel="noopener noreferrer" style={{
                                                            color: '#2563eb',
                                                            textDecoration: 'none',
                                                            color: 'var(--title-color)'
                                                        }}>
                                                            {problem.title}
                                                        </a>
                                                    </td>
                                                    {showTopics && (
                                                        <td data-label="Topics">
                                                            <div>
                                                                {problem.topics.slice(0, 3).map((topic, index) => (
                                                                    <span key={index} className="topic-badge">{topic}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td data-label="Companies">
                                                        <div>
                                                            {(expandedCompanies[problem.id] ? problem.companies : problem.companies.slice(0, 3)).map((company, index) => (
                                                                <span key={index} className="company-badge">{company}</span>
                                                            ))}
                                                            {problem.companies.length > 3 && !expandedCompanies[problem.id] && (
                                                                <span
                                                                    className="company-badge"
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => toggleCompanies(problem.id)}
                                                                >
                                                                    +{problem.companies.length - 3}
                                                                </span>
                                                            )}
                                                            {problem.companies.length > 3 && expandedCompanies[problem.id] && (
                                                                <span
                                                                    className="company-badge"
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => toggleCompanies(problem.id)}
                                                                >
                                                                    …
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td data-label="Difficulty">
                                                        <span className={`difficulty-badge difficulty-${problem.difficulty}`}>
                                                            {problem.difficulty}
                                                        </span>
                                                    </td>
                                                    <td data-label="Rating">{problem.rating || 'N/A'}</td>
                                                    <td data-label="Status">
                                                        <button
                                                            onClick={() => toggleCompleted(problem.id)}
                                                            className={`status-btn${completedProblems.includes(Number(problem.id)) ? ' completed' : ''}`}
                                                        >
                                                            {completedProblems.includes(Number(problem.id)) ? 'Done' : 'Mark Done'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <p className="rating-na-note">
                                * Ratings marked as "N/A" are for older problems and may not have official rating data.
                            </p>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Prev
                                    </button>
                                    {getPageNumbers().map((pageNum, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                                            disabled={pageNum === '...'}
                                            className={pageNum === currentPage ? 'active' : ''}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                            <div className="feedback-section">
                                <h3 style={{ marginBottom: '12px' }}>Feedback</h3>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Share your thoughts about the problems or suggest improvements..."
                                />
                                <button onClick={handleFeedbackSubmit}>
                                    Submit Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Dashboard
                        problems={problems}
                        completedProblems={completedProblems}
                        theme={theme}
                        isMobile={isMobile}
                    />
                )}
            </div>
        </div>
    );
};

export default Problems;

export const VisitCounter = () => {
    const [visits, setVisits] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/visits`)
            .then(res => res.json())
            .then(data => {
                setVisits(data.total);
            })
            .catch(err => console.error(err));
    }, []);

    const formatted =
        typeof visits === 'number' ? visits.toLocaleString('en-IN') : '...';
    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '12px',
                maxWidth: '280px',
                margin: '2rem auto',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
            }}
        >
            <div style={{ fontSize: '20px' }}>{formatted}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Api Hits</div>
        </div>
    );
};

function Dashboard({ problems, completedProblems, theme, isMobile }) {
    // Calculate stats
    const solvedSet = new Set(completedProblems.map(String));
    const solvedProblems = problems.filter(p => solvedSet.has(String(p.id)));
    const totalSolved = solvedProblems.length;
    const totalProblems = problems.length;
    const diffStats = { easy: 0, medium: 0, hard: 0 };
    const diffTotals = { easy: 0, medium: 0, hard: 0 };
    const topicStats = {};
    const allTopics = Array.from(new Set(problems.flatMap(p => p.topics || []))).sort();
    problems.forEach(p => {
        const diff = String(p.difficulty).toLowerCase();
        if (diffTotals[diff] !== undefined) diffTotals[diff]++;
        (p.topics || []).forEach(topic => {
            if (!topicStats[topic]) topicStats[topic] = { count: 0, ratingSum: 0, ratingCount: 0, total: 0 };
            topicStats[topic].total++;
        });
    });
    solvedProblems.forEach(p => {
        const diff = String(p.difficulty).toLowerCase();
        if (diffStats[diff] !== undefined) diffStats[diff]++;
        (p.topics || []).forEach(topic => {
            if (!topicStats[topic]) topicStats[topic] = { count: 0, ratingSum: 0, ratingCount: 0, total: 0 };
            topicStats[topic].count++;
            if (typeof p.rating === 'number' && p.rating > 0) {
                topicStats[topic].ratingSum += p.rating;
                topicStats[topic].ratingCount++;
            }
        });
    });
    const streak = 0; // Implement streak calculation
    const longestStreak = 0; // Implement longest streak calculation
    return (
        <div style={{ padding: isMobile ? '1.2rem 0.3rem' : '2.5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            {streak > 0 || longestStreak > 0 && (
                <div
                    style={{
                        background: 'linear-gradient(90deg, #fbbf24 0%, #f87171 100%)',
                        color: '#fff',
                        borderRadius: 18,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
                        padding: isMobile ? '1.1rem 0.7rem' : '1.2rem 2rem',
                        margin: isMobile ? '0 auto 1.2rem auto' : '0 auto 2.2rem auto',
                        maxWidth: isMobile ? 340 : 500,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        gap: isMobile ? 8 : 18,
                        fontFamily: 'inherit',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        textAlign: isMobile ? 'center' : 'left',
                    }}
                >
                    <span style={{ fontSize: isMobile ? 28 : 32, marginRight: isMobile ? 0 : 8, lineHeight: 1, marginBottom: isMobile ? 6 : 0 }}>🔥</span>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? 17 : 20, letterSpacing: 0.5, marginBottom: isMobile ? 2 : 0 }}>
                        {streak > 0 ? `Current streak: ${streak} day${streak > 1 ? 's' : ''}` : 'No current streak'}
                    </div>
                    <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 500, marginLeft: isMobile ? 0 : 18 }}>
                        {longestStreak > 0 ? `Longest streak: ${longestStreak} day${longestStreak > 1 ? 's' : ''}` : ''}
                    </div>
                </div>
            )}
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '2.2rem', textAlign: 'center', letterSpacing: '1px' }}>Progress Dashboard</h2>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                    gap: isMobile ? 18 : 36,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 48,
                    maxWidth: isMobile ? '100vw' : undefined,
                    boxSizing: 'border-box',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}
            >
                {/* Circle Stat Cards */}
                <CircleStat label="Total" value={`${totalSolved}/${totalProblems}`} color="var(--primary)" theme={theme} isMobile={isMobile} />
                <CircleStat label="Easy" value={`${diffStats.easy}/${diffTotals.easy}`} color="#22c55e" theme={theme} isMobile={isMobile} />
                <CircleStat label="Medium" value={`${diffStats.medium}/${diffTotals.medium}`} color="#f59e0b" theme={theme} isMobile={isMobile} />
                <CircleStat label="Hard" value={`${diffStats.hard}/${diffTotals.hard}`} color="#ef4444" theme={theme} isMobile={isMobile} />
            </div>
            <div style={{ background: 'var(--card-bg)', borderRadius: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '2rem 2.5rem', margin: '0 auto', maxWidth: 900 }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 18, textAlign: 'center' }}>Per-Topic Progress</h3>
                <div style={{ marginTop: 18, color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 18 }}>
                    Note: Avg. Rating is calculated only from the problems you have marked as done for each topic.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))',
                        gap: isMobile ? 12 : 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto',
                        maxWidth: isMobile ? '100%' : 700,
                        marginTop: 0,
                    }}>
                        {allTopics.length === 0 && (
                            <div style={{ color: '#888', textAlign: 'center', gridColumn: '1/-1' }}>No topics found.</div>
                        )}
                        {allTopics.map(topic => {
                            const stat = topicStats[topic] || { count: 0, ratingSum: 0, ratingCount: 0, total: 0 };
                            return (
                                <div key={topic} style={{
                                    background: '#f8fafc',
                                    borderRadius: 14,
                                    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                                    padding: isMobile ? '0.7rem 0.6rem' : '1.2rem 1.1rem',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginBottom: isMobile ? 10 : 0,
                                    fontSize: isMobile ? 13 : 15,
                                    minWidth: 0,
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 18, color: 'var(--primary)', marginBottom: 4 }}>{topic}</div>
                                    <div style={{ fontSize: isMobile ? 12 : 15, color: '#555', marginBottom: 2 }}>Solved: <b>{stat.count}/{stat.total}</b></div>
                                    <div style={{ fontSize: isMobile ? 12 : 15, color: '#555' }}>Avg. Rating: <b>{stat.ratingCount > 0 ? (stat.ratingSum / stat.ratingCount).toFixed(1) : 'N/A'}</b></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// CircleStat component
function CircleStat({ label, value, color, theme, isMobile }) {
    const [solved, total] = value.split('/');
    const size = isMobile ? 80 : 120;
    const fontSizeMain = isMobile ? 22 : 32;
    const fontSizeSub = isMobile ? 13 : 18;
    const fontSizeLabel = isMobile ? 13 : 17;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: size }}>
            <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: theme === 'dark' ? '#232b3a' : '#fff',
                border: `4px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                marginBottom: isMobile ? 10 : 16,
                padding: '0 6px',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}>
                <div style={{ fontWeight: 800, fontSize: fontSizeMain, lineHeight: 1 }}>{solved}</div>
                <div style={{ width: isMobile ? 22 : 36, height: 2, background: color, borderRadius: 2, margin: isMobile ? '4px 0' : '6px 0' }} />
                <div style={{ fontWeight: 600, fontSize: fontSizeSub, color: color + 'bb', lineHeight: 1 }}>{total}</div>
            </div>
            <div style={{ fontSize: fontSizeLabel, color: color, fontWeight: 700 }}>{label}</div>
        </div>
    );
}
