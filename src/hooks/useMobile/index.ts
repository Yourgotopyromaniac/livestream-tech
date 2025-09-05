import { useEffect, useState } from "react";

interface MobileProps {
  size?: number;
  onMobile?: () => void;
  onDesktop?: () => void;
}

const useMobile = ({ size = 800, onMobile, onDesktop }: MobileProps) => {
  const [isMobile, setMobile] = useState(
    window.innerWidth <= size ? true : false
  );
  useEffect(() => {
    const screenSizeUpdate = () => {
      if (window.innerWidth <= size) {
        setMobile(true);
        onMobile && onMobile();
      } else {
        setMobile(false);
        onDesktop && onDesktop();
      }
    };

    screenSizeUpdate();

    window.addEventListener("resize", screenSizeUpdate);
    window.addEventListener("onload", screenSizeUpdate);

    return () => {
      window.removeEventListener("resize", screenSizeUpdate);
      window.addEventListener("onload", screenSizeUpdate);
    };
  }, [size]);

  return { isMobile };
};

export { useMobile };
