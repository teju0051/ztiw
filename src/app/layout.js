import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
  title: "Staff Portal HQ",
  description: "Task management and team communication",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
