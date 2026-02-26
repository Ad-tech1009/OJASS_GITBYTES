import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const uploadPDF = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getCases = () => api.get('/cases');

export const getCase = (caseId) => api.get(`/cases/${caseId}`);

export default api;