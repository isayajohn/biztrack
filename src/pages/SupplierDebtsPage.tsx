import { useEffect, useState } from "react";
import DebtListView from "../components/app/DebtListView";
import { getSuppliers } from "../services/inventoryApi";

export default function SupplierDebtsPage() {
  const [parties, setParties] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getSuppliers()
      .then((suppliers) => setParties(suppliers.map((s) => ({ id: s.id, name: s.name }))))
      .catch(() => undefined);
  }, []);

  return <DebtListView type="SUPPLIER" parties={parties} partyLabel="Supplier" />;
}
