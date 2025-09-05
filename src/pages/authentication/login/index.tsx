import { adminLoginRequestBody } from "@/api";
import { LoginUI } from "@/modules";

export const initLogin: adminLoginRequestBody = {
  email: "",
  password: "",
};

const Login = () => {
  return (
    <>
      <LoginUI />
    </>
  );
};

export { Login };
