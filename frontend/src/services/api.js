import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Questo URL sarà aggiornato quando il back-end sarà disponibile

export const submitUserResponses = (responses) => {
  return axios.post(`${API_URL}/submit`, responses);
};
