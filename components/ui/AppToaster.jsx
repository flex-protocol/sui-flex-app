import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      toastOptions={{
        className: "text-body-normal shadow-lg",
        duration: 5000,
        style: {
          padding: "12px 18px",
        },
      }}
      position="bottom-right"
      containerStyle={{
        bottom: 30,
        right: 40,
      }}
    />
  );
}
