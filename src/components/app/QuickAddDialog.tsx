import { useState } from "react";
import { Boxes, CircleDollarSign, Plus, WalletCards, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSnackbar } from "notistack";
import ExpenseFormPage from "../../pages/ExpenseFormPage";
import ProductFormPage from "../../pages/ProductFormPage";
import SaleFormPage from "../../pages/SaleFormPage";

type AddFormType = "sale" | "expense" | "product";

const formMeta: Record<
  AddFormType,
  {
    title: string;
    savedMessage: string;
    icon: LucideIcon;
    tone: string;
  }
> = {
  sale: {
    title: "Record Sale",
    savedMessage: "Sale recorded.",
    icon: CircleDollarSign,
    tone: "bg-mint text-leaf",
  },
  expense: {
    title: "Add Expense",
    savedMessage: "Expense added.",
    icon: WalletCards,
    tone: "bg-orange-50 text-clay",
  },
  product: {
    title: "Add Product",
    savedMessage: "Product added.",
    icon: Boxes,
    tone: "bg-sky-50 text-sky-700",
  },
};

type QuickAddDialogProps = {
  formType: AddFormType;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerIconSize?: number;
  onSaved?: () => void | Promise<void>;
};

export default function QuickAddDialog({
  formType,
  triggerLabel,
  triggerClassName = "inline-flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90",
  triggerIconSize = 15,
  onSaved,
}: QuickAddDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isOpen, setIsOpen] = useState(false);
  const meta = formMeta[formType];
  const Icon = meta.icon;

  const close = () => setIsOpen(false);

  const handleSaved = () => {
    close();
    enqueueSnackbar(meta.savedMessage, { variant: "success" });
    void onSaved?.();
  };

  const form = {
    sale: <SaleFormPage embedded onClose={close} onSaved={handleSaved} />,
    expense: <ExpenseFormPage embedded onClose={close} onSaved={handleSaved} />,
    product: <ProductFormPage embedded onClose={close} onSaved={handleSaved} />,
  }[formType];

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={triggerClassName}>
        <Plus size={triggerIconSize} aria-hidden="true" />
        {triggerLabel ?? meta.title}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-3 py-5 backdrop-blur-sm sm:px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-form-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-card"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-leaf">Add form</p>
                  <h2 id="quick-add-form-title" className="font-display text-xl font-extrabold text-ink">
                    {meta.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-[#eef8f4] hover:text-ink"
                aria-label="Close form dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#f7faf9] px-4 py-4 sm:px-5">{form}</div>
          </div>
        </div>
      )}
    </>
  );
}
