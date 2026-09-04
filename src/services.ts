import axios from 'axios';

interface SignupRequest {
  "email": string;
  "password": string;
}

interface SignupResponse {
  "user": {
    "id": string;
    "email": string;
  };
  "token": string;
}
interface LoginRequest{
     "email": string,
    "password": string

}
interface LoginResponse{
    "user": {
    "id": string,
    "email": string
  },
  "token": string

}

const base_url = 'https://smebackend-production-f891.up.railway.app';

export async function signUp(payload: SignupRequest): Promise<SignupResponse> {
  try {
    const response = await axios.post<SignupResponse>(
      `${base_url}/auth/signup`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

    return response.data; 
  } catch (error) {
    console.error("Signup request failed:", error);
    throw error; 
  }
}
export async function Login(payload:LoginRequest):Promise<LoginResponse>{
    try {
    const response = await axios.post<LoginResponse>(
      `${base_url}/auth/login`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

    return response.data; 
  } catch (error) {
    console.error("Login request failed:", error);
    throw error; 
  }


}
