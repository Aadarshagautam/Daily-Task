import api from '../lib/axios'

const leadsApi = {
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  updateStage: (id, stage) => api.patch(`/leads/${id}/stage`, { stage }),
  addNote: (id, text) => api.post(`/leads/${id}/notes`, { text }),
  delete: (id) => api.delete(`/leads/${id}`),
}

export default leadsApi
