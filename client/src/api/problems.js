const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export const fetchProblems = async () => {
    const res = await fetch('http://localhost:3003/api/problems');
    if (!res.ok) throw new Error('Failed to fetch problems');
    return await res.json();
};