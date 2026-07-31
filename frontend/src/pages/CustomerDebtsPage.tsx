import { useEffect, useState } from "react";
import DebtListView from "../components/app/DebtListView";
import { getCustomers } from "../services/customerApi";

export default function CustomerDebtsPage() {
  const [parties, setParties] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getCustomers()
      .then((data) => setParties(data.customers.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => undefined);
  }, []);

  return <DebtListView type="CUSTOMER" parties={parties} partyLabel="Customer" />;
}
