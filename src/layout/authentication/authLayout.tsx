import type { ReactNode } from "react";
import Illustration from "../../assets/illustration.png";
interface ContainerProps {
  children: ReactNode;
}
const AuthLayout: React.FC<ContainerProps> = ({ children }) => {
  return (
    <div className="bg-[#101010] w-screen h-full p-6 py-0 flex items-center justify-center">
      <div className="w-full flex items-center justify-between h-full">
        <div className="w-1/2 h-screen lg:flex hidden overflow-hidden rounded-[30px] items-center justify-center">
          <img src={Illustration} />
        </div>

        <div className="lg:w-1/2 w-full h-screen flex flex-col gap-4 items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};

export { AuthLayout };
