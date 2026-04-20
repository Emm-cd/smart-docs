import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext"; // Importamos el proveedor

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SmartDocs",
  description: "Documentación y administración de mi SaaS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* Mantenemos suppressHydrationWarning aquí y usamos tu fuente Inter */}
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}