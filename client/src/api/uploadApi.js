import { http } from './http';

export const uploadApi = {
  send: (file) => {
    const form = new FormData();
    form.append('file', file);
    return http.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
