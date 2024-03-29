import axios from "axios";

// Create an instance of axios
const axiosInstance = axios.create({});

// // Add request interceptors if needed
// axiosInstance.interceptors.request.use(
//   (config) => {
//     // Modify config if needed (e.g., add authorization headers)
//     const token = localStorage.getItem("accessToken"); // Example: Retrieve access token from localStorage
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log("token", token);
//     }
//     return config;
//   },
//   (error) => {
//     // Handle request error
//     return Promise.reject(error);
//   }
// );

// // Add response interceptors if needed
// axiosInstance.interceptors.response.use(
//   (response) => {
//     // Handle response data if needed
//     return response;
//   },
//   (error) => {
//     // Handle response error
//     if (error.response.status === 401) {
//       // Redirect user to login page or display error message
//       console.log("Unauthorized. Redirect to login page.");
//     }
//     return Promise.reject(error);
//   }
// );

// Function to make API requests
export const apiConnector = (method, url, bodyData, headers, params) => {
    console.log("Input",method, url, bodyData, headers, params);
   
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: bodyData ? bodyData : null,
    headers: headers ? headers: null,
    params: params ? params : null,
  });
};

export default axiosInstance;