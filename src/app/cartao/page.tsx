import CustomerShell from "@/components/CustomerShell";
import CustomerCard from "@/components/CustomerCard";

export const metadata = { title: "Cartão virtual | Lava Já Smart" };
export default function CardPage() { return <CustomerShell active="/cartao"><CustomerCard /></CustomerShell>; }
