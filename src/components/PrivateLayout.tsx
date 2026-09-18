// Composant de layout pour les routes privées (non-traduites)
// Utilisé par les layouts de connexion, dirigeant, usine, chauffeur, client
import { AuthProvider } from "@/lib/auth-context";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import MobileBottomNav from "@/components/MobileBottomNav";
import PwaRegister from "@/components/PwaRegister";
import AnalyticsScripts from "@/components/Analytics";
import { getDictionary } from "@/lib/dictionaries";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary('fr');
  return (
    <AuthProvider>
      <Navigation lang="fr" dict={dict.nav} entrepriseLinks={dict.entrepriseLinks} />
      <div className="pt-20 pb-16 md:pb-0 min-h-screen flex flex-col justify-between">
        <div>{children}</div>
        <Footer lang="fr" dict={dict.footer} />
      </div>
      <ChatBot />
      <MobileBottomNav />
      <PwaRegister />
      <AnalyticsScripts />
    </AuthProvider>
  );
}
