import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
// <-- NUEVO: Importa el Provider (Ajusta la ruta si tu UserContext está en otra carpeta)
import { UserProvider } from "@/app/context/UserContext"; 

export default function AdminLayout({ children }) {
  return (
    // <-- NUEVO: Envuelve todo el div principal con UserProvider
    <UserProvider> 
      <div className="flex h-screen bg-gray-50 p-4 md:p-6 gap-6 font-sans overflow-hidden">
        
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0"> 
          <Navbar />
          <main className="flex-1 overflow-y-auto rounded-3xl">
            {children}
          </main>
        </div>

      </div>
    </UserProvider>
  );
}