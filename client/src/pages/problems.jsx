import { useState, useEffect } from 'react';
import { fetchProblems } from '../api/problems';
import '../styles.css';

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
        setCompletedProblems(prev => {
            if (prev.includes(problemId)) {
                return prev.filter(id => id !== problemId);
            } else {
                return [...prev, problemId];
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
        <div className="problems-container">
            <div className="problems-inner">
                { }
                <nav className="navbar">
                    <div className="navbar-title">
                        GrindLC

                        <span className="navbar-progress">
                            {stats.completed} / {stats.total} solved
                        </span>
                    </div>
                    <div className="navbar-diff">
                        <span className="diff-easy">
                            Easy: {difficultyStats.easy.completed}/{difficultyStats.easy.total}
                        </span>
                        <span className="diff-medium">
                            Medium: {difficultyStats.medium.completed}/{difficultyStats.medium.total}
                        </span>
                        <span className="diff-hard">
                            Hard: {difficultyStats.hard.completed}/{difficultyStats.hard.total}
                        </span>
                    </div>
                    <button
                        className="theme-toggle-btn"
                        onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? '🌞' : '🌙'}
                    </button>
                    <button className="help-btn" onClick={() => alert(`
What is Zerotrac Rating?
Zerotrac assigns a numeric difficulty rating (1000–3500+) to each LeetCode problem using user submissions and real solve statistics.
You can think of it as Leetcode contest rating.
Credits: Ratings sourced from Zerotrac 
(https://github.com/zerotrac/leetcode_problem_rating)
`)}>
                        ❓ Help
                    </button>
                </nav>

                { }
                <div className="filters-section">
                    <div className="filters-top">
                        <input
                            type="text"
                            className="compact-filter"
                            placeholder="Search problems..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="compact-filter">
                            <option value="">All Companies</option>
                            {allCompanies.map((company) => (
                                <option key={company} value={company}>{company}</option>
                            ))}
                        </select>
                        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="compact-filter">
                            <option value="">All Difficulties</option>
                            {allDifficulties.map((diff) => (
                                <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                            ))}
                        </select>
                        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="compact-filter">
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
                        <button onClick={() => setShowTopics(!showTopics)}>
                            {showTopics ? 'Hide Topics' : 'Show Topics'}
                        </button>
                        <button onClick={resetFilters}>Reset All</button>
                    </div>
                </div>



                { }

                { }
                {isMobile && (
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <select
                            value={sortConfig.key}
                            onChange={e => setSortConfig({ key: e.target.value, direction: sortConfig.direction })}
                            style={{ fontSize: 14, padding: '6px 10px', borderRadius: 6 }}
                        >
                            <option value="rating">Sort by Rating</option>
                            <option value="id">Sort by ID</option>
                            <option value="difficulty">Sort by Difficulty</option>
                        </select>
                        <button
                            style={{ marginLeft: 8, fontSize: 14, padding: '6px 10px', borderRadius: 6 }}
                            onClick={() => setSortConfig(sc => ({ ...sc, direction: sc.direction === 'asc' ? 'desc' : 'asc' }))}
                        >
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </button>
                    </div>
                )}
                {isMobile ? (
                    <div>
                        {currentProblems.map((problem, idx) => (
                            <div key={problem.id} className={`problem-card${completedProblems.includes(problem.id) ? ' completed-row' : ''}`}>
                                <h3>
                                    <a href={problem.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
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
                                    className={`status-btn${completedProblems.includes(problem.id) ? ' completed' : ''}`}
                                    style={{ marginTop: 8 }}
                                >
                                    {completedProblems.includes(problem.id) ? 'Done' : 'Mark Done'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="problems-table-container">
                        <table className="problems-table" style={{ width: '100%', tableLayout: 'fixed' }}>
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
                                        className={completedProblems.includes(problem.id) ? 'completed-row' : ''}
                                    >
                                        <td data-label="ID">{problem.id}</td>
                                        <td data-label="Title">
                                            <a href={problem.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
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
                                                className={`status-btn${completedProblems.includes(problem.id) ? ' completed' : ''}`}
                                            >
                                                {completedProblems.includes(problem.id) ? 'Done' : 'Mark Done'}
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

                { }
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
        </div >
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
