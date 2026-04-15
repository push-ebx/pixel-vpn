import { Logo } from "./Logo";

type LogoLoaderProps = {
  isLoading: boolean;
  className?: string;
};

export function LogoLoader({ isLoading, className }: LogoLoaderProps) {
  return (
    <div
      className={`logo-loader flex items-center justify-center ${
        isLoading ? "is-loading" : ""
      } ${className ?? ""}`}
    >
      <Logo width="100%" height="100%" />
    </div>
  );
}
