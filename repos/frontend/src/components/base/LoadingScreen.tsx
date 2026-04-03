import { LoadingSpinner } from "./LoadingSpinner";

export function LoadingScreen() {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
