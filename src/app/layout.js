import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
  title: "Zen-Tech Intelligence Wing",
  description: "AI DIvision of Zen-Tech ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
