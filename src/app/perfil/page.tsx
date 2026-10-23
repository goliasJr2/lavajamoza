import CustomerShell from "@/components/CustomerShell";
import CustomerAccount from "@/components/CustomerAccount";

export const metadata = { title: "Perfil do cliente | Lava Já Smart" };
export default function ProfilePage() { return <CustomerShell active="/perfil"><CustomerAccount /></CustomerShell>; }
