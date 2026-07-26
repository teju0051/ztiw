import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
  title: "Zen-Tech Intelligence Wing",
  description: "ZTIW AI Division of Zen-Tech",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
        {/* Reliable Tailwind Injection */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}