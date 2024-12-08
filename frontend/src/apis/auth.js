import axios from 'axios';

//export const url = process.env.URL'https://stream-sync-production-6ee8.up.railway.app';
//export const url = import.meta.env.VITE_BACKEND_URL.trim() || 'http://localhost:8000';
export const url = 'http://localhost:8000';

console.log(localStorage.getItem('userToken'))

const API = (token) =>
  axios.create({
    baseURL: url,
    headers: { Authorization: token },
  });



// export const loginUser = async (body) => {
//   try {
//     return await axios.post(`${url}/auth/login`, body);
//   } catch (error) {
//     console.log('error in loginuser api');
//   }
// };

export const googleLoginUser = async (body) => {
  try {
    return await axios.post(`${url}/auth/google`, body);
  } catch (error) {
    console.log('error in google-loginuser api');
  }
};


// export const registerUser = async (body) => {
//   try {
//     return await axios.post(`${url}/auth/register`, body);
    
//   } catch (error) {
//     if (error.response && error.response.data && error.response.data.error) {
//       return { error: error.response.data.error };
//     } else {
//       return { error: "An unexpected error occurred." };
//     }
//   }
// };
export const validUser = async () => {
  try {
    const token = localStorage.getItem('userToken');
    const { data } = await API(token).get(`/auth/valid`, {
      headers: { Authorization: token },
    });
    return data;
  } catch (error) {
    console.log('error in valid user api');
  }
};
