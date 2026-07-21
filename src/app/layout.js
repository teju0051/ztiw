import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
  title: "ZTIW",
  description: "ZTIW AI DIVISION OF Zen-Tech ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
