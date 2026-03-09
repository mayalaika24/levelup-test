import { MOCK_USER } from "@/data/mock-user";
import { LoginInput } from "@/lib/validations/auth";

type LoginSuccessResponse = {
  success: true;
  user: typeof MOCK_USER;
};

type LoginErrorResponse = {
  success: false;
  message: string;
};

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

export const loginUser = async (data: LoginInput): Promise<LoginResponse> => {

  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (data.username === MOCK_USER.username && data.password === MOCK_USER.password) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userDisplayName", MOCK_USER.name);

    return {
      success: true,
      user: MOCK_USER,
    };
  }

  return {
    success: false,
    message: "Invalid username or password",
  };
};
