import axiosClient from './axiosClient';

export const productService = {
  getAll: () => axiosClient.get('/api/products'),
  getById: (id: string) => axiosClient.get(`/api/products/${id}`),
  create: (data: any) => axiosClient.post('/api/products', data),
  update: (id: string, data: any) => axiosClient.put(`/api/products/${id}`, data),
  remove: (id: string) => axiosClient.delete(`/api/products/${id}`),
};

export const authService = {
  login: (email: string, password: string) =>
    axiosClient.post('/api/auth/login', { email, password }),
  register: (data: any) => axiosClient.post('/api/auth/register', data),
};