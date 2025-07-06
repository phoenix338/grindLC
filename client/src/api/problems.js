const API_URL = import.meta.env.VITE_API_URL;

export const fetchProblems = async () => {
    const res = await fetch(`${API_URL}/problems`);
    if (!res.ok) throw new Error('Failed to fetch problems');
    return await res.json();
};