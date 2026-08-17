import { useState } from "react";
import type {
  BillingCycle,
  Subscription,
  SubscriptionStatus,
} from "../domain/subscription";

interface Props {
  providerId: string;
  onSave: (subscription: Subscription) => void;
  onCancel: () => void;
}

export function ManualSubscriptionForm({
  providerId,
  onSave,
  onCancel,
}: Props) {
  const [planName, setPlanName] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [renewsAt, setRenewsAt] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!planName.trim()) {
      return;
    }

    const subscription: Subscription = {
      id: `${providerId}-${Date.now()}`,
      providerId,
      planName: planName.trim(),
      status,
      price: price ? Number(price) : undefined,
      currency: currency || undefined,
      billingCycle,
      renewsAt: renewsAt
        ? new Date(`${renewsAt}T00:00:00`).toISOString()
        : undefined,
      source: "user",
      lastUpdatedAt: new Date().toISOString(),
    };

    onSave(subscription);
  };

  return (
    <form className="subscription-form" onSubmit={handleSubmit}>
      <h2>Add {providerId} subscription</h2>

      <label>
        Plan
        <input
          value={planName}
          onChange={(event) => setPlanName(event.target.value)}
          placeholder="e.g. Go, Plus, Pro"
          required
        />
      </label>

      <label>
        Status
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as SubscriptionStatus)
          }
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>

      <label>
        Price
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>

      <label>
        Currency
        <input
          value={currency}
          onChange={(event) => setCurrency(event.target.value.toUpperCase())}
        />
      </label>

      <label>
        Billing cycle
        <select
          value={billingCycle}
          onChange={(event) =>
            setBillingCycle(event.target.value as BillingCycle)
          }
        >
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
          <option value="custom">Custom</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>

      <label>
        Renewal date
        <input
          type="date"
          value={renewsAt}
          onChange={(event) => setRenewsAt(event.target.value)}
        />
      </label>

      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>

        <button type="submit" className="primary-button">
          Save subscription
        </button>
      </div>
    </form>
  );
}
